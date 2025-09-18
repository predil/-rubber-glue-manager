const app = require('../server/index.js');

module.exports = (req, res) => {
  // Remove /api/server prefix from URL for proper routing
  req.url = req.url.replace('/api/server', '/api');
  return app(req, res);
};