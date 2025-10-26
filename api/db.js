const mySQL = require("mysql2");
const fs = require("fs");
const db = mySQL.createConnection(JSON.parse(fs.readFileSync(__dirname + "/config.json", "utf-8")));
module.exports = db;

