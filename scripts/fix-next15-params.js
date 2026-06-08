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

async function fixParamsInFile(filePath) {
  let content = await readFile(filePath, 'utf8');
  let originalContent = content;
  let modified = false;

  // Match more flexibly, handling trailing commas and different spacings
  // export async function GET(req: Request, { params }: { params: { id: string } })
  const regex = /export\s+async\s+function\s+(GET|POST|PUT|PATCH|DELETE)\s*\(\s*(.*?),\s*\{\s*params\s*\}\s*:\s*\{\s*params\s*:\s*\{([^}]+)\}\s*\}[\s,]*\)\s*\{/g;
  
  let match;
  while ((match = regex.exec(content)) !== null) {
    const fullMatch = match[0];
    const method = match[1];
    const reqArg = match[2];
    const paramsType = match[3].trim(); // e.g. "id: string" or "patientId: string"

    const paramNames = paramsType.split(',').map(p => p.split(':')[0].trim()).filter(p => p);
    
    // Replacement string
    const newSignature = `export async function ${method}(
  ${reqArg},
  { params }: { params: Promise<{ ${paramsType} }> }
) {
  const { ${paramNames.join(', ')} } = await params;`;
    
    content = content.replace(fullMatch, newSignature);
    modified = true;
  }
  
  if (modified) {
    // If they already awaited params manually (e.g. `const { id } = await params;`),
    // our insertion will cause a duplicate declaration `const { id } = await params;`.
    // Let's remove any pre-existing `const { id } = await params;` or similar
    const duplicateRegex = /const\s+\{\s*[a-zA-Z0-9_,\s]+\s*\}\s*=\s*await\s+params;/g;
    // We only want to keep ONE of them. 
    // An easier way: just remove the one we didn't insert, or don't insert it if it exists.
    // Actually, it's safer to just let ESLint/TS catch it if it happens, or handle it manually.
    // Let's just remove the one they might have written.
    
    // Also handle params.id -> id
    const paramRegex = /params\.([a-zA-Z0-9_]+)/g;
    content = content.replace(paramRegex, '$1');

    // Deduplicate `const { id } = await params;`
    // We'll replace all occurrences with a special token, then add it back once.
    // Actually, just replacing params.xxx with xxx is enough, and the new signature handles the destructuring.
    
    // If there is a duplicate let's fix it: `const { id } = await params;\n  const { id } = await params;`
    // We can just regex replace double declarations.
    content = content.replace(/(const\s+\{[^\}]+\}\s*=\s*await\s+params;[\s\n]*){2,}/g, '$1');

    await writeFile(filePath, content, 'utf8');
    console.log(`Fixed ${filePath}`);
  }
}

async function main() {
  const apiDir = path.join(__dirname, '..', 'src', 'app', 'api');
  const files = await walk(apiDir);
  for (const file of files) {
    await fixParamsInFile(file);
  }
  console.log('Done fixing Next.js 15 params.');
}

main().catch(console.error);
