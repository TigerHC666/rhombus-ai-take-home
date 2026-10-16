const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
fs.mkdirSync(path.join(root, '.runtime'), { recursive: true });
module.exports = {
  root,
  projectId: Number(process.env.RHOMBUS_PROJECT_ID || 5348),
  projectName: process.env.RHOMBUS_PROJECT_NAME || 'LLM Observability Assessment',
  storageState: process.env.RHOMBUS_STORAGE_STATE || path.join(root, '.auth/rhombus.json'),
  outputBucket: process.env.RHOMBUS_OUTPUT_BUCKET || 'rhombus-assessment-output-20261017-hc6',
};
