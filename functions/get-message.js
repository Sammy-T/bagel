const message = require('./data/message.json');

exports.handler = async (event, context) => {
    console.log(event);
    console.log(context);
    
    return {
        statusCode: 200,
        headers: {
            "Access-Control-Allow-Origin": "*"
        },
        body: JSON.stringify(message)
    };
};