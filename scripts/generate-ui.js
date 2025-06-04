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

let html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<title>GreyScript API</title>
<style>
body { font-family: Arial, sans-serif; margin: 0; padding: 0; }
nav { position: fixed; top: 0; left: 0; width: 200px; height: 100%; overflow-y: auto; background: #f7f7f7; padding: 20px; box-sizing: border-box; }
main { margin-left: 220px; padding: 20px; }
nav a { display: block; margin-bottom: 8px; color: #333; text-decoration: none; }
nav a:hover { text-decoration: underline; }
code { background: #eee; padding: 2px 4px; }
pre { background: #f0f0f0; padding: 10px; overflow-x: auto; }
h2 { border-bottom: 1px solid #ddd; padding-bottom: 4px; }
</style>
</head>
<body>
<nav>
<h2>Objects</h2>
`;
for (const name of Object.keys(signatures)) {
  html += `<a href="#${name}">${name}</a>`;
}
html += `</nav>
<main>
<h1>${site.WELCOME_TITLE || 'GreyScript API Documentation'}</h1>
`;
if (site.WELCOME_TEXT) {
  html += `<div>${site.WELCOME_TEXT}</div>`;
}
for (const [name, sig] of Object.entries(signatures)) {
  html += `<section id="${name}"><h2>${name}</h2>`;
  const desc = descriptions[name];
  if (desc && desc.$meta && desc.$meta.description) {
    html += `<p>${desc.$meta.description}</p>`;
  }
  for (const [method, def] of Object.entries(sig.definitions || {})) {
    html += `<div><h3>${method}</h3>`;
    if (desc && desc[method] && desc[method].description) {
      html += `<p>${desc[method].description}</p>`;
    }
    if (def.arguments && def.arguments.length) {
      html += '<p><strong>Arguments:</strong></p><ul>';
      for (const arg of def.arguments) {
        html += `<li><code>${arg.label}</code>: ${arg.type}</li>`;
      }
      html += '</ul>';
    }
    if (def.returns && def.returns.length) {
      html += '<p><strong>Returns:</strong> ' + def.returns.map(r => typeof r === 'string' ? r : JSON.stringify(r)).join(', ') + '</p>';
    }
    if (desc && desc[method] && Array.isArray(desc[method].example)) {
      html += '<pre>' + desc[method].example.join('\n') + '</pre>';
    }
    html += '</div>';
  }
  html += '</section>';
}
html += '</main></body></html>';

const outDir = path.join(__dirname, '..', 'docs');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);
fs.writeFileSync(path.join(outDir, 'index.html'), html);
console.log('Documentation written to docs/index.html');
