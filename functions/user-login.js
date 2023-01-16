const PouchDb = require('pouchdb');
const bcrypt = require('bcryptjs');
const createToken = require('./auth/create-token.js');

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
            body: JSON.stringify({
                status: "failure",
                error: "Invalid credentials"
            })
        }
    }

    // Create the tokens
    const accessToken = createToken(username);
    const refreshToken = createToken(username, true);

    const db = new PouchDb('test-db');

    // Attempt to retrieve the document with the matching id(username in this case).
    try {
        const doc = await db.get(username);
        console.log(doc);

        const pwdIsValid = await bcrypt.compare(password, doc.password);

        // Throw an error if the entered password is invalid
        if(!pwdIsValid) {
            const error = new Error('Access Denied');
            error.code = 401;
            throw error;
        }

        doc.refreshTokens = [refreshToken];

        // Update the stored user info with the new token
        const resp = await db.put(doc);
        console.log(resp);
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
            refreshToken: refreshToken 
        })
    };
};