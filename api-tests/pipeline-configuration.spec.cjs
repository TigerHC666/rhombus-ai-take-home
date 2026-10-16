const { test, expect } = require('@playwright/test');
const fs = require('node:fs');

test.use({ storageState: '.auth/rhombus.json' });

test('observed pipeline endpoint returns the connected assessment graph', async ({ page, context }) => {
  const observed = page.waitForRequest(request => {
    const url = new URL(request.url());
    return url.origin === 'https://api.rhombusai.com' &&
      url.pathname === '/api/dataset/analyzer/v2/projects/5348/nodes' && request.method() === 'GET';
  });
  await page.goto('/workflow/5348');
  const response = await context.request.fetch(await observed);
  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(Array.isArray(body)).toBe(true);
  expect(body.length).toBeGreaterThanOrEqual(3);
  expect(new Set(body.map(node => node.node_id)).size).toBe(body.length);
  for (const node of body) {
    expect(typeof node.node_id).toBe('string');
    expect(Array.isArray(node.inputs)).toBe(true);
    expect(Array.isArray(node.outputs)).toBe(true);
  }
  const source = body.find(node => node.params?.source_type === 's3');
  expect(source).toBeDefined();
  expect(typeof source.params.data_asset_ref).toBe('string');
  expect(source.params.data_asset_ref.length).toBeGreaterThan(0);
  const destination = body.find(node => node.params?.format_type === 'csv');
  expect(destination).toBeDefined();
  expect(destination.params.destination_id).toBeGreaterThan(0);
  expect(destination.inputs.length).toBeGreaterThan(0);
  // Strict allowlist: never serialize output-node credentials or full metadata.
  const configuration = body.map(node => ({
    node_id: node.node_id, name: node.name, inputs: node.inputs, outputs: node.outputs,
    transformation_type: node.transformation_type,
    prompt: node.params?.prompt,
    sort_columns: node.params?.sort_columns,
    ascending: node.params?.ascending,
    source_type: node.params?.source_type,
    dataset_id: node.params?.dataset_id,
    data_asset_ref: node.params?.data_asset_ref,
    source_connection_id: node.params?.source_connection_id,
    format_type: node.params?.format_type,
    destination_id: node.params?.destination_id,
    custom_filename: node.params?.custom_filename,
  }));
  fs.mkdirSync('.runtime', { recursive: true });
  fs.writeFileSync('.runtime/pipeline-configuration.json', JSON.stringify(configuration, null, 2));
});
