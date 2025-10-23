#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

const srcPath = path.resolve('src/lib/nutrients.ts');
const outPath = path.resolve('data/food_db_export.json');

const src = fs.readFileSync(srcPath, 'utf8');

const marker = 'export const FOOD_DB';
const start = src.indexOf(marker);
if (start === -1) {
  console.error('Could not find FOOD_DB marker in', srcPath);
  process.exit(1);
}

// find the first '{' after the marker
const braceStart = src.indexOf('{', start);
if (braceStart === -1) {
  console.error('Could not find opening brace for FOOD_DB');
  process.exit(1);
}

// find matching closing brace by scanning
let depth = 0;
let i = braceStart;
for (; i < src.length; i++) {
  const ch = src[i];
  if (ch === '{') depth++;
  else if (ch === '}') {
    depth--;
    if (depth === 0) break;
  }
}

if (depth !== 0) {
  console.error('Failed to find matching closing brace for FOOD_DB');
  process.exit(1);
}

const objectText = src.slice(braceStart, i + 1);

// Build a temporary JS file to require safely
const tempJs = `module.exports = ${objectText};`;
const tmpFile = path.resolve('.tmp_food_db_export.js');
fs.writeFileSync(tmpFile, tempJs, 'utf8');

const foods = await import('file://' + tmpFile);
const obj = foods.default ?? foods;

const out = Object.entries(obj).map(([key, profile]) => ({
  id: key.toLowerCase(),
  name: key,
  aliases: [],
  serving: profile.serving ?? null,
  ...profile,
}));

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(out, null, 2), 'utf8');
fs.unlinkSync(tmpFile);

console.log('Exported', out.length, 'foods to', outPath);
