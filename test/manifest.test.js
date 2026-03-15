#!/usr/bin/env node
/**
 * Test suite for digital-twin-emotion-engine-providers twin pack
 *
 * Validates the pack structure, manifest, cassette integrity, and publishable contents.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`✓ ${name}`);
    passed++;
  } catch (error) {
    console.error(`✗ ${name}`);
    console.error(`  Error: ${error.message}`);
    failed++;
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

console.log('Digital Twin Emotion Engine Providers - Pack Tests\n');
console.log('================================================\n');

const packRoot = path.join(__dirname, '..');

function loadManifest() {
  return JSON.parse(fs.readFileSync(path.join(packRoot, 'manifest.json'), 'utf8'));
}

function loadCassette() {
  return JSON.parse(fs.readFileSync(path.join(packRoot, 'cassettes/providers.json'), 'utf8'));
}

test('manifest.json exists and is valid JSON', () => {
  const manifestPath = path.join(packRoot, 'manifest.json');
  assert(fs.existsSync(manifestPath), 'manifest.json not found');

  const manifest = loadManifest();
  assert(manifest.version === '1.0', 'Missing or invalid version');
  assert(manifest.name === 'emotion-engine-providers', 'Invalid name');
  assert(manifest.defaultCassetteId === 'providers', 'Missing defaultCassetteId');
  assert(manifest.cassettes && manifest.cassettes.providers, 'Missing providers cassette mapping');
});

test('manifest-declared cassette files exist', () => {
  const manifest = loadManifest();
  for (const [cassetteId, cassettePath] of Object.entries(manifest.cassettes || {})) {
    const absoluteCassettePath = path.join(packRoot, cassettePath);
    assert(fs.existsSync(absoluteCassettePath), `Manifest cassette missing on disk: ${cassetteId} -> ${cassettePath}`);
  }
});

test('cassettes/providers.json exists and is valid JSON', () => {
  const cassettePath = path.join(packRoot, 'cassettes/providers.json');
  assert(fs.existsSync(cassettePath), 'cassettes/providers.json not found');

  const cassette = loadCassette();
  assert(cassette.version === '1.0', 'Missing or invalid cassette version');
  assert(cassette.meta, 'Missing meta');
  assert(cassette.interactions && Array.isArray(cassette.interactions), 'Missing or invalid interactions');
  assert(cassette.interactions.length >= 5, 'Expected at least 5 interactions including duplicate OpenRouter coverage');
});

test('cassette contains interactions for all required providers', () => {
  const cassette = loadCassette();

  const providers = {
    openrouter: 0,
    anthropic: 0,
    openai: 0,
    gemini: 0
  };

  for (const interaction of cassette.interactions) {
    const url = interaction.request.url;

    if (url.includes('openrouter.ai')) providers.openrouter++;
    if (url.includes('anthropic.com')) providers.anthropic++;
    if (url.includes('openai.com')) providers.openai++;
    if (url.includes('generativelanguage.googleapis.com')) providers.gemini++;
  }

  assert(providers.openrouter >= 2, 'Expected duplicate OpenRouter interactions for sequential replay');
  assert(providers.anthropic >= 1, 'Missing Anthropic interaction');
  assert(providers.openai >= 1, 'Missing OpenAI interaction');
  assert(providers.gemini >= 1, 'Missing Gemini interaction');
});

test('all interactions have required fields', () => {
  const cassette = loadCassette();

  for (const interaction of cassette.interactions) {
    assert(interaction.id, 'Interaction missing id');
    assert(interaction.request, `Interaction ${interaction.id} missing request`);
    assert(interaction.request.method, `Interaction ${interaction.id} request missing method`);
    assert(interaction.request.url, `Interaction ${interaction.id} request missing url`);
    assert(interaction.request.body, `Interaction ${interaction.id} request missing body`);
    assert(interaction.response, `Interaction ${interaction.id} missing response`);
    assert(interaction.response.content !== undefined, `Interaction ${interaction.id} response missing content`);
    assert(interaction.response.usage, `Interaction ${interaction.id} response missing usage`);
    assert(interaction.interactionId, `Interaction ${interaction.id} missing interactionId`);
  }
});

test('npm pack dry-run includes the cassette payload', () => {
  const output = execSync('npm pack --dry-run --json', {
    cwd: packRoot,
    encoding: 'utf8'
  });
  const packInfo = JSON.parse(output)[0];
  const files = packInfo.files.map((file) => file.path);

  assert(files.includes('cassettes/providers.json'), 'Packed tarball is missing cassettes/providers.json');
  assert(files.includes('manifest.json'), 'Packed tarball is missing manifest.json');
});

console.log('\n================================================');
console.log(`Tests: ${passed + failed} total`);
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);
console.log('================================================\n');

if (failed > 0) {
  process.exit(1);
}
