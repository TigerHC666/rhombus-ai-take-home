"""Run the read-only API suite and local validator regression, saving safe summaries."""
import datetime
import json
import os
from pathlib import Path
import shutil
import subprocess
import sys
import time

ROOT = Path(__file__).resolve().parents[1]


def main():
    env = dict(os.environ)
    env.pop('RECORD_DEMO', None)
    started = datetime.datetime.now(datetime.timezone.utc).isoformat()
    report = ROOT / '.runtime/playwright-results.json'
    # A startup failure must never reuse a prior UI/API report as fresh evidence.
    if report.exists():
        report.replace(report.with_name(f'playwright-results-before-regression-{time.time_ns()}.json'))
    api = subprocess.run([shutil.which('npx.cmd') or 'npx', 'playwright', 'test', 'api-tests',
                          '--output', '.runtime/api-regression-output'], cwd=ROOT, env=env)
    if not report.is_file():
        raise RuntimeError(f'API process exited {api.returncode} without a fresh JSON report')
    raw = json.loads(report.read_text(encoding='utf-8'))
    tests = []

    def collect(suites):
        for suite in suites:
            for spec in suite.get('specs', []):
                for test in spec.get('tests', []):
                    tests.append({'title': spec['title'], 'file': spec['file'],
                                  'expected_status': test.get('expectedStatus'),
                                  'status': test.get('status'),
                                  'attempts': [{'status': r['status'], 'duration_ms': r['duration']}
                                               for r in test.get('results', [])]})
            collect(suite.get('suites', []))
    collect(raw.get('suites', []))
    if not tests or any('api-tests/' not in row['file'].replace('\\', '/') for row in tests):
        raise RuntimeError('Regression report must contain only the requested API tests')
    local = subprocess.run([sys.executable, '-m', 'unittest', 'discover', '-s', 'data-validation', '-p', 'test_*.py', '-v'],
                           cwd=ROOT, capture_output=True, text=True)
    print(local.stdout + local.stderr)
    (ROOT / 'observations/validator-regression.txt').write_text(local.stdout + local.stderr, encoding='utf-8')
    result = {'started_at': started, 'finished_at': datetime.datetime.now(datetime.timezone.utc).isoformat(),
              'api_exit_code': api.returncode, 'validator_exit_code': local.returncode,
              'passed': raw['stats'].get('expected', 0), 'failed': raw['stats'].get('unexpected', 0),
              'skipped': raw['stats'].get('skipped', 0), 'flaky': raw['stats'].get('flaky', 0), 'tests': tests}
    (ROOT / 'observations/final-regression.json').write_text(json.dumps(result, indent=2) + '\n', encoding='utf-8')
    return 1 if api.returncode or local.returncode else 0


if __name__ == '__main__':
    raise SystemExit(main())
