"""Run real Builder repairs and bounded schedule follow-ups sequentially."""
import argparse
import json
import os
from pathlib import Path
import shutil
import subprocess

ROOT = Path(__file__).resolve().parents[1]
EVIDENCE = ROOT / 'observations/evidence'
SCENARIOS = ['schema-drop', 'schema-rename', 'schema-type', 'schema-add', 'schema-combined', 'semantic-cents', 'semantic-dates']


def execute(scenario, scheduled=False):
    prefix = 'scheduled-' if scheduled else 'post-repair-'
    parent = EVIDENCE / scenario
    before = set(parent.glob(prefix + '*'))
    env = dict(os.environ, SCENARIO=scenario, RUN_PHASE='post-repair', SCHEDULE_CRON='*/1 * * * *')
    env.pop('DIAGNOSTIC_MODE', None)
    env.pop('FROZEN_CONFIGURATION_FILE', None)
    env.pop('RECORD_DEMO', None)
    if scheduled:
        env.pop('BUILDER_PROMPT_FILE', None)
    else:
        env['BUILDER_PROMPT_FILE'] = str(ROOT / 'prompts/repairs' / (scenario + '.txt'))
    test_file = 'ui-tests/scheduled-output.spec.cjs' if scheduled else 'ui-tests/manual-output.spec.cjs'
    result = subprocess.run([shutil.which('npx.cmd') or 'npx', 'playwright', 'test', test_file], cwd=ROOT, env=env)
    added = set(parent.glob(prefix + '*')) - before
    if len(added) != 1:
        raise RuntimeError('Expected one evidence directory')
    directory = added.pop()
    manifest = json.loads((directory / 'run-manifest.json').read_text(encoding='utf-8'))
    if scheduled:
        if manifest.get('schedule_disabled') is not True:
            raise RuntimeError('Schedule cleanup not verified; stop before changing source')
        if manifest.get('trigger') != 'scheduled' or not manifest.get('executions'):
            raise RuntimeError('Scheduled trigger/history not verified; stop for review')
        if any(not item.get('completed_at') for item in manifest['executions']):
            raise RuntimeError('Scheduled execution still active; stop before changing source')
        if not (directory / 'validation.json').is_file():
            raise RuntimeError('Scheduled artifact observation incomplete; inspect before continuing')
    else:
        if manifest.get('terminal_job_status') not in ['SUCCESS', 'FAILED']:
            raise RuntimeError('Manual job has no verified terminal state; stop before changing source')
        if not (directory / 'validation.json').is_file():
            raise RuntimeError('Manual artifact observation incomplete')
        if manifest.get('profile_capture_error'):
            raise RuntimeError('Source-profile capture failed; inspect before continuing')
    record = {'scenario': scenario, 'scheduled': scheduled, 'test_exit_code': result.returncode,
              'evidence': directory.relative_to(ROOT).as_posix(),
              'note': 'Nonzero assertions remain failures; this runner collects product outcomes, not pass counts.'}
    with (EVIDENCE / 'repair-runs.jsonl').open('a', encoding='utf-8') as output:
        output.write(json.dumps(record) + '\n')
    print(json.dumps(record), flush=True)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('scenario', choices=SCENARIOS)
    args = parser.parse_args()
    execute(args.scenario)
    execute(args.scenario, scheduled=True)
    print('Review captured graph, final code and results before starting another scenario.', flush=True)
