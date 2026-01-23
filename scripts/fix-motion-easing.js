#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const files = [
  'src/components/landing/hero-section.tsx',
  'src/components/landing/security-section.tsx',
  'src/components/landing/cta-section.tsx',
  'src/components/landing/footer.tsx'
];

for (const file of files) {
  const filePath = path.join(__dirname, '..', file);
  if (!fs.existsSync(filePath)) continue;
  
  let content = fs.readFileSync(filePath, 'utf-8');
  
  // Fix all ease: 'easeOut' to remove the property
  content = content.replace(/,\s*ease:\s*['"]easeOut['"]/g, '');
  content = content.replace(/,\s*ease:\s*['"]easeIn['"]/g, '');
  content = content.replace(/,\s*ease:\s*['"]linear['"]/g, '');
  
  fs.writeFileSync(filePath, content);
  console.log(`✓ Fixed: ${file}`);
}

console.log('✅ All landing components fixed');
