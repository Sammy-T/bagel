const cookie = require('cookie');
const PouchDb = require('pouchdb');
const verifyToken = require('./auth/verify-token');
const createToken = require('./auth/create-token');
const createTokenCookies = require('./auth/create-token-cookies');
const defaultHeaders = require('./util/default-headers.json');

exports.handler = async (event, context) => {
    const data = new URLSearchParams(event.body);
    const cookies = cookie.parse(event.headers.cookie);

    const refreshToken = data.get('token') || cookies['cba.auth.ref'];

    let verified;

    // Verify the passed token
    try {
        verified = verifyToken(refreshToken, true);
        console.log(verified);
        console.log(verified.username);
    } catch(err) {
        console.error(err);
        return {
            statusCode: 401,
            headers: defaultHeaders,
            body: JSON.stringify({
                status: 'failure',
                error: err.message
            })
        };
    }

    const { username } = verified;

    // Create the tokens
    const newAccessToken = createToken(username);
    const newRefreshToken = createToken(username, true);

    const db = new PouchDb('test-db');

    try {
        const doc = await db.get(username);

        let isInDb = false;
        let isAlreadyUsed = false;
        let validTokens = [{ token: newRefreshToken, used: false }];
        
        doc.refreshTokens.forEach(tokenStatus => {
            const { token, used } = tokenStatus;
            let verifiedToken;

            // Check if the token is still valid
            try {
                verifiedToken = verifyToken(token, true);
            } catch(e) {
                console.warn(e);
            }

            // Update the status if it's the current refresh token
            if(token === refreshToken) {
                isInDb = true;
                isAlreadyUsed = used;
                tokenStatus.used = true;
            }

            // Add the tokens which are still valid to the array
            if(verifiedToken) {
                validTokens.push(tokenStatus);
            }
        });

        // Update the stored valid refresh tokens.
        // If the current refresh token is untracked or used drop all of the user's stored tokens.
        doc.refreshTokens = isInDb && !isAlreadyUsed ? validTokens : [];
        console.log(doc);

        // Update the stored user info with the new token(s)
        const resp = await db.put(doc);
        console.log(resp);

        // Throw an error if the current refresh token is untracked or used
        // as this is likely a questionable or duplicate attempt.
        if(!isInDb || isAlreadyUsed) {
            const error = new Error('Access Denied');
            error.code = 401;
            throw error;
        }
    } catch(err) {
        console.error(err);
        return {
            statusCode: err.status || err.code || 500,
            headers: defaultHeaders,
            body: JSON.stringify({
                status: "failure",
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
            status: "success",
            message: "Valid token: refresh authorized"
        })
    };
};