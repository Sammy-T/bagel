const PouchDb = require('pouchdb');
const createToken = require('./auth/create-token.js');

exports.handler = async (event, context) => {
    const data = new URLSearchParams(event.body);
    const username = data.get('username');
    const password = data.get('password');

    const db = new PouchDb('test-db');

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

    const token = createToken(username);

    return {
        statusCode: 200,
        body: JSON.stringify({
            status: "success",
            token: token 
        })
    };
};