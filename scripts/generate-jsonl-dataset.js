const fs = require('fs');
const path = require('path');

const signaturesDir = path.join(__dirname, '..', 'src', 'signatures');
const descriptionsDir = path.join(__dirname, '..', 'src', 'descriptions', 'en');

const readJson = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));

const signFiles = fs.readdirSync(signaturesDir).filter((f) => f.endsWith('.json'));
const descFiles = fs
  .readdirSync(descriptionsDir)
  .filter((f) => f.endsWith('.json') && f !== 'site.json');

const signatures = {};
for (const file of signFiles) {
  const data = readJson(path.join(signaturesDir, file));
  signatures[path.basename(file, '.json')] = data;
}

const descriptions = {};
for (const file of descFiles) {
  const data = readJson(path.join(descriptionsDir, file));
  descriptions[path.basename(file, '.json')] = data;
}

const entries = [];
for (const [name, sig] of Object.entries(signatures)) {
  const desc = descriptions[name] || {};
  if (desc.$meta && desc.$meta.description) {
    entries.push({
      object: name,
      member: null,
      description: desc.$meta.description,
    });
  }
  for (const [method, def] of Object.entries(sig.definitions || {})) {
    const descEntry = desc[method] || {};
    entries.push({
      object: name,
      member: method,
      arguments: def.arguments || [],
      returns: def.returns || [],
      description: descEntry.description || '',
      example: Array.isArray(descEntry.example) ? descEntry.example : [],
    });
  }
}

const outDir = path.join(__dirname, '..', 'docs');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);
const outFile = path.join(outDir, 'index.jsonl');
fs.writeFileSync(outFile, entries.map((e) => JSON.stringify(e)).join('\n'));
console.log(`Dataset written to ${outFile}`);
