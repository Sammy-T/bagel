const faunadb = require('faunadb');
const bcrypt = require('bcrypt');
const { findInvalidTokens } = require('./util/db/stored-tokens');
const createToken = require('./auth/create-token');
const createTokenCookies = require('./auth/create-token-cookies');
const defaultHeaders = require('./util/default-headers.json');

const db = new faunadb.Client({ secret: process.env.SERVER_KEY });
const q = faunadb.query;

exports.handler = async (event, context) => {
    const data = new URLSearchParams(event.body);
    const username = data.get('username');
    const password = data.get('password');

    const userRe = /^[a-zA-Z]\w{4,29}$/;
    const pwdRe = /^[a-zA-Z]\S{11,}$/;

    // Validate input
    if(!userRe.test(username) || !pwdRe.test(password)) {
        const errCode = 400;

        return {
            statusCode: errCode,
            headers: defaultHeaders,
            body: JSON.stringify({
                status: 'failure',
                code: errCode,
                error: 'Invalid credentials'
            })
        }
    }

    let accessToken;
    let refreshToken;

    // Attempt to retrieve the document with the matching username
    try {
        const userDoc = await db.query(
            q.Get(
                q.Match(q.Index('UserByUsername'), username)
            )
        );

        const pwdIsValid = await bcrypt.compare(password, userDoc.data.password);

        // Throw an error if the entered password is invalid
        if(!pwdIsValid) {
            const error = new Error('Access Denied');
            error.status = 401;
            throw error;
        }

        // Find invalid tokens
        const invalidTokenRefs = await findInvalidTokens(userDoc.ref);

        // Delete invalid tokens
        if(invalidTokenRefs.length > 0) {
            const delResp = await db.query(
                q.Map(
                    invalidTokenRefs,
                    q.Lambda('tokenRef', q.Delete(q.Var('tokenRef')))
                )
            );
            console.log('del resp:\n', delResp);
        }

        const tokenData = { userRef: userDoc.ref };

        // Create new tokens
        accessToken = createToken(tokenData);
        refreshToken = createToken(tokenData, true);

        // Update the db with the new token
        await db.query(
            q.Create(
                q.Collection('Tokens'),
                { data: {
                    token: refreshToken,
                    used: false,
                    user: userDoc.ref
                }}
            )
        );
    } catch(err) {
        console.error(err);
        const errCode = err.requestResult?.statusCode || err.status || 500;

        return {
            statusCode: errCode,
            headers: defaultHeaders,
            body: JSON.stringify({
                status: 'failure',
                code: errCode,
                error: err.message
            })
        };
    }

    const cookies = createTokenCookies(accessToken, refreshToken);

    // Return the tokens in the response cookies
    return {
        statusCode: 200,
        headers: defaultHeaders,
        multiValueHeaders: { 'Set-Cookie': cookies },
        body: JSON.stringify({
            status: 'success',
            message: 'Valid credentials'
        })
    };
};