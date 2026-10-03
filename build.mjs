import { readFile, writeFile, copyFile } from 'node:fs/promises';
const items = [];
for (const [file,author] of [['original.json','human'],['news3-astra.json','ai']]) {
 const rows=JSON.parse(await readFile(new URL('data/'+file,import.meta.url),'utf8'));
 for (const [index,row] of rows.entries()) {
  if(typeof row.text!=='string'||!row.text.trim()) throw new Error(`Empty text: ${file}:${index}`);
  items.push({key:`${author}:${index}`,text:row.text,author});
 }
}
if(new Set(items.map(x=>x.text.trim())).size!==items.length) throw new Error('Duplicate texts in input');
await writeFile(new URL('dist/data.json',import.meta.url),JSON.stringify(items));
await Promise.all(['index.html','style.css'].map(file=>copyFile(new URL('src/'+file,import.meta.url),new URL('dist/'+file,import.meta.url))));
console.log(`Built quiz: ${items.length} unique texts`);
