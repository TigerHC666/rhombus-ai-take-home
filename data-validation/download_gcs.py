"""Download only assessment outputs, preserving object generation and checksums."""
import argparse
import hashlib
import json
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import quote

from google.oauth2 import service_account
from google.auth.transport.requests import AuthorizedSession

BUCKET = 'rhombus-assessment-output-20261017-hc6'
ROOT = Path(__file__).resolve().parents[1]


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--key', type=Path, default=ROOT / '.secrets/gcs-writer-key.json')
    parser.add_argument('--destination', type=Path, default=ROOT / 'observations/evidence/gcs')
    parser.add_argument('--since', help='Only objects created at or after this UTC ISO timestamp')
    parser.add_argument('--list-only', action='store_true', help='Return metadata without downloading CSVs')
    args = parser.parse_args()
    credentials = service_account.Credentials.from_service_account_file(
        args.key, scopes=['https://www.googleapis.com/auth/devstorage.read_only'])
    session = AuthorizedSession(credentials)
    args.destination.mkdir(parents=True, exist_ok=True)
    objects = []
    page_token = None
    while True:
        params = {'prefix': 'orders_cleaned_', 'maxResults': 100}
        if page_token:
            params['pageToken'] = page_token
        response = session.get(f'https://storage.googleapis.com/storage/v1/b/{BUCKET}/o', params=params, timeout=30)
        response.raise_for_status()
        body = response.json()
        objects.extend(body.get('items', []))
        page_token = body.get('nextPageToken')
        if not page_token:
            break
    if args.since:
        boundary = datetime.fromisoformat(args.since.replace('Z', '+00:00'))
        objects = [item for item in objects if datetime.fromisoformat(item['timeCreated'].replace('Z', '+00:00')) >= boundary]
    if args.list_only:
        print(json.dumps([{key: item.get(key) for key in ['name', 'generation', 'timeCreated', 'size']} for item in objects]))
        return
    inventory = []
    for item in objects:
        name = item['name']
        if '/' in name or not name.endswith('.csv') or int(item['size']) > 1000000:
            raise ValueError('Unexpected object outside the bounded CSV output contract')
        target = args.destination / name
        response = session.get(
            f'https://storage.googleapis.com/storage/v1/b/{BUCKET}/o/{quote(name, safe="")}',
            params={'alt': 'media', 'generation': item['generation']}, timeout=30)
        response.raise_for_status()
        target.write_bytes(response.content)
        inventory.append({
            **{field: item.get(field) for field in ['name', 'generation', 'size', 'timeCreated', 'updated', 'md5Hash', 'crc32c']},
            'sha256': hashlib.sha256(response.content).hexdigest(),
            'retrieved_at': datetime.now(timezone.utc).isoformat(),
        })
    (args.destination / 'inventory.json').write_text(json.dumps(inventory, indent=2) + '\n', encoding='utf-8')
    print(json.dumps({'bucket': BUCKET, 'downloaded_objects': len(inventory)}))


if __name__ == '__main__':
    main()
