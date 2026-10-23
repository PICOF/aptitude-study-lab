import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
const root = path.resolve('dist');
const types = { '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.css':'text/css; charset=utf-8', '.json':'application/json; charset=utf-8', '.svg':'image/svg+xml' };
http.createServer((req,res)=>{
  let p = decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  if(p.startsWith('/aptitude-study-lab/')) p = p.slice('/aptitude-study-lab'.length);
  if(p.endsWith('/')) p += 'index.html';
  const file = path.resolve(root, '.'+p);
  if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||fs.statSync(file).isDirectory()){res.writeHead(404);res.end('Not found');return;}
  res.writeHead(200, {'Content-Type':types[path.extname(file)]||'application/octet-stream'});fs.createReadStream(file).pipe(res);
}).listen(4173,'127.0.0.1',()=>console.log('http://127.0.0.1:4173/aptitude-study-lab/'));
