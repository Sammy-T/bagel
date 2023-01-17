const jwt = require('jsonwebtoken');

function verifyToken(token, isRefresh = false) {
    const secret = isRefresh ? process.env.REFRESH_TOKEN_SECRET : process.env.TOKEN_SECRET;

    return jwt.verify(token, secret);
}

module.exports = verifyToken;