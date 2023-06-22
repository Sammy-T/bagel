const faunadb = require('faunadb');
const verifyToken = require('../../auth/verify-token');

const db = new faunadb.Client({ secret: process.env.SERVER_KEY });
const q = faunadb.query;

/**
 * @typedef {Object} VerifyWithDbResp
 * @property {faunadb.ref} tokenRef
 * @property {boolean} isAlreadyUsed
 * @property {Array} invalidTokenRefs
 * @property {*} tokensResp
 */

/**
 * Verifies the provided token against the user's stored tokens.
 * 
 * Returns an object containing the match token's ref (if found),
 * whether the match token is already used, an array of invalid tokens, 
 * and the token query response.
 * @param {faunadb.ref} userRef 
 * @param {*} matchToken 
 * @returns {VerifyWithDbResp}
 */
async function verifyTokenWithDb(userRef, matchToken) {
    const tokensResp = await getUserTokens(userRef); 

    let tokenRef;
    let isAlreadyUsed = false;
    let invalidTokenRefs = [];

    tokensResp.data.forEach(tokenDoc => {
        const { token, used } = tokenDoc.data;
        let verifiedToken;
        console.log(tokenDoc.ref);

        // Check if the token is still valid
        try {
            verifiedToken = verifyToken(token, true);
        } catch(e) {
            console.warn(`Db token expired: ${tokenDoc.ref}\n`, e);
        }

        // Update the status if it's the current refresh token
        if(token === matchToken) {
            tokenRef = tokenDoc.ref;
            isAlreadyUsed = used;
        }

        // Add the invalid tokens to the array
        if(!verifiedToken) {
            invalidTokenRefs.push(tokenDoc.ref);
        }
    });

    return { tokenRef, isAlreadyUsed, invalidTokenRefs, tokensResp };
}

async function findInvalidTokens(userRef) {
    const tokensResp = await getUserTokens(userRef);

    let invalidTokenRefs = [];

    tokensResp.data.forEach(tokenDoc => {
        const { token, used } = tokenDoc.data;
        let verifiedToken;
        console.log(tokenDoc.ref);

        // Check if the token is still valid
        try {
            verifiedToken = verifyToken(token, true);
        } catch(e) {
            console.warn(`Db token expired: ${tokenDoc.ref}\n`, e);
        }

        // Add the invalid tokens to the array
        if(!verifiedToken) {
            invalidTokenRefs.push(tokenDoc.ref);
        }
    });

    return invalidTokenRefs;
}

async function getUserTokens(userRef) {
    return db.query(
        q.Map(
            q.Paginate(q.Match(q.Index('TokensByUser'), userRef)),
            q.Lambda('tokenRef', q.Get(q.Var('tokenRef')))
        )
    );
}

module.exports = { verifyTokenWithDb, findInvalidTokens };