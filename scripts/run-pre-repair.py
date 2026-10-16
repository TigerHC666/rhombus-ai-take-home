"""Run isolated real drift observations without changing the frozen AI-built code."""
import argparse
import json
import os
from pathlib import Path
import shutil
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]
EVIDENCE = ROOT / 'observations/evidence'
BASELINE = json.loads((EVIDENCE / 'baseline/configuration-v3.json').read_text())


def implementation(nodes):
    return sorted(nodes, key=lambda node: node['node_id'])


def run(scenario, phase):
    before = set((EVIDENCE / scenario).glob(f'{phase}-*')) if (EVIDENCE / scenario).exists() else set()
    environment = dict(os.environ, SCENARIO=scenario, RUN_PHASE=phase)
    environment.pop('BUILDER_PROMPT_FILE', None)
    result = subprocess.run([shutil.which('npx.cmd') or 'npx', 'playwright', 'test',
                             'ui-tests/manual-output.spec.cjs'], cwd=ROOT, env=environment)
    created = set((EVIDENCE / scenario).glob(f'{phase}-*')) - before
    if len(created) != 1:
        raise RuntimeError('Expected exactly one new run evidence directory')
    directory = created.pop()
    required = ['run-manifest.json', 'configuration-before.json', 'configuration.json', 'validation.json',
                'source-after/source-provenance.json', 'page-and-logs.txt', 'job-states.json']
    for file in required:
        if not (directory / file).is_file():
            raise RuntimeError(f'Incomplete execution evidence: {directory / file}')
    configuration = json.loads((directory / 'configuration.json').read_text())
    before_configuration = json.loads((directory / 'configuration-before.json').read_text())
    if implementation(before_configuration) != implementation(BASELINE):
        raise RuntimeError('Pre-execution configuration differs from the frozen baseline')
    if implementation(configuration) != implementation(BASELINE):
        raise RuntimeError('AI-built configuration changed during isolated pre-repair observations')
    validation = json.loads((directory / 'validation.json').read_text())
    manifest = json.loads((directory / 'run-manifest.json').read_text())
    if result.returncode and not any(message in manifest.get('failure', '') for message in
                                    ('The actual cloud output must satisfy the frozen contract',
                                     'Pipeline must produce a fresh output')):
        raise RuntimeError('Unexpected test harness failure; inspect the run manifest')
    if scenario == 'baseline' and not validation.get('business_values_match'):
        raise RuntimeError('Baseline restoration did not restore the expected business values')
    record = {'scenario': scenario, 'evidence': directory.relative_to(ROOT).as_posix(),
              'test_exit_code': result.returncode, 'validation_passed': validation['passed'],
              'business_values_match': validation.get('business_values_match'),
              'configuration_unchanged': True, 'configuration_check_scope': 'full allowlisted configuration before and after execution'}
    with (EVIDENCE / 'pre-repair-runs.jsonl').open('a', encoding='utf-8') as handle:
        handle.write(json.dumps(record) + '\n')
    print(json.dumps(record), flush=True)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('scenarios', nargs='+', choices=[
        'schema-drop', 'schema-rename', 'schema-type', 'schema-add',
        'schema-combined', 'semantic-cents', 'semantic-dates'])
    args = parser.parse_args()
    try:
        for scenario in args.scenarios:
            run(scenario, 'pre-repair')
            run('baseline', 'restore-after-' + scenario)
    except Exception:
        recovery = subprocess.run([sys.executable, 'data-validation/source_s3.py', '--scenario', 'baseline',
                                   '--upload', '--destination', '.runtime/aborted-batch-source-restoration'], cwd=ROOT)
        print(f'Batch aborted. Baseline source restoration exit code: {recovery.returncode}', flush=True)
        raise
