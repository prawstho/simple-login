const { MongoClient } = require('mongodb');
const uri = "mongodb://localhost:27017/";
const pool = new MongoClient(uri);

module.exports = pool;