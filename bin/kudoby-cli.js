#!/usr/bin/env node

/**
 * Kudoby Deck Official Developer CLI
 * Scaffolds plugins, validates manifest.json, links local plugins for live dev,
 * packages .kudoby-plugin bundles with SHA-256 checksums, and launches simulator.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const zlib = require('zlib');
const crypto = require('crypto');

const args = process.argv.slice(2);
const command = args[0] || 'help';

if (command === 'create') {
  const pluginName = args[1] || 'my-kudoby-plugin';
  createPlugin(pluginName);
} else if (command === 'validate') {
  validateManifest();
} else if (command === 'pack') {
  packPlugin(args[1]);
} else if (command === 'dev') {
  linkDevPlugin(args.includes('--unlink'));
} else if (command === 'simulate') {
  require('../simulator/server.js');
} else {
  showHelp();
}

function showHelp() {
  console.log(`
======================================================
  ⚡ Kudoby Deck Developer CLI (v2.7.0)
======================================================

Usage:
  npx @kudobydeck/deck-sdk <command> [options]

Commands:
  create <name>   Scaffold a brand new plugin with TypeScript & manifest
  validate        Validate manifest.json schema in current directory
  dev [--unlink]  Link current folder into Kudoby Desktop Studio & hot-reload
  pack [outFile]  Bundle plugin into .kudoby-plugin archive + SHA-256 hash
  simulate        Launch the local in-browser hardware simulator
  help            Show this help menu

Examples:
  npx @kudobydeck/deck-sdk create obs-audio-fx
  npx @kudobydeck/deck-sdk validate
  npx @kudobydeck/deck-sdk dev
  npx @kudobydeck/deck-sdk pack
  npx @kudobydeck/deck-sdk simulate
`);
}

function createPlugin(targetName) {
  const targetDir = path.resolve(process.cwd(), targetName);
  console.log(`\n🚀 Scaffolding new Kudoby Deck plugin in: ${targetDir}`);

  if (fs.existsSync(targetDir)) {
    console.error(`❌ Error: Directory "${targetName}" already exists.`);
    process.exit(1);
  }

  const templateDir = path.resolve(__dirname, '../templates/sample-plugin');
  if (!fs.existsSync(templateDir)) {
    console.error(`❌ Error: Template directory not found.`);
    process.exit(1);
  }

  copyRecursive(templateDir, targetDir);

  const manifestPath = path.join(targetDir, 'manifest.json');
  if (fs.existsSync(manifestPath)) {
    try {
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      manifest.id = `com.community.${targetName.toLowerCase().replace(/[^a-z0-9-]/g, '')}`;
      manifest.name = targetName
        .split('-')
        .map(w => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
      fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
    } catch (e) {}
  }

  console.log(`
✅ Plugin successfully created!

Next steps:
  1. cd ${targetName}
  2. npm install
  3. npm run build
  4. npx @kudobydeck/deck-sdk dev   (link into Desktop Studio)
  5. npx @kudobydeck/deck-sdk pack  (bundle for Marketplace)
`);
}

function validateManifest(quiet = false) {
  const manifestPath = path.resolve(process.cwd(), 'manifest.json');
  if (!fs.existsSync(manifestPath)) {
    console.error(`❌ Error: manifest.json not found in current directory (${process.cwd()}).`);
    process.exit(1);
  }

  try {
    const raw = fs.readFileSync(manifestPath, 'utf8');
    const data = JSON.parse(raw);

    const requiredFields = ['id', 'name', 'version', 'entryPoint', 'actions'];
    const missing = requiredFields.filter(f => !data[f]);

    if (missing.length > 0) {
      console.error(`❌ Manifest validation failed! Missing required fields: ${missing.join(', ')}`);
      process.exit(1);
    }

    if (!/^[a-z0-9]+(\.[a-z0-9-]+)+$/.test(data.id)) {
      console.error(`❌ Manifest validation failed! "id" must use reverse-domain format (e.g. com.creator.myplugin).`);
      process.exit(1);
    }

    if (!Array.isArray(data.actions) || data.actions.length === 0) {
      console.error(`❌ Manifest validation failed! "actions" must be a non-empty array.`);
      process.exit(1);
    }

    for (const act of data.actions) {
      if (!act.uuid || !act.name) {
        console.error(`❌ Manifest validation failed! Every action requires "uuid" and "name".`);
        process.exit(1);
      }
      if (act.settings && !Array.isArray(act.settings)) {
        console.error(`❌ Manifest validation failed! Action "${act.uuid}" settings must be an array.`);
        process.exit(1);
      }
    }

    if (!quiet) {
      console.log(`\n✅ manifest.json is VALID!`);
      console.log(`  - Plugin ID: ${data.id}`);
      console.log(`  - Name: ${data.name}`);
      console.log(`  - Version: ${data.version}`);
      console.log(`  - EntryPoint: ${data.entryPoint}`);
      console.log(`  - Registered Actions: ${data.actions.length}`);
    }
    return data;
  } catch (err) {
    console.error(`❌ Error parsing manifest.json: ${err.message}`);
    process.exit(1);
  }
}

function getKudobyPluginsDir() {
  if (process.platform === 'win32') {
    const appData = process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming');
    return path.join(appData, 'KudobyDeck', 'Plugins');
  } else if (process.platform === 'darwin') {
    return path.join(os.homedir(), 'Library', 'Application Support', 'KudobyDeck', 'Plugins');
  }
  return path.join(os.homedir(), '.config', 'KudobyDeck', 'Plugins');
}

async function linkDevPlugin(unlink = false) {
  const manifest = validateManifest(true);
  const pluginsDir = getKudobyPluginsDir();
  fs.mkdirSync(pluginsDir, { recursive: true });
  const devLinksPath = path.join(pluginsDir, 'dev-links.json');

  let links = {};
  if (fs.existsSync(devLinksPath)) {
    try {
      links = JSON.parse(fs.readFileSync(devLinksPath, 'utf8'));
    } catch (_) {}
  }

  if (unlink) {
    delete links[manifest.id];
    fs.writeFileSync(devLinksPath, JSON.stringify(links, null, 2));
    console.log(`🔓 Unlinked dev plugin "${manifest.id}" from Desktop Studio.`);
  } else {
    links[manifest.id] = {
      id: manifest.id,
      name: manifest.name,
      path: process.cwd(),
      linkedAt: new Date().toISOString(),
    };
    fs.writeFileSync(devLinksPath, JSON.stringify(links, null, 2));
    console.log(`🔗 Linked "${manifest.name}" (${manifest.id}) -> ${process.cwd()}`);
  }

  // Trigger hot-reload in running Kudoby Desktop Studio
  for (const port of [5555, 5556, 5557]) {
    try {
      const resp = await fetch(`http://127.0.0.1:${port}/api/plugins/reload`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pluginId: manifest.id, unlink }),
      });
      if (resp.ok) {
        console.log(`⚡ Notified Kudoby Desktop Studio (port ${port}) to reload plugins!`);
        return;
      }
    } catch (_) {}
  }
  console.log(`ℹ️  Desktop Studio is not currently running — plugin will load automatically next launch.`);
}

function packPlugin(customOut) {
  const manifest = validateManifest(true);
  const cwd = process.cwd();
  const entryAbs = path.resolve(cwd, manifest.entryPoint);
  if (!fs.existsSync(entryAbs)) {
    console.warn(`⚠️  Warning: entryPoint "${manifest.entryPoint}" not found yet. Run "npm run build" first for production bundles.`);
  }

  const files = [];
  const collect = (dir, relBase) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (['node_modules', '.git', 'release-assets'].includes(entry.name)) continue;
      if (entry.name.endsWith('.kudoby-plugin') || entry.name.endsWith('.kudobypack')) continue;
      const full = path.join(dir, entry.name);
      const rel = relBase ? `${relBase}/${entry.name}` : entry.name;
      if (entry.isDirectory()) {
        collect(full, rel);
      } else {
        files.push({ rel, data: fs.readFileSync(full) });
      }
    }
  };
  collect(cwd, '');

  const zipBuf = createZipBuffer(files);
  const outName = customOut || `${manifest.id}-v${manifest.version}.kudoby-plugin`;
  const outPath = path.resolve(cwd, outName);
  fs.writeFileSync(outPath, zipBuf);

  const sha256 = crypto.createHash('sha256').update(zipBuf).digest('hex');
  console.log(`\n📦 Packed ${files.length} files -> ${outPath}`);
  console.log(`📏 Size: ${(zipBuf.length / 1024).toFixed(2)} KB`);
  console.log(`🔐 SHA-256: ${sha256}`);
  console.log(`🚀 Upload this .kudoby-plugin file at https://account.kudobydeck.com/#marketplace`);
}

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i];
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function createZipBuffer(entries) {
  const localParts = [];
  const centralParts = [];
  let offset = 0;

  for (const entry of entries) {
    const nameBuf = Buffer.from(entry.rel.replace(/\\/g, '/'), 'utf8');
    const uncompressed = entry.data;
    const compressed = zlib.deflateRawSync(uncompressed);
    const useDeflate = compressed.length < uncompressed.length;
    const payload = useDeflate ? compressed : uncompressed;
    const method = useDeflate ? 8 : 0;
    const crc = crc32(uncompressed);

    const local = Buffer.alloc(30 + nameBuf.length);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0x0800, 6);
    local.writeUInt16LE(method, 8);
    local.writeUInt16LE(0, 10);
    local.writeUInt16LE(0, 12);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(payload.length, 18);
    local.writeUInt32LE(uncompressed.length, 22);
    local.writeUInt16LE(nameBuf.length, 26);
    local.writeUInt16LE(0, 28);
    nameBuf.copy(local, 30);

    localParts.push(local, payload);

    const central = Buffer.alloc(46 + nameBuf.length);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(20, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(0x0800, 8);
    central.writeUInt16LE(method, 10);
    central.writeUInt16LE(0, 12);
    central.writeUInt16LE(0, 14);
    central.writeUInt32LE(crc, 16);
    central.writeUInt32LE(payload.length, 20);
    central.writeUInt32LE(uncompressed.length, 24);
    central.writeUInt16LE(nameBuf.length, 28);
    central.writeUInt16LE(0, 30);
    central.writeUInt16LE(0, 32);
    central.writeUInt16LE(0, 34);
    central.writeUInt16LE(0, 36);
    central.writeUInt32LE(0, 38);
    central.writeUInt32LE(offset, 42);
    nameBuf.copy(central, 46);

    centralParts.push(central);
    offset += local.length + payload.length;
  }

  const centralDir = Buffer.concat(centralParts);
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(0, 4);
  eocd.writeUInt16LE(0, 6);
  eocd.writeUInt16LE(entries.length, 8);
  eocd.writeUInt16LE(entries.length, 10);
  eocd.writeUInt32LE(centralDir.length, 12);
  eocd.writeUInt32LE(offset, 16);
  eocd.writeUInt16LE(0, 20);

  return Buffer.concat([...localParts, centralDir, eocd]);
}

function copyRecursive(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}
