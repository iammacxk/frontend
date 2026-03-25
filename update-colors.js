const fs = require('fs');
const path = require('path');

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  // Replace colors with their var() equivalents for dark mode support
  const replacements = [
    { from: 'color: "#111827"', to: 'color: "var(--text-h, #111827)"' },
    { from: 'color: "#6b7280"', to: 'color: "var(--text-m, #6b7280)"' },
    { from: 'color: "#9ca3af"', to: 'color: "var(--text-m, #9ca3af)"' },
    { from: 'color: "#374151"', to: 'color: "var(--text-h, #374151)"' }
  ];

  for (const r of replacements) {
    content = content.split(r.from).join(r.to);
  }

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${filePath}`);
  }
}

function walk(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walk(fullPath);
    } else if (fullPath.endsWith('.tsx')) {
      processFile(fullPath);
    }
  }
}

const targetDirs = [
  'C:\\Users\\User\\Desktop\\BUU Work\\Selected Topic I (STS)\\frontend\\app\\dashboard-report',
  'C:\\Users\\User\\Desktop\\BUU Work\\Selected Topic I (STS)\\frontend\\app\\export',
  'C:\\Users\\User\\Desktop\\BUU Work\\Selected Topic I (STS)\\frontend\\app\\components'
];

for (const dir of targetDirs) {
  walk(dir);
}
