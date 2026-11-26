#!/usr/bin/env node

/**
 * Kudoby Deck Official Developer CLI
 * Scaffolds new plugins, validates manifest.json, and launches simulator.
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const args = process.argv.slice(2);
const command = args[0] || 'help';

if (command === 'create') {
  const pluginName = args[1] || 'my-kudoby-plugin';
  createPlugin(pluginName);
} else if (command === 'validate') {
  validateManifest();
} else if (command === 'simulate') {
  require('../simulator/server.js');
} else {
  showHelp();
}

function showHelp() {
  console.log(`
======================================================
  ⚡ Kudoby Deck Developer CLI (v2.6.0)
======================================================

Usage:
  npx @kudobydeck/deck-sdk <command> [options]

Commands:
  create <name>   Scaffold a brand new plugin with TypeScript & manifest
  validate        Validate manifest.json schema in current directory
  simulate        Launch the local in-browser hardware simulator
  help            Show this help menu

Examples:
  npx @kudobydeck/deck-sdk create obs-audio-fx
  npx @kudobydeck/deck-sdk validate
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

  // Update manifest.json with targetName
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
  4. npx @kudobydeck/deck-sdk simulate
`);
}

function validateManifest() {
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

    if (!Array.isArray(data.actions) || data.actions.length === 0) {
      console.error(`❌ Manifest validation failed! "actions" must be a non-empty array.`);
      process.exit(1);
    }

    console.log(`\n✅ manifest.json is VALID!`);
    console.log(`  - Plugin ID: ${data.id}`);
    console.log(`  - Name: ${data.name}`);
    console.log(`  - Version: ${data.version}`);
    console.log(`  - Registered Actions: ${data.actions.length}`);
  } catch (err) {
    console.error(`❌ Error parsing manifest.json: ${err.message}`);
    process.exit(1);
  }
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
