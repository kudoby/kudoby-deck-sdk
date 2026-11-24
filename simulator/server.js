/**
 * Kudoby Deck Local Simulator Server
 * Serves the browser mockup on http://localhost:9173
 */
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 9173;
const HTML_FILE = path.join(__dirname, 'index.html');

const server = http.createServer((req, res) => {
  if (req.url === '/' || req.url === '/index.html') {
    fs.readFile(HTML_FILE, 'utf-8', (err, data) => {
      if (err) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Error loading simulator UI');
        return;
      }
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(data);
    });
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
  }
});

server.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`  Kudoby Deck Simulator Running at http://localhost:${PORT}`);
  console.log(`  Developers can test virtual keys & dials in browser!`);
  console.log(`======================================================\n`);
});
