"""Create a captioned walkthrough from actual browser footage and recorded results.

Requires FFmpeg with drawtext, libx264 and concat filters. Result cards are
explicitly labeled as recorded evidence, never presented as live terminal input.
"""
import argparse
import json
from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parents[1]


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--api-summary', type=Path, required=True)
    parser.add_argument('--validation', type=Path, required=True)
    args = parser.parse_args()
    api = json.loads(args.api_summary.read_text(encoding='utf-8'))
    validation = json.loads(args.validation.read_text(encoding='utf-8'))
    if validation.get('scenario') != 'baseline' or not validation.get('output_sha256') or not validation.get('source_sha256'):
        raise ValueError('The artifact card requires a real baseline source/output validation report')
    directory = ROOT / '.runtime/demo-build'
    directory.mkdir(parents=True, exist_ok=True)
    cards = [
        ('API TESTS | Recorded CLI evidence\n\nnpm run test:api\n\n'
         f"Passed: {api['passed']}    Failed: {api['failed']}    Skipped: {api['skipped']}\n\n"
         f"API exit code: {api['api_exit_code']}    Flaky: {api.get('flaky', 0)}\n"
         f"Validator regression exit code: {api['validator_exit_code']}\n\n"
         'Observed backend requests; status and response assertions.\n'
         'Includes authorized access and anonymous rejection.\n\n'
         'Full test names and timestamps: observations/final-regression.json'),
        ('DATA VALIDATION | Actual cloud artifact\n\n'
         'python data-validation/validate.py --scenario baseline ...\n\n'
         f"Business values match: {validation.get('business_values_match')}\n"
         f"Strict contract passed: {validation['passed']}\n"
         f"Output rows: {validation.get('output_rows', 'unavailable')}\n\n"
         f"Output SHA-256 prefix: {validation['output_sha256'][:24]}\n"
         'This card describes one supplied artifact, not every candidate.\n\n'
         'The validator checks actual S3 bytes and downloaded GCS CSVs.\n'
         'Monetary trailing zeros remain a recorded product defect.\n'
         'A failed contract assertion is not relabeled as a passing test.'),
    ]
    for index, text in enumerate(cards):
        (directory / f'card-{index}.txt').write_text(text, encoding='utf-8')
    (directory / 'evidence-inputs.json').write_text(json.dumps({
        'api_summary': str(args.api_summary.resolve()),
        'validation_report': str(args.validation.resolve()),
        'output_sha256': validation['output_sha256'],
        'source_sha256': validation['source_sha256'],
    }, indent=2), encoding='utf-8')
    (directory / 'caption.txt').write_text(
        'ACTUAL CLI BROWSER RECORDING | 2x speed\n'
        'Existing S3 connection > AI Builder > GCS > inactive schedule configuration\n'
        'This run exposes a null-handling regression; see final-baseline.md for follow-up.', encoding='utf-8')
    # Position each line explicitly; font metrics vary across FFmpeg builds.
    def draw_lines(text, prefix, x, y, size, step):
        result = []
        for number, line in enumerate(text.splitlines()):
            if not line:
                continue
            filename = f'{prefix}-{number}.txt'
            (directory / filename).write_text(line, encoding='utf-8')
            result.append("drawtext=fontfile='C\\:/Windows/Fonts/arial.ttf':"
                          f"textfile='.runtime/demo-build/{filename}':fontcolor=white:"
                          f'fontsize={size}:x={x}:y={y + number * step}')
        return ','.join(result)

    # Relative paths avoid Windows drive-colon escaping in FFmpeg filters.
    filters = [
        '[0:v]setpts=PTS/2,fps=25,scale=1280:720,pad=1280:840:0:120:color=0x132237,' +
        draw_lines((directory / 'caption.txt').read_text(encoding='utf-8'), 'caption-line', 24, 18, 22, 32) + '[v0]'
    ]
    for index in range(2):
        filters.append(
            f'color=c=0x132237:s=1280x840:r=25:d=22,' +
            draw_lines(cards[index], f'card-{index}-line', 48, 55, 26, 43) + f'[v{index + 1}]')
    filters.append('[v0][v1][v2]concat=n=3:v=1:a=0[out]')
    subprocess.run(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y',
                    '-i', 'observations/demo/final-ui-journey.webm',
                    '-filter_complex', ';'.join(filters), '-map', '[out]',
                    '-c:v', 'libx264', '-preset', 'fast', '-crf', '25', '-pix_fmt', 'yuv420p',
                    '-movflags', '+faststart', 'observations/demo/walkthrough.mp4'], cwd=ROOT, check=True)


if __name__ == '__main__':
    main()
