const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);

async function walk(dir) {
  let results = [];
  const list = await readdir(dir);
  for (const file of list) {
    const filePath = path.join(dir, file);
    const fileStat = await stat(filePath);
    if (fileStat && fileStat.isDirectory()) {
      results = results.concat(await walk(filePath));
    } else {
      if (filePath.endsWith('route.ts')) {
        results.push(filePath);
      }
    }
  }
  return results;
}

async function dedupeParams(filePath) {
  let content = await readFile(filePath, 'utf8');
  let originalContent = content;

  // We are looking for something like:
  // const { id } = await params;
  // ...
  // const { id } = await params;
  // We can just use a regex to remove the second identical line within a file, assuming it only appears twice per function.
  // Since each file only has a few functions (GET, POST), let's just do a string replace for known duplicates.

  // Let's find all `const { xxx } = await params;`
  const paramDecls = content.match(/const\s+\{[^}]+\}\s*=\s*await\s+params;/g);
  
  if (paramDecls) {
    // For each unique declaration, if it appears more than once, keep the first and remove subsequent ones.
    const uniqueDecls = [...new Set(paramDecls)];
    for (const decl of uniqueDecls) {
      let parts = content.split(decl);
      if (parts.length > 2) { // Means it appeared at least twice
        // Rejoin keeping only the first one
        content = parts[0] + decl + parts.slice(1).join('');
      }
    }
  }

  if (content !== originalContent) {
    await writeFile(filePath, content, 'utf8');
    console.log(`Deduped ${filePath}`);
  }
}

async function main() {
  const apiDir = path.join(__dirname, '..', 'src', 'app', 'api');
  const files = await walk(apiDir);
  for (const file of files) {
    await dedupeParams(file);
  }
  console.log('Done deduping Next.js 15 params.');
}

main().catch(console.error);
