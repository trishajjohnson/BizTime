const { Client } = require('pg');

let DB_URI;

if(process.env.NODE_ENV === "test") {
    DB_URI = 'postgres:///biztime_test';
} else {
    DB_URI = 'postgres:///biztime';
}

const db = new Client({
    connectionString: DB_URI
});

db.connect();


module.exports = db;