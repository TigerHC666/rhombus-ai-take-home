"""Build a navigable index from recorded real runs; never invent run outcomes."""
import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
EVIDENCE = ROOT / 'observations/evidence'


def read(path, default=None):
    return json.loads(path.read_text(encoding='utf-8')) if path.is_file() else default


def build_index():
    runs = []
    for manifest_path in sorted(EVIDENCE.glob('*/*/run-manifest.json')):
        directory = manifest_path.parent
        manifest = read(manifest_path)
        validation = read(directory / 'validation.json', {})
        source = read(directory / 'source-provenance.json', {})
        configuration = read(directory / 'configuration.json', [])
        jobs = read(directory / 'job-states.json', [])
        inventory = read(directory / 'gcs/inventory.json', [])
        implementation = [{k: n.get(k) for k in ('node_id', 'code', 'prompt', 'inputs', 'outputs')}
                          for n in configuration]
        code_hash = hashlib.sha256(json.dumps(implementation, sort_keys=True).encode()).hexdigest() if implementation else None
        runs.append({
            'scenario': manifest.get('scenario', directory.parent.name),
            'phase': manifest.get('phase', 'scheduled' if manifest.get('trigger') == 'scheduled' else directory.name),
            'evidence': directory.relative_to(ROOT).as_posix(),
            'trigger': manifest.get('trigger'),
            'started_at': manifest.get('triggered_at') or manifest.get('observed_after') or manifest.get('started_at'),
            'finished_at': manifest.get('finished_at') or manifest.get('observed_until'),
            'observed_job_status': jobs[-1].get('status') if jobs else None,
            'source_sha256': source.get('sha256') or validation.get('source_sha256'),
            'implementation_and_graph_sha256': code_hash,
            'full_configuration_verified_before_run': manifest.get('configuration_verified_before_run', False),
            'output_count': len(inventory),
            'outputs': [{k: item.get(k) for k in ('name', 'generation', 'sha256', 'timeCreated')} for item in inventory],
            'output_rows': validation.get('output_rows'),
            'business_values_match': validation.get('business_values_match'),
            'strict_contract_passed': validation.get('passed'),
            'schedule_disabled': manifest.get('schedule_disabled'),
            'validation_present': bool(validation),
        })
    (ROOT / 'observations/run-index.json').write_text(json.dumps(runs, indent=2) + '\n', encoding='utf-8')
    print(f'Indexed {len(runs)} recorded run manifests; missing evidence remains null.')
    return runs


if __name__ == '__main__':
    build_index()
