# digital-twin-emotion-engine-providers

Canonical digital-twin cassette pack for `emotion-engine` AI provider tests.

## Ownership

This sibling repo is the source of truth for the provider replay pack.

- Canonical pack repo: `digital-twin-emotion-engine-providers`
- Primary consumer: `emotion-engine`
- Canonical cassette: `cassettes/providers.json`
- Manifest entrypoint: `manifest.json`

If `emotion-engine` carries a local fixture copy, that copy is transitional drift and should be updated to consume this repo directly rather than becoming a second authority.

## What the pack contains

The default `providers` cassette includes offline replay interactions for:

- OpenAI
- Anthropic
- Gemini
- OpenRouter

It intentionally includes **two identical OpenRouter interactions** so sequential replay consumers can satisfy multiple identical OpenRouter calls in one test process without a cache miss.

## How consumers should use it

From `emotion-engine`, point `DIGITAL_TWIN_PACK` at the sibling repo path:

```bash
DIGITAL_TWIN_PACK=../digital-twin-emotion-engine-providers
DIGITAL_TWIN_CASSETTE=providers
```

The digital-twin router resolves `manifest.json`, uses `defaultCassetteId`, and reads cassette files from `cassettes/`.

## Validation

Run the pack verification locally:

```bash
npm test
npm pack --dry-run
```

The test suite verifies:

- manifest validity
- cassette presence and JSON integrity
- provider coverage
- duplicate OpenRouter replay coverage
- published tarball includes the cassette file
