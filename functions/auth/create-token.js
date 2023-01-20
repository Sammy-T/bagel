const jwt = require('jsonwebtoken');

function createToken(data, isRefresh = false) {
    const secret = isRefresh ? process.env.REFRESH_TOKEN_SECRET : process.env.TOKEN_SECRET;
    const options = isRefresh ? { expiresIn: '10m' } : { expiresIn: '2m' };

    return jwt.sign(data, secret, options);
}

module.exports = createToken;