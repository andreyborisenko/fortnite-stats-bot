const PouchDB = require('pouchdb')

const db = new PouchDB('users')

module.exports.db = db;