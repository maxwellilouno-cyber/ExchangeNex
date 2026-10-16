import fs from 'fs';
import path from 'path';
import JSZip from 'jszip';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const publicDir = path.resolve(rootDir, 'public');

if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

const zip = new JSZip();

// Ignore lists
const ignoredDirs = new Set(['node_modules', '.git', 'dist', '.aistudio', 'build', '.cache']);
const ignoredFiles = new Set(['omnirate-currency-converter.zip', 'package-lock.json', 'bun.lock']);

function addDirectoryToZip(currentDir, relativePath = '') {
  const items = fs.readdirSync(currentDir);
  for (const item of items) {
    if (ignoredDirs.has(item) || ignoredFiles.has(item)) continue;

    const fullPath = path.join(currentDir, item);
    const itemRelativePath = relativePath ? `${relativePath}/${item}` : item;
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      addDirectoryToZip(fullPath, itemRelativePath);
    } else if (stat.isFile()) {
      const content = fs.readFileSync(fullPath);
      zip.file(itemRelativePath, content);
    }
  }
}

// Add README if not present
const readmeContent = `# OmniRate FX - Professional Currency Converter & Historical Trends

A high-performance real-time currency exchange calculator, historical trend visualization charts, multi-currency watchlist, and foreign transfer fee analyzer.

## Features
- Real-time exchange rates for 50+ global currencies
- Dual fallback to European Central Bank & Interbank spot rates
- Interactive historical chart with 7D, 1M, 3M, 6M, 1Y, and 5Y timeframes, moving averages, and CSV export
- Multi-currency portfolio watchlist with 7-day sparklines
- Foreign exchange fee and spread analyzer
- Specific historical calendar date rate lookup
- Target rate alert tracker with local persistence
- Installable Progressive Web App (PWA) with offline capabilities

## Getting Started

1. Install dependencies:
\`\`\`bash
npm install
\`\`\`

2. Run development server:
\`\`\`bash
npm run dev
\`\`\`

3. Build production bundle:
\`\`\`bash
npm run build
\`\`\`

## Building an Android APK

To build a native Android APK from this project:
1. Install Capacitor:
\`\`\`bash
npm install @capacitor/core @capacitor/cli @capacitor/android
npx cap init "OmniRate FX" "com.omnirate.app" --web-dir dist
npm run build
npx cap add android
npx cap copy
npx cap open android
\`\`\`
2. In Android Studio, go to **Build > Build Bundle(s) / APK(s) > Build APK(s)** to generate your installable \`.apk\` file!
`;

zip.file('README.md', readmeContent);

console.log('Packing project into zip...');
addDirectoryToZip(rootDir);

const outputPath = path.join(publicDir, 'omnirate-currency-converter.zip');
zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE', compressionOptions: { level: 9 } })
  .then((buffer) => {
    fs.writeFileSync(outputPath, buffer);
    console.log(`Successfully generated: ${outputPath} (${(buffer.length / 1024).toFixed(1)} KB)`);
  })
  .catch((err) => {
    console.error('Failed to create zip:', err);
    process.exit(1);
  });
