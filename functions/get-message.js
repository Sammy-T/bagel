const defaultHeaders = require('./util/default-headers.json');
const message = require('./data/message.json');

exports.handler = async (event, context) => {
    return {
        statusCode: 200,
        headers: defaultHeaders,
        body: JSON.stringify(message)
    };
};