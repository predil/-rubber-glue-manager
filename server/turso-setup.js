// Turso SQLite cloud setup
const { createClient } = require('@libsql/client');

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

const db = {
  run: async (sql, params, callback) => {
    try {
      const result = await client.execute({ sql, args: params });
      callback(null, { lastID: result.lastInsertRowid });
    } catch (err) {
      callback(err);
    }
  },
  all: async (sql, params, callback) => {
    try {
      const result = await client.execute({ sql, args: params });
      callback(null, result.rows);
    } catch (err) {
      callback(err);
    }
  },
  get: async (sql, params, callback) => {
    try {
      const result = await client.execute({ sql, args: params });
      callback(null, result.rows[0] || null);
    } catch (err) {
      callback(err);
    }
  },
  serialize: (fn) => fn()
};

module.exports = db;