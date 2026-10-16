"""Read or replace the single authorized assessment source key."""
import argparse
import hashlib
import json
import os
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / '.runtime/vendor'))
import boto3

BUCKET = os.environ.get('ASSESSMENT_S3_BUCKET', 'rhombus-assessment-source-20261017-hc666')
KEY = 'orders.csv'


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--scenario', required=True)
    parser.add_argument('--upload', action='store_true')
    parser.add_argument('--credentials', type=Path, default=ROOT / '.secrets/aws-source.json')
    parser.add_argument('--destination', type=Path, required=True)
    args = parser.parse_args()
    manifest = json.loads((ROOT / 'datasets/manifest.json').read_text())
    contract = manifest[args.scenario]
    fixture = ROOT / 'datasets' / contract['input']
    data = fixture.read_bytes()
    if hashlib.sha256(data).hexdigest() != contract['input_sha256']:
        raise ValueError('Frozen source fixture changed')
    credentials = json.loads(args.credentials.read_text())
    client = boto3.client('s3', region_name=os.environ.get('ASSESSMENT_S3_REGION', 'ap-southeast-2'),
                         aws_access_key_id=credentials['aws_access_key_id'],
                         aws_secret_access_key=credentials['aws_secret_access_key'])
    if args.upload:
        client.put_object(Bucket=BUCKET, Key=KEY, Body=data, ContentType='text/csv')
    response = client.get_object(Bucket=BUCKET, Key=KEY)
    downloaded = response['Body'].read(1000001)
    if len(downloaded) > 1000000:
        raise ValueError('Source exceeds assessment size bound')
    args.destination.mkdir(parents=True, exist_ok=True)
    (args.destination / 'source.csv').write_bytes(downloaded)
    actual_hash = hashlib.sha256(downloaded).hexdigest()
    evidence = {
        'bucket': BUCKET, 'key': KEY, 'scenario': args.scenario,
        'retrieved_at': datetime.now(timezone.utc).isoformat(),
        'last_modified': response['LastModified'].isoformat(),
        'etag': response['ETag'], 'version_id': response.get('VersionId'),
        'sha256': actual_hash, 'expected_sha256': contract['input_sha256'],
        'matches_fixture': actual_hash == contract['input_sha256'],
        'bytes': len(downloaded), 'uploaded_this_call': args.upload,
    }
    (args.destination / 'source-provenance.json').write_text(json.dumps(evidence, indent=2) + '\n')
    print(json.dumps(evidence))
    if not evidence['matches_fixture']:
        raise SystemExit(1)


if __name__ == '__main__':
    main()
