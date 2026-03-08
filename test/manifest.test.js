#!/usr/bin/env node
/**
 * Test suite for digital-twin-emotion-engine-providers twin pack
 * 
 * Validates the pack structure, manifest, and cassette integrity.
 */

const fs = require('fs');
const path = require('path');

// Test results tracking
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

// Get the directory of this test file
const packRoot = path.join(__dirname, '..');

// Test 1: Manifest exists and is valid JSON
test('manifest.json exists and is valid JSON', () => {
  const manifestPath = path.join(packRoot, 'manifest.json');
  assert(fs.existsSync(manifestPath), 'manifest.json not found');
  
  const content = fs.readFileSync(manifestPath, 'utf8');
  const manifest = JSON.parse(content);
  
  assert(manifest.version === '1.0', 'Missing or invalid version');
  assert(manifest.name === 'emotion-engine-providers', 'Invalid name');
  assert(manifest.defaultCassetteId === 'providers', 'Missing defaultCassetteId');
  assert(manifest.cassettes && manifest.cassettes.providers, 'Missing providers cassette mapping');
});

// Test 2: Cassette file exists and is valid JSON
test('cassettes/providers.json exists and is valid JSON', () => {
  const cassettePath = path.join(packRoot, 'cassettes/providers.json');
  assert(fs.existsSync(cassettePath), 'cassettes/providers.json not found');
  
  const content = fs.readFileSync(cassettePath, 'utf8');
  const cassette = JSON.parse(content);
  
  assert(cassette.version === '1.0', 'Missing or invalid cassette version');
  assert(cassette.meta, 'Missing meta');
  assert(cassette.interactions && Array.isArray(cassette.interactions), 'Missing or invalid interactions');
  assert(cassette.interactions.length >= 4, 'Expected at least 4 interactions for all providers');
});

// Test 3: All required providers are present
test('cassette contains interactions for all required providers', () => {
  const cassettePath = path.join(packRoot, 'cassettes/providers.json');
  const cassette = JSON.parse(fs.readFileSync(cassettePath, 'utf8'));
  
  const providers = {
    openrouter: false,
    anthropic: false,
    openai: false,
    gemini: false
  };
  
  for (const interaction of cassette.interactions) {
    const body = JSON.parse(interaction.request.body);
    const url = interaction.request.url;
    
    if (url.includes('openrouter.ai')) providers.openrouter = true;
    if (url.includes('anthropic.com')) providers.anthropic = true;
    if (url.includes('openai.com')) providers.openai = true;
    if (url.includes('generativelanguage.googleapis.com')) providers.gemini = true;
  }
  
  assert(providers.openrouter, 'Missing OpenRouter interaction');
  assert(providers.anthropic, 'Missing Anthropic interaction');
  assert(providers.openai, 'Missing OpenAI interaction');
  assert(providers.gemini, 'Missing Gemini interaction');
});

// Test 4: Interactions have required fields
test('all interactions have required fields', () => {
  const cassettePath = path.join(packRoot, 'cassettes/providers.json');
  const cassette = JSON.parse(fs.readFileSync(cassettePath, 'utf8'));
  
  for (const interaction of cassette.interactions) {
    assert(interaction.id, `Interaction missing id`);
    assert(interaction.request, `Interaction ${interaction.id} missing request`);
    assert(interaction.request.method, `Interaction ${interaction.id} request missing method`);
    assert(interaction.request.url, `Interaction ${interaction.id} request missing url`);
    assert(interaction.request.body, `Interaction ${interaction.id} request missing body`);
    assert(interaction.response, `Interaction ${interaction.id} missing response`);
    assert(interaction.response.content !== undefined, `Interaction ${interaction.id} response missing content`);
    assert(interaction.response.usage, `Interaction ${interaction.id} response missing usage`);
  }
});

// Summary
console.log('\n================================================');
console.log(`Tests: ${passed + failed} total`);
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);
console.log('================================================\n');

if (failed > 0) {
  process.exit(1);
}
