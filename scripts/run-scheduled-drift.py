"""Observe source drift on a frozen real pipeline using only its actual schedule."""
import argparse
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]
EVIDENCE = ROOT / 'observations/evidence'
SCENARIOS = ['schema-drop', 'schema-rename', 'schema-type', 'schema-add', 'schema-combined', 'semantic-cents', 'semantic-dates']


def skipped(directory, name):
    file = directory / name
    text = file.read_text(encoding='utf-8') if file.exists() else ''
    match = re.search(r'Skipped\s+(\d+)\s+time\(s\).*unchanged data', text, re.I)
    return int(match.group(1)) if match else 0


def reject_unexpected_errors(manifest):
    """Only known outcome assertions may be collected as product observations."""
    accepted = (
        'A new GCS generation must appear after schedule observation begins',
        'Fresh output must correlate with a new schedule-history execution',
        'Every output must match the independent business oracle',
        'Every output must satisfy the strict CSV contract, including monetary precision',
        'At least one observed scheduled execution must succeed',
    )
    for error in manifest.get('errors', []):
        message = re.sub(r'\x1b\[[0-9;]*m', '', error.get('message', ''))
        if error.get('causes') or not message.startswith(accepted):
            raise RuntimeError('Unexpected transport/harness error; inspect evidence before another source mutation')


def run(scenario, frozen):
    parent = EVIDENCE / scenario
    before = set(parent.glob('scheduled-pre-repair-*'))
    env = dict(os.environ, SCENARIO=scenario, RUN_PHASE='scheduled-pre-repair',
               SCHEDULE_CRON='*/1 * * * *', UPLOAD_SOURCE='1', FROZEN_CONFIGURATION_FILE=str(frozen))
    env.pop('BUILDER_PROMPT_FILE', None)
    env.pop('RECORD_DEMO', None)
    result = subprocess.run([shutil.which('npx.cmd') or 'npx', 'playwright', 'test',
                             'ui-tests/scheduled-output.spec.cjs'], cwd=ROOT, env=env)
    created = set(parent.glob('scheduled-pre-repair-*')) - before
    if len(created) != 1:
        raise RuntimeError('Expected exactly one scheduled evidence directory')
    directory = created.pop()
    manifest = json.loads((directory / 'run-manifest.json').read_text(encoding='utf-8'))
    for key in ['inactive_before_source_verified', 'source_uploaded_before_activation',
                'schedule_disabled', 'frozen_configuration_before_match', 'frozen_configuration_after_match']:
        if manifest.get(key) is not True:
            raise RuntimeError(f'{key} not verified; stop without another source mutation')
    if manifest.get('history_error'):
        raise RuntimeError('History retrieval failed; stop without another source mutation')
    if manifest.get('backend_schedule_disabled') is False:
        raise RuntimeError('Backend schedule remains active; stop without another source mutation')
    reject_unexpected_errors(manifest)
    executions = manifest.get('executions', [])
    if executions and (manifest.get('trigger') != 'scheduled' or len(executions) > 3 or
                       any(row.get('trigger') != 'scheduled' or not isinstance(row.get('success'), bool) for row in executions)):
        raise RuntimeError('Scheduled trigger/outcome not verified; stop for review')
    if any(not row.get('completed_at') for row in executions):
        raise RuntimeError('Scheduled job may still be active; stop without changing source')
    skip_before = skipped(directory, 'schedule-before-source.txt')
    skip_after = max(skipped(directory, 'schedule-after-window.txt'), skipped(directory, 'schedule-inactive.txt'))
    # An absent notice while Active is not an explicit zero/reset measurement.
    # Do not treat its later reappearance as a proven newly counted skip.
    full_window = any('Timeout 110000ms exceeded' in row.get('message', '') and
                      row.get('message', '').startswith('A new GCS generation must appear')
                      for row in manifest.get('errors', []))
    if not executions and skip_after <= skip_before and not full_window:
        raise RuntimeError('No terminal execution, new skip, or completed bounded observation window')
    if not (directory / 'validation.json').exists():
        raise RuntimeError('Independent validation evidence missing')
    outputs = manifest.get('outputs', [])
    validations = manifest.get('output_validations', [])
    if outputs:
        if len(validations) != len(outputs) or any(not (directory / row['report']).is_file() for row in validations):
            raise RuntimeError('Not every downloaded candidate has a validation report')
    elif manifest.get('missing_output_validation', {}).get('output_present') is not False:
        raise RuntimeError('Explicit missing-output validation evidence missing')
    for file in ['source-provenance.json', 'source-after/source-provenance.json']:
        if json.loads((directory / file).read_text(encoding='utf-8')).get('matches_fixture') is not True:
            raise RuntimeError('Source evidence does not match the frozen scenario')
    record = {'scenario': scenario, 'evidence': directory.relative_to(ROOT).as_posix(),
              'test_exit_code': result.returncode, 'new_executions': len(executions),
              'observation_kind': 'scheduled_execution' if executions else (
                  'increased_skip_notice' if skip_after > skip_before else 'bounded_no_new_execution'),
              'new_skip_event_verified': not executions and skip_after > skip_before,
              'unchanged_skip_count_before': skip_before, 'unchanged_skip_count_after': skip_after,
              'configuration_frozen': True, 'schedule_disabled': True}
    with (EVIDENCE / 'scheduled-pre-repair-runs.jsonl').open('a', encoding='utf-8') as output:
        output.write(json.dumps(record) + '\n')
    print(json.dumps(record), flush=True)
    subprocess.run([sys.executable, 'data-validation/source_s3.py', '--scenario', 'baseline', '--upload',
                    '--destination', str(directory / 'baseline-restoration')], cwd=ROOT, check=True)
    return result.returncode


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--frozen', required=True, type=Path)
    parser.add_argument('scenarios', nargs='+', choices=SCENARIOS)
    args = parser.parse_args()
    frozen = args.frozen.resolve(strict=True)
    exits = [run(scenario, frozen) for scenario in args.scenarios]
    raise SystemExit(1 if any(exits) else 0)
