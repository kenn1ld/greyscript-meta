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
const SYSTEM_PROMPT = 'You are a helpful assistant for the GreyScript API.';

const fmtArgs = (args = []) =>
  args
    .map((a) => `${a.label}: ${a.type}${a.opt ? '?' : ''}`)
    .join(', ');

const fmtReturns = (returns = []) =>
  returns
    .map((r) => (typeof r === 'string' ? r : JSON.stringify(r)))
    .join(' | ') || 'void';

for (const [name, sig] of Object.entries(signatures)) {
  const desc = descriptions[name] || {};
  if (desc.$meta && desc.$meta.description) {
    entries.push({
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: `Explain the ${name} object.` },
        { role: 'assistant', content: desc.$meta.description },
      ],
    });
  }
  for (const [method, def] of Object.entries(sig.definitions || {})) {
    const descEntry = desc[method] || {};
    const signature = `${name}.${method}(${fmtArgs(def.arguments)}) -> ${fmtReturns(
      def.returns,
    )}`;
    let reply = `Signature: ${signature}`;
    if (descEntry.description) reply += `\n${descEntry.description}`;
    if (Array.isArray(descEntry.example) && descEntry.example.length) {
      reply += `\nExample:\n${descEntry.example.join('\n')}`;
    }
    entries.push({
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: `Explain ${name}.${method}.` },
        { role: 'assistant', content: reply },
      ],
    });
  }
}

const outDir = path.join(__dirname, '..', 'docs');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);
const outFile = path.join(outDir, 'index.jsonl');
fs.writeFileSync(
  outFile,
  entries.map((e) => JSON.stringify(e)).join('\n') + '\n',
);
console.log(`Dataset written to ${outFile}`);
