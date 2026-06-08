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

async function restoreParams(filePath) {
  let content = await readFile(filePath, 'utf8');
  let originalContent = content;

  // We want to find export async function XXX(req: Request, { params }: { params: Promise<{ id: string }> }) {
  // and inject const { id } = await params; if it's not already in the function body.
  // Because it's hard to parse JS/TS accurately with regex, we can just split the file by "export async function"
  // and for each function, check if it has the param signature, and if it's missing the destructuring, insert it.

  const functionBlocks = content.split('export async function ');
  
  if (functionBlocks.length > 1) {
    let newContent = functionBlocks[0];

    for (let i = 1; i < functionBlocks.length; i++) {
      let block = functionBlocks[i];
      // block starts with something like "PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {\n"
      
      const sigMatch = block.match(/^(GET|POST|PUT|PATCH|DELETE)[\s\S]*?\{\s*params\s*\}[\s\S]*?Promise<\{\s*([^:}]+)\s*:\s*string/);
      
      if (sigMatch) {
        const paramName = sigMatch[2].trim(); // e.g. "id" or "patientId"
        
        // Find the opening brace of the function
        const braceIndex = block.indexOf('{');
        if (braceIndex !== -1) {
          const body = block.substring(braceIndex + 1);
          
          // Check if it already has `const { id } = await params;` or `const { id: patientId } = await params;`
          const destructureRegex = new RegExp(`const\\s+\\{\\s*${paramName}(\\s*:\\s*[a-zA-Z0-9_]+)?\\s*\\}\\s*=\\s*await\\s+params;`);
          
          if (!destructureRegex.test(body)) {
            // Add it right after the brace or try block
            // It's safer to add it right after `try {` if there's an authorization try block, but since we don't know, we can add it safely.
            // Wait, the Next.js compiler just needs it to be declared before it's used.
            // Let's add it right after the first `const body = await req.json();` or just at the beginning of the function.
            // Let's insert it before the first usage of `id`. But a simple way is just right after `try { const res = await requirePermission`
            // Actually, inserting it immediately after `export async function ... ) {\n` is the safest!
            // Wait, if it has `let sessionRes; \n try {`, we can insert it there.
            
            // Let's find the closing parenthesis of the function signature
            const sigEndIndex = block.indexOf(') {');
            if (sigEndIndex !== -1) {
              const insertPos = sigEndIndex + 3;
              block = block.substring(0, insertPos) + `\n  const { ${paramName} } = await params;\n` + block.substring(insertPos);
            }
          }
        }
      }
      newContent += 'export async function ' + block;
    }
    content = newContent;
  }

  // Also we need to make sure we don't double declare if the dedupe script messed up somehow.
  // The above logic only adds it if the regex `const { id } = await params;` is MISSING in the block.
  
  if (content !== originalContent) {
    await writeFile(filePath, content, 'utf8');
    console.log(`Restored params in ${filePath}`);
  }
}

async function main() {
  const apiDir = path.join(__dirname, '..', 'src', 'app', 'api');
  const files = await walk(apiDir);
  for (const file of files) {
    await restoreParams(file);
  }
  console.log('Done restoring params.');
}

main().catch(console.error);
