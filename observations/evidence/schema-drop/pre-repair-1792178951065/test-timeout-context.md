# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: ui-tests\manual-output.spec.cjs >> S3 source through AI-built pipeline to a fresh GCS export
- Location: ui-tests\manual-output.spec.cjs:11:1

# Error details

```
Test timeout of 600000ms exceeded.
```

```
Error: locator.click: Test timeout of 600000ms exceeded.
Call log:
  - waiting for getByRole('button', { name: 'Logs', exact: true })

```

# Page snapshot

```yaml
- generic [ref=e1]:
  - alert [ref=e2]
  - generic [ref=e5]:
    - generic [ref=e6]:
      - generic [ref=e7]:
        - button [ref=e9] [cursor=pointer]:
          - img "Rhombus AI Logo" [ref=e10]
        - button [ref=e12] [cursor=pointer]
      - generic [ref=e15]:
        - button "Dashboard" [ref=e16] [cursor=pointer]
        - button "New Project" [ref=e23] [cursor=pointer]
        - button "Search" [ref=e30] [cursor=pointer]
      - generic [ref=e35]:
        - generic [ref=e36]: All Projects (1)
        - link "LLM Observability Assessment" [ref=e39] [cursor=pointer]:
          - /url: /workflow/5348
          - generic [ref=e41]:
            - generic [ref=e44]: LLM Observability Assessment
            - button [ref=e46]
      - generic [ref=e53] [cursor=pointer]:
        - generic [ref=e54]: T
        - generic [ref=e56]: tiger.cai1116@gmail.com
    - generic [ref=e60]:
      - generic [ref=e64]:
        - generic [ref=e65]:
          - tablist [ref=e67]:
            - tab "Canvas" [selected] [ref=e68] [cursor=pointer]
            - tab "Workspace" [ref=e75] [cursor=pointer]
            - tab "Preview" [ref=e80] [cursor=pointer]
          - generic [ref=e86]:
            - button "Logs 1" [ref=e87] [cursor=pointer]:
              - generic [ref=e91]: Logs
              - generic [ref=e92]: "1"
            - button [ref=e93] [cursor=pointer]
        - generic [ref=e99]:
          - generic [ref=e101]:
            - generic:
              - generic:
                - img:
                  - button "Edge from 1792174488846 to llm_node_3" [ref=e102] [cursor=pointer]
                - img:
                  - button "Edge from llm_node_3 to sort_node_1"
                - img:
                  - button "Edge from sort_node_1 to output_node_1"
              - generic:
                - button "Amazon S3 Data Input Data Input" [ref=e105]:
                  - generic [ref=e107]:
                    - generic "Amazon S3"
                    - generic [ref=e117]:
                      - generic [ref=e118]: Data Input
                      - generic [ref=e119]: Data Input
                    - generic:
                      - button
                    - generic:
                      - button
                    - generic:
                      - button
                - button [ref=e129]:
                  - generic [ref=e131]:
                    - generic [ref=e136]:
                      - generic [ref=e137]: Custom
                      - generic [ref=e138]: "You are generating Python code for a Rhombus pipeline node. The input DataFrame is input_df_1. Output must be output_df and output_mask. Generate ONLY the following exact Python code. Do not modify, summarise or omit any line: import math import re from datetime import datetime from decimal import Decimal, ROUND_HALF_UP df = input_df_1.copy() def is_null_or_empty(val): try: if pd.isna(val): return True except Exception: pass if isinstance(val, str): return val.strip() == '' return False for col in df.columns: if df[col].dtype == object: df[col] = df[col].apply(lambda x: np.nan if (isinstance(x, str) and x.strip() == '') or (not isinstance(x, str) and is_null_or_empty(x)) else (x.strip() if isinstance(x, str) else x)) df['order_id'] = df['order_id'].apply(lambda x: x.upper() if isinstance(x, str) else x) df['currency'] = df['currency'].apply(lambda x: x.upper() if isinstance(x, str) else x) df['email'] = df['email'].apply(lambda x: x.lower() if isinstance(x, str) else x) df['status'] = df['status'].apply(lambda x: x.lower() if isinstance(x, str) else x) df['customer'] = df['customer'].apply(lambda x: 'Unknown' if is_null_or_empty(x) else x) def validate_email(val): if is_null_or_empty(val) or not isinstance(val, str): return '' return val if re.match(r'^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$', val) else '' df['email'] = df['email'].apply(validate_email) for col in ['order_id', 'currency', 'status']: if df[col].dtype == object: df = df[df[col].notna() & (df[col].astype(str).str.strip() != '')] else: df = df[df[col].notna()] df = df[df['order_date'].apply(lambda v: not is_null_or_empty(v) if isinstance(v, str) else pd.notna(v))] df = df[df['quantity'].apply(lambda v: not is_null_or_empty(v) if isinstance(v, str) else pd.notna(v))] df = df[df['unit_price'].apply(lambda v: not is_null_or_empty(v) if isinstance(v, str) else pd.notna(v))] df = df[df['currency'] == 'AUD'] df = df[df['status'].isin(['paid', 'pending'])] def parse_date(val): if val is None: return None try: if pd.isna(val): return None except Exception: pass if hasattr(val, 'strftime') and not isinstance(val, str): return val.strftime('%Y-%m-%d') s = str(val).strip() try: return datetime.strptime(s, '%m/%d/%Y').strftime('%Y-%m-%d') except Exception: pass try: return pd.to_datetime(s, format='%Y-%m-%d', errors='raise').strftime('%Y-%m-%d') except Exception: return None df['order_date'] = df['order_date'].apply(parse_date) df = df[df['order_date'].notna()] def validate_quantity(val): if isinstance(val, str): s = val.strip() return int(s) if re.match(r'^[1-9][0-9]*$', s) else None try: if pd.isna(val) or math.isinf(float(val)): return None except Exception: return None f = float(val) return int(f) if (f == int(f) and int(f) >= 1) else None df['quantity'] = df['quantity'].apply(validate_quantity) df = df[df['quantity'].notna()] def validate_unit_price(val): if isinstance(val, str): s = val.strip().lstrip('$') if re.match(r'^[0-9]+(\\.[0-9]{1,2})?$', s): d = Decimal(s) return d if d >= Decimal('0') else None return None try: if pd.isna(val) or math.isinf(float(val)): return None except Exception: return None f = float(val) return Decimal(str(round(f, 10))) if f >= 0.0 else None df['unit_price'] = df['unit_price'].apply(validate_unit_price) df = df[df['unit_price'].notna()] df = df.drop_duplicates(keep='first') def check_conflicting_duplicates(group): if len(group) > 1: first_row = group.iloc[0] for idx, row in group.iloc[1:].iterrows(): if not (first_row == row).all(): return None return group df = df.groupby('order_id', group_keys=False).apply(check_conflicting_duplicates).dropna(subset=['order_id']) def calc_total(row): return (Decimal(str(int(row['quantity']))) * row['unit_price']).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP) df['total_amount'] = df.apply(calc_total, axis=1) df['unit_price'] = df['unit_price'].apply(lambda x: str(x.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP))).astype(pd.StringDtype()) df['total_amount'] = df['total_amount'].apply(lambda x: str(x.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP))).astype(pd.StringDtype()) df['quantity'] = df['quantity'].astype(int) output_df = df[['order_id', 'customer', 'email', 'order_date', 'quantity', 'unit_price', 'currency', 'status', 'total_amount']] output_mask = pd.DataFrame(True, index=output_df.index, columns=output_df.columns)"
                    - generic:
                      - button
                    - generic:
                      - button
                    - generic:
                      - button
                - button [ref=e147]:
                  - generic [ref=e149]:
                    - img "Sort Data" [ref=e153]
                    - generic [ref=e154]:
                      - generic [ref=e155]: Sort Data
                      - generic [ref=e156]: "You are generating Python code for a Rhombus pipeline node. The input DataFrame is input_df_1. Output must be output_df and output_mask. Generate ONLY the following exact Python code. Do not modify, summarise or omit any line: import math import re from datetime import datetime from decimal import Decimal, ROUND_HALF_UP df = input_df_1.copy() def is_null_or_empty(val): try: if pd.isna(val): return True except Exception: pass if isinstance(val, str): return val.strip() == '' return False for col in df.columns: if df[col].dtype == object: df[col] = df[col].apply(lambda x: np.nan if (isinstance(x, str) and x.strip() == '') or (not isinstance(x, str) and is_null_or_empty(x)) else (x.strip() if isinstance(x, str) else x)) df['order_id'] = df['order_id'].apply(lambda x: x.upper() if isinstance(x, str) else x) df['currency'] = df['currency'].apply(lambda x: x.upper() if isinstance(x, str) else x) df['email'] = df['email'].apply(lambda x: x.lower() if isinstance(x, str) else x) df['status'] = df['status'].apply(lambda x: x.lower() if isinstance(x, str) else x) df['customer'] = df['customer'].apply(lambda x: 'Unknown' if is_null_or_empty(x) else x) def validate_email(val): if is_null_or_empty(val) or not isinstance(val, str): return '' return val if re.match(r'^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$', val) else '' df['email'] = df['email'].apply(validate_email) for col in ['order_id', 'currency', 'status']: if df[col].dtype == object: df = df[df[col].notna() & (df[col].astype(str).str.strip() != '')] else: df = df[df[col].notna()] df = df[df['order_date'].apply(lambda v: not is_null_or_empty(v) if isinstance(v, str) else pd.notna(v))] df = df[df['quantity'].apply(lambda v: not is_null_or_empty(v) if isinstance(v, str) else pd.notna(v))] df = df[df['unit_price'].apply(lambda v: not is_null_or_empty(v) if isinstance(v, str) else pd.notna(v))] df = df[df['currency'] == 'AUD'] df = df[df['status'].isin(['paid', 'pending'])] def parse_date(val): if val is None: return None try: if pd.isna(val): return None except Exception: pass if hasattr(val, 'strftime') and not isinstance(val, str): return val.strftime('%Y-%m-%d') s = str(val).strip() try: return datetime.strptime(s, '%m/%d/%Y').strftime('%Y-%m-%d') except Exception: pass try: return pd.to_datetime(s, format='%Y-%m-%d', errors='raise').strftime('%Y-%m-%d') except Exception: return None df['order_date'] = df['order_date'].apply(parse_date) df = df[df['order_date'].notna()] def validate_quantity(val): if isinstance(val, str): s = val.strip() return int(s) if re.match(r'^[1-9][0-9]*$', s) else None try: if pd.isna(val) or math.isinf(float(val)): return None except Exception: return None f = float(val) return int(f) if (f == int(f) and int(f) >= 1) else None df['quantity'] = df['quantity'].apply(validate_quantity) df = df[df['quantity'].notna()] def validate_unit_price(val): if isinstance(val, str): s = val.strip().lstrip('$') if re.match(r'^[0-9]+(\\.[0-9]{1,2})?$', s): d = Decimal(s) return d if d >= Decimal('0') else None return None try: if pd.isna(val) or math.isinf(float(val)): return None except Exception: return None f = float(val) return Decimal(str(round(f, 10))) if f >= 0.0 else None df['unit_price'] = df['unit_price'].apply(validate_unit_price) df = df[df['unit_price'].notna()] df = df.drop_duplicates(keep='first') def check_conflicting_duplicates(group): if len(group) > 1: first_row = group.iloc[0] for idx, row in group.iloc[1:].iterrows(): if not (first_row == row).all(): return None return group df = df.groupby('order_id', group_keys=False).apply(check_conflicting_duplicates).dropna(subset=['order_id']) def calc_total(row): return (Decimal(str(int(row['quantity']))) * row['unit_price']).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP) df['total_amount'] = df.apply(calc_total, axis=1) df['unit_price'] = df['unit_price'].apply(lambda x: str(x.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP))).astype(pd.StringDtype()) df['total_amount'] = df['total_amount'].apply(lambda x: str(x.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP))).astype(pd.StringDtype()) df['quantity'] = df['quantity'].astype(int) output_df = df[['order_id', 'customer', 'email', 'order_date', 'quantity', 'unit_price', 'currency', 'status', 'total_amount']] output_mask = pd.DataFrame(True, index=output_df.index, columns=output_df.columns) → Sort Data"
                    - generic:
                      - button
                    - generic:
                      - button
                    - generic:
                      - button
                - button "Data Output sort_7172c3fb843a192f4d712dc24ea9e4d4 → Data Output" [ref=e165]:
                  - generic [ref=e167]:
                    - generic [ref=e174]:
                      - generic [ref=e175]: Data Output
                      - generic [ref=e176]: sort_7172c3fb843a192f4d712dc24ea9e4d4 → Data Output
                    - generic:
                      - button
                    - generic:
                      - button
                    - generic:
                      - button
          - generic [ref=e186]:
            - button [ref=e187] [cursor=pointer]
            - button [active] [ref=e189] [cursor=pointer]
          - button [ref=e193] [cursor=pointer]
      - generic [ref=e201]:
        - generic [ref=e202]:
          - tablist [ref=e204]:
            - tab "AI Builder" [ref=e205] [cursor=pointer]
            - tab "Schedule" [ref=e209] [cursor=pointer]
            - tab "Transform" [selected] [ref=e216] [cursor=pointer]
            - tab "Profile" [ref=e221] [cursor=pointer]
          - button [ref=e226] [cursor=pointer]
        - complementary [ref=e230]:
          - generic [ref=e232]:
            - generic [ref=e233]: Data Input
            - generic [ref=e246]:
              - generic [ref=e247]:
                - generic [ref=e248]: Select Dataset
                - generic [ref=e250]:
                  - paragraph [ref=e251]: Click on the dataset below to select the pipeline input.
                  - list [ref=e252]:
                    - generic [ref=e253]:
                      - generic [ref=e255]:
                        - img "CSV" [ref=e258]
                        - generic [ref=e259]: orders.csv
                      - button "Preview dataset" [ref=e260] [cursor=pointer]
                      - generic "Amazon S3" [ref=e265]
              - generic [ref=e268]:
                - generic [ref=e269]: Upload Data
                - generic [ref=e271]:
                  - button "From Device" [ref=e272] [cursor=pointer]
                  - button "From Web URL" [ref=e278] [cursor=pointer]
                  - button "Third Party Sources" [ref=e285] [cursor=pointer]
              - generic [ref=e292]:
                - generic [ref=e293]: Data Sampling
                - generic [ref=e295]:
                  - paragraph [ref=e296]: Sampling is enabled by default to prevent full data downloads. Adjust the sample size or disable if needed.
                  - generic [ref=e297]:
                    - generic [ref=e298]:
                      - generic [ref=e299]: Sampling Configuration
                      - button "Guide" [ref=e300] [cursor=pointer]
                    - paragraph [ref=e306]: Sampling (100,000 rows) and streaming are always enabled to prevent full data downloads. You can adjust the sample size and method below.
                    - generic [ref=e307]:
                      - generic [ref=e308]: Enable Sampling
                      - switch "Enable Sampling" [checked] [disabled] [ref=e309]
                      - checkbox [checked] [disabled] [aria-hidden]
                    - generic [ref=e310]:
                      - generic [ref=e311]:
                        - generic [ref=e312]:
                          - generic [ref=e313]: Sampling Method
                          - button "Learn about each sampling method" [ref=e314] [cursor=pointer]
                        - combobox "Sampling Method" [ref=e317] [cursor=pointer]:
                          - generic: Head (First N rows)
                        - combobox [aria-hidden] [ref=e320]
                        - paragraph [ref=e321]: Fast. Takes the first N rows from the dataset.
                      - generic [ref=e322]:
                        - generic [ref=e323]:
                          - generic [ref=e324]:
                            - generic [ref=e325]: Sample Size (rows)
                            - button "Learn about sample size & percentage" [ref=e326] [cursor=pointer]
                          - spinbutton "Sample Size (rows)" [ref=e330]: "100000"
                        - generic [ref=e331]:
                          - text: Or Percentage (%)
                          - spinbutton "Or Percentage (%)" [ref=e333]
                      - generic [ref=e335]:
                        - generic [ref=e336]:
                          - generic [ref=e337]:
                            - generic [ref=e338]: Memory-Safe Streaming Mode
                            - button "Learn about streaming mode" [ref=e339] [cursor=pointer]
                          - paragraph [ref=e342]: Processes data in chunks to prevent full data downloads
                        - switch "Memory-Safe Streaming Mode" [checked] [disabled] [ref=e343]
                        - checkbox [checked] [disabled] [aria-hidden]
            - generic [ref=e344]:
              - button "Apply" [disabled]
  - generic [ref=e346]:
    - textbox [ref=e347]
    - generic:
      - button [ref=e348] [cursor=pointer]
      - generic:
        - button "Facet" [ref=e350] [cursor=pointer]
        - generic "28 credits remaining out of 50" [ref=e351]: 28/50
      - generic [ref=e357]:
        - button "Send message" [disabled]
```

