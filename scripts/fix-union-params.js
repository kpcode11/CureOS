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

async function fixUnionParams(filePath) {
  let content = await readFile(filePath, 'utf8');
  let originalContent = content;

  content = content.replace(
    /\{\s*params\s*\}\s*:\s*\{\s*params\s*:\s*\{\s*([a-zA-Z0-9_]+)\s*:\s*string\s*\}\s*\|\s*Promise<\{\s*\1\s*:\s*string\s*\}>\s*\}/g,
    '{ params }: { params: Promise<{ $1: string }> }'
  );

  if (content !== originalContent) {
    await writeFile(filePath, content, 'utf8');
    console.log(`Fixed union type in ${filePath}`);
  }
}

async function main() {
  const apiDir = path.join(__dirname, '..', 'src', 'app', 'api');
  const files = await walk(apiDir);
  for (const file of files) {
    await fixUnionParams(file);
  }
  console.log('Done fixing union params.');
}

main().catch(console.error);
