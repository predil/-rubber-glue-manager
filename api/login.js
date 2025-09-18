export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { username, password } = req.body;
  
  // Simple hardcoded authentication
  if (username === 'admin' && password === 'password') {
    res.json({ 
      token: 'demo-token-admin',
      user: { username: 'admin' }
    });
  } else {
    res.status(401).json({ message: 'Invalid credentials' });
  }
}