#!/usr/bin/env node
/**
 * compute-fleuves-depts.mjs
 *
 * Pour chaque cours d'eau du fichier public/fleuves.json, calcule la liste
 * des départements traversés en testant chaque coordonnée de la géométrie
 * contre les polygones de src/geo/departements.json (ray-casting).
 *
 * Produit : src/data/fleuvesDepts.json
 * Usage   : node scripts/compute-fleuves-depts.mjs
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

// ---------------------------------------------------------------------------
// Aliases (miroir de src/data/fleuveAliases.ts — même source de vérité)
// ---------------------------------------------------------------------------

const FLEUVE_ALIASES = { Mosel: 'Moselle', Maas: 'Meuse', Schelde: 'Escaut' };
const normalize = (name) => FLEUVE_ALIASES[name] ?? name;

// ---------------------------------------------------------------------------
// Chargement
// ---------------------------------------------------------------------------

const fleuves = JSON.parse(readFileSync(join(root, 'public/fleuves.json'), 'utf8'));
const deptsGeo = JSON.parse(readFileSync(join(root, 'src/geo/departements.json'), 'utf8'));

// ---------------------------------------------------------------------------
// Géométrie : extraction de coordonnées
// ---------------------------------------------------------------------------

function getCoordsFromGeometry(geometry) {
  if (geometry.type === 'LineString') return geometry.coordinates;
  if (geometry.type === 'MultiLineString') return geometry.coordinates.flat(1);
  return [];
}

// ---------------------------------------------------------------------------
// Point-in-polygon (ray-casting, gère trous et MultiPolygon)
// ---------------------------------------------------------------------------

function pointInRing(px, py, ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if ((yi > py) !== (yj > py) && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
  }
  return inside;
}

function pointInPolygonCoords(px, py, rings) {
  // rings[0] = anneau extérieur, rings[1..] = trous
  if (!pointInRing(px, py, rings[0])) return false;
  for (let i = 1; i < rings.length; i++) {
    if (pointInRing(px, py, rings[i])) return false;
  }
  return true;
}

function pointInGeometry(px, py, geometry) {
  if (geometry.type === 'Polygon') {
    return pointInPolygonCoords(px, py, geometry.coordinates);
  }
  if (geometry.type === 'MultiPolygon') {
    return geometry.coordinates.some((poly) => pointInPolygonCoords(px, py, poly));
  }
  return false;
}

// ---------------------------------------------------------------------------
// Pré-traitement des départements : bbox + géométrie
// ---------------------------------------------------------------------------

function bboxOfGeometry(geometry) {
  const exteriorRings =
    geometry.type === 'Polygon'
      ? [geometry.coordinates[0]]
      : geometry.coordinates.map((poly) => poly[0]);

  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const ring of exteriorRings) {
    for (const [x, y] of ring) {
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    }
  }
  return [minX, minY, maxX, maxY];
}

const deptFeatures = deptsGeo.features.map((f) => ({
  code: String(f.properties.code),
  nom: String(f.properties.nom),
  bbox: bboxOfGeometry(f.geometry),
  geometry: f.geometry,
}));

// ---------------------------------------------------------------------------
// Calcul des intersections fleuve × département
// ---------------------------------------------------------------------------

/** @type {Record<string, Set<string>>} */
const riverDepts = {};
/** @type {Record<string, number>} scalerank minimum par cours d'eau (segments fusionnés) */
const riverScalerank = {};

for (const feature of fleuves.features) {
  const rawName = typeof feature.properties?.name === 'string' ? feature.properties.name : null;
  if (!rawName) continue;
  const name = normalize(rawName);

  const rank = typeof feature.properties?.scalerank === 'number' ? feature.properties.scalerank : 99;
  riverScalerank[name] = Math.min(riverScalerank[name] ?? 99, rank);

  const coords = getCoordsFromGeometry(feature.geometry);
  if (coords.length === 0) continue;

  if (!riverDepts[name]) riverDepts[name] = new Set();
  const found = riverDepts[name];

  for (const [px, py] of coords) {
    for (const dept of deptFeatures) {
      if (found.has(dept.code)) continue; // déjà trouvé, inutile de retester
      const [minX, minY, maxX, maxY] = dept.bbox;
      if (px < minX || px > maxX || py < minY || py > maxY) continue;
      if (pointInGeometry(px, py, dept.geometry)) {
        found.add(dept.code);
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Mise en forme : tri alphabétique des noms, tri numérique des codes
// ---------------------------------------------------------------------------

function sortCodes(codes) {
  return [...codes].sort((a, b) => {
    const na = parseInt(a, 10);
    const nb = parseInt(b, 10);
    if (!isNaN(na) && !isNaN(nb)) return na - nb;
    return a.localeCompare(b);
  });
}

/** @type {Record<string, { depts: string[], scalerank: number }>} */
const output = {};
for (const name of Object.keys(riverDepts).sort()) {
  const depts = sortCodes(riverDepts[name]);
  if (depts.length > 0) {
    output[name] = { depts, scalerank: riverScalerank[name] ?? 99 };
  }
}

// ---------------------------------------------------------------------------
// Écriture
// ---------------------------------------------------------------------------

const outPath = join(root, 'src/data/fleuvesDepts.json');
writeFileSync(outPath, JSON.stringify(output, null, 2) + '\n', 'utf8');

// ---------------------------------------------------------------------------
// Résumé
// ---------------------------------------------------------------------------

const entries = Object.entries(output);
console.log(`\n✓ ${entries.length} cours d'eau avec au moins un département français\n`);
const THRESHOLD = 11;
for (const [name, { depts, scalerank }] of entries) {
  const reliable = scalerank <= THRESHOLD;
  const deptsStr = reliable ? depts.join(', ') : `(rank ${scalerank} — depts non affichés)`;
  console.log(`  rank${scalerank} ${name.padEnd(22)} ${deptsStr}`);
}
console.log(`\nRésultat écrit dans src/data/fleuvesDepts.json`);
