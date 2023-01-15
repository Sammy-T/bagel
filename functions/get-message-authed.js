const message = require('./data/message.json');
const verifyToken = require('./auth/verify-token.js');

exports.handler = async (event, context) => {
    const data = new URLSearchParams(event.body);
    const token = data.get('token');

    try {
        const verified = verifyToken(token);
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

    return {
        statusCode: 200,
        body: JSON.stringify({
            status: 'success',
            data: message
        })
    };
};