const jwt = require('jsonwebtoken');

const TEST_TOKEN_SECRET = 'TEST_TOKEN_SECRET';

function verifyToken(token) {
    return jwt.verify(token, TEST_TOKEN_SECRET);
}

module.exports = verifyToken;