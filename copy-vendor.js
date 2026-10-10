// Copies self-hosted third-party assets into /public/vendor (no CDNs at runtime).
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const out = path.join(root, 'public', 'vendor');
fs.mkdirSync(path.join(out, 'fa', 'webfonts'), { recursive: true });

fs.copyFileSync(
  path.join(root, 'node_modules/chart.js/dist/chart.umd.js'),
  path.join(out, 'chart.umd.js')
);
const fa = path.join(root, 'node_modules/@fortawesome/fontawesome-free');
fs.copyFileSync(path.join(fa, 'css/all.min.css'), path.join(out, 'fa', 'all.min.css'));
for (const f of fs.readdirSync(path.join(fa, 'webfonts'))) {
  if (f.endsWith('.woff2')) fs.copyFileSync(path.join(fa, 'webfonts', f), path.join(out, 'fa', 'webfonts', f));
}
console.log('Vendor assets copied.');
