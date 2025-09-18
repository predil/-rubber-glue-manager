// Test server with PostgreSQL
process.env.DATABASE_URL = 'postgresql://neondb_owner:npg_HXA5qJ8vUzMr@ep-plain-grass-adei6n9c-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';
process.env.PORT = 3001;

const app = require('./server/index');

console.log('✅ Server started successfully with PostgreSQL');
console.log('Test at: http://localhost:3001/');