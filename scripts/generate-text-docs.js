const fs = require('fs');
const path = require('path');

const signaturesDir = path.join(__dirname, '..', 'src', 'signatures');
const descriptionsDir = path.join(__dirname, '..', 'src', 'descriptions', 'en');
const siteFile = path.join(descriptionsDir, 'site.json');

const readJson = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));

const site = fs.existsSync(siteFile) ? readJson(siteFile) : {};

const signFiles = fs.readdirSync(signaturesDir).filter(f => f.endsWith('.json'));
const descFiles = fs.readdirSync(descriptionsDir).filter(f => f.endsWith('.json') && f !== 'site.json');

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

const stripTags = (html) => html.replace(/<[^>]+>/g, '');

const wrapText = (str, width = 80) => {
  const words = str.split(/\s+/);
  let line = '';
  let result = '';
  for (const word of words) {
    if ((line + word).length > width) {
      result += line.trimEnd() + '\n';
      line = word + ' ';
    } else {
      line += word + ' ';
    }
  }
  if (line.trim()) result += line.trimEnd();
  return result;
};

let text = `${site.WELCOME_TITLE || 'GreyScript API Documentation'}\n\n`;
if (site.WELCOME_TEXT) {
  text += wrapText(stripTags(site.WELCOME_TEXT)) + '\n\n';
}

for (const [name, sig] of Object.entries(signatures)) {
  text += `${name}\n${'-'.repeat(name.length)}\n`;
  const desc = descriptions[name];
  if (desc && desc.$meta && desc.$meta.description) {
    text += wrapText(stripTags(desc.$meta.description)) + '\n';
  }
  for (const [method, def] of Object.entries(sig.definitions || {})) {
    text += `  - ${method}\n`;
    if (desc && desc[method] && desc[method].description) {
      text += wrapText('    ' + stripTags(desc[method].description)) + '\n';
    }
    if (def.arguments && def.arguments.length) {
      text += '    Arguments:\n';
      for (const arg of def.arguments) {
        text += `      ${arg.label}: ${arg.type}\n`;
      }
    }
    if (def.returns && def.returns.length) {
      const returns = def.returns.map(r => typeof r === 'string' ? r : JSON.stringify(r)).join(', ');
      text += `    Returns: ${returns}\n`;
    }
    if (desc && desc[method] && Array.isArray(desc[method].example)) {
      text += '    Example:\n';
      for (const line of desc[method].example) {
        text += `      ${line}\n`;
      }
    }
    text += '\n';
  }
  text += '\n';
}

const outDir = path.join(__dirname, '..', 'docs');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);
fs.writeFileSync(path.join(outDir, 'index.txt'), text);
console.log('Documentation written to docs/index.txt');
