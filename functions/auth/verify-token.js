const jwt = require('jsonwebtoken');

const TEST_TOKEN_SECRET = 'TEST_TOKEN_SECRET';
const TEST_REFRESH_TOKEN_SECRET = 'TEST_REFRESH_TOKEN_SECRET';

function verifyToken(token, isRefresh = false) {
    const secret = isRefresh ? TEST_REFRESH_TOKEN_SECRET : TEST_TOKEN_SECRET;

    return jwt.verify(token, secret);
}

module.exports = verifyToken;