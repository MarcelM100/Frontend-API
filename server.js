// Servidor local sin dependencias: npm start.
const http = require('node:http');
const fs = require('node:fs/promises');
const path = require('node:path');

const archivos = {
  '/': ['index.html', 'text/html'],
  '/index.html': ['index.html', 'text/html'],
  '/css/styles.css': ['css/styles.css', 'text/css'],
  '/js/app.js': ['js/app.js', 'text/javascript']
};
const port = Number(process.env.PORT || 3000);
const server = http.createServer(async (req, res) => {
  const ruta = new URL(req.url, 'http://localhost').pathname;
  const archivo = archivos[ruta];
  if (!archivo || !['GET', 'HEAD'].includes(req.method)) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    return res.end('No encontrado');
  }
  try {
    const contenido = await fs.readFile(path.join(__dirname, archivo[0]));
    res.writeHead(200, { 'Content-Type': `${archivo[1]}; charset=utf-8` });
    res.end(req.method === 'HEAD' ? undefined : contenido);
  } catch {
    res.writeHead(500);
    res.end('No se pudo cargar el archivo');
  }
});
server.on('error', (error) => {
  console.error(error.code === 'EADDRINUSE'
    ? `El puerto ${port} está ocupado. Cierra el otro servidor o cambia PORT.`
    : error.message);
  process.exitCode = 1;
});
server.listen(port, '127.0.0.1', () => {
  console.log(`Pokédex disponible en http://localhost:${port}`);
  console.log('Presiona Ctrl+C para detener el servidor.');
});
