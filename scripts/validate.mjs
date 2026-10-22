import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('🔍 Starting avari.dev assets & markup validation...');
let errors = 0;

function assert(condition, message) {
  if (!condition) {
    console.error(`  ❌ FAIL: ${message}`);
    errors++;
  } else {
    console.log(`  ✓ PASS: ${message}`);
  }
}

// 1. Verify index.html exists
const indexPath = path.join(rootDir, 'index.html');
assert(fs.existsSync(indexPath), 'index.html exists');

const htmlContent = fs.readFileSync(indexPath, 'utf-8');
assert(htmlContent.includes('<!DOCTYPE html>'), 'HTML has valid <!DOCTYPE html>');
assert(htmlContent.includes('<title>'), 'HTML contains <title>');
assert(htmlContent.includes('<meta name="viewport"'), 'HTML contains viewport meta');

// 2. Extract and check all local asset references from index.html
const assetRegex = /(?:src|href)=["']([^"']+)["']/g;
let match;
const checkedAssets = new Set();

while ((match = assetRegex.exec(htmlContent)) !== null) {
  const rawUrl = match[1];

  // Skip external URLs, tel, mailto, fragments, etc.
  if (
    rawUrl.startsWith('http://') ||
    rawUrl.startsWith('https://') ||
    rawUrl.startsWith('mailto:') ||
    rawUrl.startsWith('tel:') ||
    rawUrl.startsWith('#') ||
    rawUrl === '/'
  ) {
    continue;
  }

  // Normalize path relative to rootDir
  const cleanPath = rawUrl.split('?')[0].split('#')[0].replace(/^\//, '');
  const targetPath = path.join(rootDir, cleanPath);

  if (!checkedAssets.has(cleanPath)) {
    checkedAssets.add(cleanPath);
    const exists = fs.existsSync(targetPath);
    assert(exists, `Referenced asset exists: "${rawUrl}" -> ${cleanPath}`);
    if (exists) {
      const stats = fs.statSync(targetPath);
      assert(stats.size > 0, `Asset is non-empty (${stats.size} bytes): ${cleanPath}`);
    }
  }
}

// 3. Validate site.webmanifest
const manifestPath = path.join(rootDir, 'site.webmanifest');
assert(fs.existsSync(manifestPath), 'site.webmanifest exists');

try {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
  assert(typeof manifest.name === 'string', 'Manifest contains "name"');
  assert(Array.isArray(manifest.icons), 'Manifest contains "icons" array');
  for (const icon of manifest.icons || []) {
    const iconFile = icon.src.replace(/^\//, '');
    const iconPath = path.join(rootDir, iconFile);
    assert(fs.existsSync(iconPath), `Manifest icon exists: "${icon.src}"`);
  }
} catch (e) {
  assert(false, `site.webmanifest valid JSON: ${e.message}`);
}

// 4. Validate sitemap.xml
const sitemapPath = path.join(rootDir, 'sitemap.xml');
assert(fs.existsSync(sitemapPath), 'sitemap.xml exists');
const sitemapContent = fs.readFileSync(sitemapPath, 'utf-8');
assert(sitemapContent.includes('<urlset') && sitemapContent.includes('https://avari.dev/'), 'sitemap.xml is valid');

// 5. Validate robots.txt
const robotsPath = path.join(rootDir, 'robots.txt');
assert(fs.existsSync(robotsPath), 'robots.txt exists');
const robotsContent = fs.readFileSync(robotsPath, 'utf-8');
assert(robotsContent.includes('Sitemap: https://avari.dev/sitemap.xml'), 'robots.txt references sitemap');

console.log('\n----------------------------------------');
if (errors > 0) {
  console.error(`💥 Validation finished with ${errors} error(s)!`);
  process.exit(1);
} else {
  console.log(`🎉 All ${checkedAssets.size + 8} validation checks passed successfully!`);
}
