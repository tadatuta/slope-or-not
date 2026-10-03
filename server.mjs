import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
const files={'/':['index.html','text/html'],'/app.js':['app.js','text/javascript'],'/style.css':['style.css','text/css'],'/data.json':['data.json','application/json']};
createServer(async(req,res)=>{const entry=files[new URL(req.url,'http://localhost').pathname];if(!entry){res.writeHead(404);res.end();return;}try{const data=await readFile(new URL('dist/'+entry[0],import.meta.url));res.writeHead(200,{'Content-Type':entry[1]+'; charset=utf-8','Cache-Control':'no-store'});res.end(data);}catch(error){console.error('Unable to serve quiz',error);res.writeHead(500);res.end();}}).listen(43871,'127.0.0.1',()=>console.log('http://127.0.0.1:43871'));
