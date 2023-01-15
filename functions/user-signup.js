const PouchDb = require('pouchdb');
const createToken = require('./auth/create-token.js');

exports.handler = async (event, context) => {
    const data = new URLSearchParams(event.body);
    const username = data.get('username');
    const password = data.get('password');

    //// TODO: Validate input

    const db = new PouchDb('test-db');

    // Attempt to store the user in the db.
    try {
        const doc = await db.put({
            _id: username,
            username: username,
            password: password
        });
        console.log(doc);
    } catch(err) {
        console.error(err);
        return {
            statusCode: err.status || 500,
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