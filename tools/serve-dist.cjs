const http = require('http')
const fs = require('fs')
const path = require('path')

const root = path.resolve(__dirname, '..', 'dist')
const port = Number(process.env.PORT || 5173)
const mime = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
}

http.createServer((request, response) => {
  const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname)
  const requested = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '')
  let filePath = path.resolve(root, requested)
  if (!filePath.startsWith(root)) {
    response.writeHead(403).end('Forbidden')
    return
  }
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(root, 'index.html')
  }
  response.setHeader('Content-Type', mime[path.extname(filePath)] || 'application/octet-stream')
  fs.createReadStream(filePath).pipe(response)
}).listen(port, '127.0.0.1', () => {
  console.log(`SolFarm preview: http://127.0.0.1:${port}`)
})
