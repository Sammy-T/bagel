const cookie = require('cookie');
const verifyToken = require('./auth/verify-token');
const defaultHeaders = require('./util/default-headers.json');
const message = require('./data/message.json');

exports.handler = async (event, context) => {
    const data = new URLSearchParams(event.body);
    const cookies = (event.headers.cookie) ? cookie.parse(event.headers.cookie) : {};
    
    const accessToken = data?.get('token') || cookies['cba.auth.acc'];

    // Verify the passed token
    try {
        const verified = verifyToken(accessToken);
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

    // Return the data to authorized requests
    return {
        statusCode: 200,
        headers: defaultHeaders,
        body: JSON.stringify({
            status: 'success',
            data: message
        })
    };
};