const cookie = require('cookie');

function createTokenCookies(accessToken, refreshToken) {
    const accExpires = new Date(Date.now() + 2 * 60 * 1000); // 2m
    const refExpires = new Date(Date.now() + 10 * 60 * 1000); // 10m

    const cookieOpts = {
        path: '/',
        secure: true,
        httpOnly: true,
        sameSite: 'strict'
    };

    const accCookieOpts = { ...cookieOpts, expires: accExpires };
    const refCookieOpts = { ...cookieOpts, expires: refExpires };

    const accessCookie = cookie.serialize('cba.auth.acc', accessToken, accCookieOpts);
    const refreshCookie = cookie.serialize('cba.auth.ref', refreshToken, refCookieOpts);

    return [accessCookie, refreshCookie];
}

module.exports = createTokenCookies;