export default function handler(req, res) {
  res.json({
    success: true,
    database_url_exists: !!process.env.DATABASE_URL,
    database_url_preview: process.env.DATABASE_URL ? process.env.DATABASE_URL.substring(0, 20) + '...' : 'not set',
    env_vars: Object.keys(process.env).filter(key => key.includes('DATABASE'))
  });
}