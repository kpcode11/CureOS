#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const appDir = path.join(__dirname, '../src/app');

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      walkDir(filePath);
    } else if (file === 'page.tsx' || file === 'page.ts') {
      const content = fs.readFileSync(filePath, 'utf-8').trim();
      
      if (!content) {
        // Get the page path for display
        const pageName = filePath
          .replace(appDir, '')
          .replace(/\\/g, ' / ')
          .replace('/ page.tsx', '');
          
        const component = `'use client';

import { useEffect, useState } from 'react';

export default function Page() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">${pageName.trim() || 'Page'}</h1>
        <p className="text-gray-600">Page content under development</p>
      </div>
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-600">Content coming soon...</p>
      </div>
    </div>
  );
}
`;
        
        fs.writeFileSync(filePath, component);
        console.log(`✓ Updated: ${filePath}`);
      }
    }
  }
}

walkDir(appDir);
console.log('✅ All empty pages populated');
