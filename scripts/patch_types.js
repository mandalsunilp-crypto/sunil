const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../types/database.types.ts');
let content = fs.readFileSync(filePath, 'utf8');

// Replace "Update: {\n          ...\n        }\n      }" with "Update: {\n          ...\n        }\n        Relationships: []\n      }"
// Notice pattern: inside Tables: { tableName: { Row: {}, Insert: {}, Update: {} } }
content = content.replace(/Update:\s*\{[\s\S]*?\n\s*\}\n(\s*)\}/g, (match, indent) => {
  return match.slice(0, match.length - 1) + `${indent}Relationships: []\n${indent}}`;
});

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully patched database.types.ts with Relationships: []');