# Test source

```ts
  1   | const { test, expect } = require('@playwright/test');
  2   | const fs = require('node:fs');
  3   | const path = require('node:path');
  4   | const { promisify } = require('node:util');
  5   | const execFile = promisify(require('node:child_process').execFile);
  6   | const settings = require('../test-support/settings.cjs');
  7   | const { openProject, confirmSource, observeRoutes, submitBuilderPrompt } = require('../test-support/workflow.cjs');
  8   | 
  9   | test.use({ storageState: settings.storageState });
  10  | 
  11  | test('S3 source through AI-built pipeline to a fresh GCS export', async ({ page }) => {
  12  |   test.setTimeout(600000);
  13  |   const scenario = process.env.SCENARIO || 'baseline';
  14  |   const phase = process.env.RUN_PHASE || 'unchanged';
  15  |   const directory = path.join(settings.root, 'observations/evidence', scenario, `${phase}-${Date.now()}`);
  16  |   fs.mkdirSync(directory, { recursive: true });
  17  |   const python = async args => (await execFile('python', args, { cwd: settings.root, timeout: 60000 })).stdout;
  18  |   const routes = observeRoutes(page);
  19  |   const jobStates = [];
  20  |   let configuration;
  21  |   page.on('response', async response => {
  22  |     if (new URL(response.url()).pathname.startsWith('/api/background_jobs/jobs/') && response.status() === 200) {
  23  |       const job = await response.json();
  24  |       jobStates.push({ observed_at: new Date().toISOString(), status: job.status, state: job.state,
  25  |         job_id: job.id || job.job_id, fields: Object.keys(job) });
  26  |       fs.writeFileSync(path.join(directory, 'job-states.json'), JSON.stringify(jobStates, null, 2));
  27  |     }
  28  |     if (new URL(response.url()).pathname !== `/api/dataset/analyzer/v2/projects/${settings.projectId}/nodes` || response.status() !== 200) return;
  29  |     const nodes = await response.json();
  30  |     configuration = nodes.map(node => ({
  31  |       node_id: node.node_id, inputs: node.inputs, outputs: node.outputs,
  32  |       transformation_type: node.transformation_type,
  33  |       prompt: node.params?.prompt,
  34  |       code: node.transformation_type === 'llm' ? node.params?.code : undefined,
  35  |       mode: node.transformation_type === 'llm' ? node.params?.mode : undefined,
  36  |       sort_columns: node.params?.sort_columns, ascending: node.params?.ascending,
  37  |       source_type: node.params?.source_type, data_asset_ref: node.params?.data_asset_ref,
  38  |       destination_id: node.params?.destination_id, format_type: node.params?.format_type,
  39  |     }));
  40  |   });
  41  |   const manifest = { scenario, phase, trigger: 'manual', started_at: new Date().toISOString() };
  42  |   const checkpoint = stage => {
  43  |     manifest.stage = stage;
  44  |     fs.writeFileSync(path.join(directory, 'run-manifest.json'), JSON.stringify(manifest, null, 2));
  45  |     console.log(`${scenario}: ${stage}`);
  46  |   };
  47  |   try {
  48  |     checkpoint('opening-project');
  49  |     await openProject(page);
  50  |     await page.getByRole('tab', { name: 'Schedule', exact: true }).click();
  51  |     await expect(page.getByRole('complementary')).toContainText('Schedules');
  52  |     await expect(page.getByRole('switch', { name: 'Deactivate schedule', exact: true })).toHaveCount(0);
  53  |     checkpoint('uploading-source');
  54  |     await python(['data-validation/source_s3.py', '--scenario', scenario, '--upload', '--destination', directory]);
  55  |     checkpoint('confirming-source');
  56  |     await confirmSource(page);
  57  |     if (process.env.BUILDER_PROMPT_FILE) {
> 58  |       await submitBuilderPrompt(page, fs.readFileSync(process.env.BUILDER_PROMPT_FILE, 'utf8'), directory);
      |                                                                   ^ Error: locator.click: Test timeout of 600000ms exceeded.
  59  |     }
  60  |     await page.getByRole('tab', { name: 'Canvas', exact: true }).click();
  61  |     manifest.triggered_at = new Date().toISOString();
  62  |     checkpoint('triggering-pipeline');
  63  |     await page.getByRole('button').filter({ has: page.locator('svg.lucide-play') }).click();
  64  |     checkpoint('waiting-for-output');
  65  |     let fresh = [];
  66  |     let outputTimeout;
  67  |     try {
  68  |       await expect.poll(async () => {
  69  |         fresh = JSON.parse(await python(['data-validation/download_gcs.py', '--list-only', '--since', manifest.triggered_at]));
  70  |         return fresh.length;
  71  |       }, { timeout: 150000, intervals: [5000], message: 'Fresh GCS export for this source mutation' }).toBeGreaterThan(0);
  72  |     } catch (error) {
  73  |       outputTimeout = error.message;
  74  |     }
  75  |     checkpoint('capturing-logs');
  76  |     await page.getByRole('button', { name: 'Logs', exact: true }).click();
  77  |     fs.writeFileSync(path.join(directory, 'page-and-logs.txt'), await page.locator('body').innerText());
  78  |     await page.screenshot({ path: path.join(directory, 'pipeline-result.png') });
  79  |     await confirmSource(page);
  80  |     await page.getByRole('tab', { name: 'Profile', exact: true }).click();
  81  |     await page.getByRole('complementary').getByRole('combobox').click();
  82  |     await page.getByRole('option', { name: 'quantity', exact: true }).press('Enter');
  83  |     await expect(page.getByRole('complementary')).toContainText('Overview');
  84  |     fs.writeFileSync(path.join(directory, 'quantity-profile.txt'), await page.getByRole('complementary').innerText());
  85  |     await python(['data-validation/source_s3.py', '--scenario', scenario, '--destination', path.join(directory, 'source-after')]);
  86  |     if (configuration) fs.writeFileSync(path.join(directory, 'configuration.json'), JSON.stringify(configuration, null, 2));
  87  |     if (fresh.length) {
  88  |       await python(['data-validation/download_gcs.py', '--since', manifest.triggered_at, '--destination', path.join(directory, 'gcs')]);
  89  |       manifest.outputs = JSON.parse(fs.readFileSync(path.join(directory, 'gcs/inventory.json')));
  90  |       const output = manifest.outputs.sort((a,b) => a.timeCreated.localeCompare(b.timeCreated))[0];
  91  |       try {
  92  |         await python(['data-validation/validate.py', '--scenario', scenario, '--source', path.join(directory, 'source.csv'), '--output', path.join(directory, 'gcs', output.name), '--report', path.join(directory, 'validation.json')]);
  93  |       } catch (error) {
  94  |         if (!fs.existsSync(path.join(directory, 'validation.json'))) throw error;
  95  |       }
  96  |       const validation = JSON.parse(fs.readFileSync(path.join(directory, 'validation.json')));
  97  |       manifest.business_values_match = validation.business_values_match;
  98  |       manifest.strict_contract_passed = validation.passed;
  99  |       expect(validation.passed, 'The actual cloud output must satisfy the frozen contract').toBe(true);
  100 |     } else {
  101 |       manifest.outputs = [];
  102 |       manifest.output_wait_failure = outputTimeout;
  103 |       fs.writeFileSync(path.join(directory, 'validation.json'), JSON.stringify({ scenario, passed: false, output_present: false, source_present: true, errors: ['No fresh output was observed in the bounded execution window'] }, null, 2));
  104 |       expect(fresh.length, 'Pipeline must produce a fresh output; inspect captured failure logs').toBeGreaterThan(0);
  105 |     }
  106 |   } catch (error) {
  107 |     manifest.failure = error.message;
  108 |     if (!page.isClosed()) {
  109 |       await page.screenshot({ path: path.join(directory, 'failure.png'), timeout: 10000 }).catch(() => {});
  110 |       await page.locator('body').innerText({ timeout: 10000 }).then(text => fs.writeFileSync(path.join(directory, 'failure-page.txt'), text)).catch(() => {});
  111 |     }
  112 |     throw error;
  113 |   } finally {
  114 |     manifest.finished_at = new Date().toISOString();
  115 |     fs.writeFileSync(path.join(directory, 'run-manifest.json'), JSON.stringify(manifest, null, 2));
  116 |     fs.writeFileSync(path.join(directory, 'network-endpoints.json'), JSON.stringify([...routes.values()], null, 2));
  117 |   }
  118 | });
  119 | 
```