const PouchDb = require('pouchdb');
const message = require('./data/message.json');
const verifyToken = require('./auth/verify-token.js');
const createToken = require('./auth/create-token.js');

exports.handler = async (event, context) => {
    const data = new URLSearchParams(event.body);
    const refreshToken = data.get('token');

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
            body: JSON.stringify({
                status: 'failure',
                error: err.message
            })
        };
    }

    const { username } = verified;

    // Create the tokens
    const accessToken = createToken(username);
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

            if(verifiedToken) {
                validTokens.push(tokenStatus);
            }
        });

        // Set the new refreshTokens value to the valid tokens
        // if the current refresh token is valid and unused.
        doc.refreshTokens = isInDb && !isAlreadyUsed ? validTokens : [];
        console.log(doc);

        // Update the stored user info with the new token(s)
        const resp = await db.put(doc);
        console.log(resp);

        // Throw an error if the refresh token is not in the db
        // or if this is a duplicate use.
        if(!isInDb || isAlreadyUsed) {
            const error = new Error('Access Denied');
            error.code = 401;
            throw error;
        }
    } catch(err) {
        console.error(err);
        return {
            statusCode: err.status || err.code || 500,
            body: JSON.stringify({
                status: "failure",
                error: err.message
            })
        };
    }

    // Return the tokens on the response
    return {
        statusCode: 200,
        body: JSON.stringify({
            status: "success",
            accessToken: accessToken,
            refreshToken: newRefreshToken 
        })
    };
};