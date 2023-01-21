const faunadb = require('faunadb');
const q = faunadb.query;

/**
 * A helper to parse the Fauna ref from the value stored in the token.
 * @param {*} refObj 
 * @returns {faunadb.Expr} faunaRef
 */
function parseRef(refObj) {
    const { id } = refObj['@ref'];
    const collectionId = refObj['@ref'].collection['@ref'].id;

    return q.Ref(q.Collection(collectionId), id);
}

module.exports = parseRef;