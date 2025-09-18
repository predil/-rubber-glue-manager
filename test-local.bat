@echo off
set DATABASE_URL=postgresql://neondb_owner:npg_HXA5qJ8vUzMr@ep-plain-grass-adei6n9c-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require^&channel_binding=require
set PORT=3001
cd server
node index.js