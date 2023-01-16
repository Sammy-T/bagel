const jwt = require('jsonwebtoken');

const TEST_TOKEN_SECRET = 'TEST_TOKEN_SECRET';
const TEST_REFRESH_TOKEN_SECRET = 'TEST_REFRESH_TOKEN_SECRET';

function createToken(username, isRefresh = false) {
    const data = { username: username };
    const secret = isRefresh ? TEST_REFRESH_TOKEN_SECRET : TEST_TOKEN_SECRET;
    const options = isRefresh ? { expiresIn: '10m' } : { expiresIn: '1m' };

    return jwt.sign(data, secret, options);
}

module.exports = createToken;