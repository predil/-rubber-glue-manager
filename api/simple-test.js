export default function handler(req, res) {
  if (req.method === 'POST') {
    res.json({ 
      success: true, 
      message: 'POST works',
      body: req.body,
      method: req.method
    });
  } else {
    res.json({ 
      success: true, 
      message: 'GET works',
      method: req.method
    });
  }
}