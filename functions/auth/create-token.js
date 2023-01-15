const jwt = require('jsonwebtoken');

const TEST_TOKEN_SECRET = 'TEST_TOKEN_SECRET';

function createToken(username) {
    return jwt.sign(
        { username: username }, 
        TEST_TOKEN_SECRET, 
        { expiresIn: '1h' });
}

module.exports = createToken;