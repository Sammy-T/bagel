const PouchDb = require('pouchdb');
const createToken = require('./auth/create-token.js');

exports.handler = async (event, context) => {
    const data = new URLSearchParams(event.body);
    const username = data.get('username');
    const password = data.get('password');

    //// TODO: Validate input

    const db = new PouchDb('test-db');

    // Attempt to retrieve the document with the matching id(username in this case).
    try {
        const doc = await db.get(username);
        console.log(doc);

        // Throw an error if the entered password is invalid
        if(password !== doc.password) {
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

    // Create the token then return it on the response
    const token = createToken(username);

    return {
        statusCode: 200,
        body: JSON.stringify({
            status: "success",
            token: token 
        })
    };
};