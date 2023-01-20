const faunadb = require('faunadb');
const bcrypt = require('bcryptjs');
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
        return {
            statusCode: 400,
            headers: defaultHeaders,
            body: JSON.stringify({
                status: 'failure',
                error: 'Invalid credentials'
            })
        }
    }

    let hashedPwd;

    // Hash the password
    try {
        const salt = await bcrypt.genSalt(10);
        hashedPwd = await bcrypt.hash(password, salt);
    } catch(err) {
        console.error(err);
        return {
            statusCode: 500,
            headers: defaultHeaders,
            body: JSON.stringify({
                status: 'failure',
                error: 'Unable to process credentials'
            })
        }
    }

    let accessToken;
    let refreshToken;

    // Attempt to store the user and token in the db
    try {
        const userDoc = await db.query(
            q.Create(
                q.Collection('Users'), 
                { data: { 
                    username: username, 
                    password: hashedPwd 
                }}
            )
        );

        const tokenData = { userRef: userDoc.ref };

        // Create the tokens
        accessToken = createToken(tokenData);
        refreshToken = createToken(tokenData, true);

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
        return {
            statusCode: err.requestResult?.statusCode || err.status || 500,
            headers: defaultHeaders,
            body: JSON.stringify({
                status: 'failure',
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