const fs = require('fs');

// Read the generated ESM file
let content = fs.readFileSync('dist/index.mjs', 'utf8');

// Fix the imports by adding .js extensions
content = content.replace(/from '\.\/pageAggregation'/g, "from './pageAggregation.js'");
content = content.replace(/from '\.\/utils\/objectIds'/g, "from './utils/objectIds.js'");
content = content.replace(/from '\.\/utils\/mongo'/g, "from './utils/mongo.js'");
content = content.replace(/from '\.\/utils\/dbQuery'/g, "from './utils/dbQuery.js'");
content = content.replace(/from '\.\/utils\/dates'/g, "from './utils/dates.js'");
content = content.replace(/from '\.\/utils\/compute'/g, "from './utils/compute.js'");

// Write the fixed content back
fs.writeFileSync('dist/index.mjs', content);
console.log('✅ Fixed ESM imports');
