const faunadb = require('faunadb');
const cookie = require('cookie');
const parseRef = require('./util/db/parse-ref');
const verifyToken = require('./auth/verify-token');
const createToken = require('./auth/create-token');
const createTokenCookies = require('./auth/create-token-cookies');
const defaultHeaders = require('./util/default-headers.json');

const db = new faunadb.Client({ secret: process.env.SERVER_KEY });
const q = faunadb.query;

exports.handler = async (event, context) => {
    const data = new URLSearchParams(event.body);
    const cookies = (event.headers.cookie) ? cookie.parse(event.headers.cookie) : {};

    const refreshToken = data.get('token') || cookies['cba.auth.ref'];

    let verified;

    // Verify the passed token
    try {
        verified = verifyToken(refreshToken, true);
        console.log(verified);
        console.log(verified.userRef);
    } catch(err) {
        console.error(err);
        const errCode = 401;

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

    const userRef = parseRef(verified.userRef);
    const tokenData = { userRef: verified.userRef };

    // Create the tokens
    const newAccessToken = createToken(tokenData);
    const newRefreshToken = createToken(tokenData, true);

    try {
        const tokensResp = await db.query(
            q.Map(
                q.Paginate(q.Match(q.Index('TokensByUser'), userRef)),
                q.Lambda('tokenRef', q.Get(q.Var('tokenRef')))
            )
        );

        let currentTokenRef;
        let isAlreadyUsed = false;
        let invalidTokenRefs = [];

        tokensResp.data.forEach(tokenDoc => {
            const { token, used } = tokenDoc.data;
            let verifiedToken;
            console.log(tokenDoc.ref);

            // Check if the token is still valid
            try {
                verifiedToken = verifyToken(token, true);
            } catch(e) {
                console.warn(`Db token expired: ${tokenDoc.ref}\n`, e);
            }

            // Update the status if it's the current refresh token
            if(token === refreshToken) {
                currentTokenRef = tokenDoc.ref;
                isAlreadyUsed = used;
            }

            // Add the tokens which are still valid to the array
            if(!verifiedToken) {
                invalidTokenRefs.push(tokenDoc.ref);
            }
        });

        // Check if the current refresh token is untracked or used
        if(!currentTokenRef || isAlreadyUsed) {
            const tokenRefs = tokensResp.data.map(doc => doc.ref);

            // Delete all tokens on user
            const delResp = await db.query(
                q.Map(
                    tokenRefs,
                    q.Lambda('tokenRef', q.Delete(q.Var('tokenRef')))
                )
            );
            console.log('del resp:\n', delResp);

            // Throw an error as this is likely a questionable or duplicate attempt.
            const error = new Error('Request Denied');
            error.status = 401;
            throw error;
        }

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

        // Update current token's status
        await db.query(
            q.Update(
                currentTokenRef,
                { data: { used: true }}
            )
        );
        
        // Update the db with the new token
        await db.query(
            q.Create(
                q.Collection('Tokens'),
                { data: {
                    token: newRefreshToken,
                    used: false,
                    user: userRef
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

    const newCookies = createTokenCookies(newAccessToken, newRefreshToken);

    // Return the tokens in the response cookies
    return {
        statusCode: 200,
        headers: defaultHeaders,
        multiValueHeaders: { 'Set-Cookie': newCookies },
        body: JSON.stringify({
            status: 'success',
            message: 'Valid token. Refresh authorized.'
        })
    };
};