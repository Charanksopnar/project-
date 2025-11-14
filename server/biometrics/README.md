# Multi-Angle Face Capture and Verification

This folder contains a prototype Python script to perform multi-angle facial capture
and verification. It walks users through five poses (center, left, right, up, down),
captures face embeddings for each pose, and either enrolls a user or verifies a live
session against an enrolled reference.

Files:

- `multi_angle_capture.py` - Main script. Run with `--mode enroll` or `--mode verify`.
- `requirements.txt` - Python dependencies.
 
Notes about the updated script:

- The script now emits a JSON object to stdout when run with `--json`; this makes it easier
  for the Node.js wrapper (`pythonRunner.js`) to parse results programmatically.
- New command-line options:
  - `--camera` - integer camera index to open (default 0)
  - `--timeout` - per-pose timeout in seconds (default 20.0)
  - `--json` - print machine-readable JSON output

Example (PowerShell):

```powershell
# Enroll with JSON output, camera index 0
python server/biometrics/multi_angle_capture.py --mode enroll --id alice --json --camera 0

# Verify and get JSON result
python server/biometrics/multi_angle_capture.py --mode verify --id alice --json
```

Exit and error handling:

- The script returns structured JSON on success and for most error conditions when `--json` is used.
- When not using `--json`, the script logs human readable messages to stderr/stdout.
- Common exit codes are represented in the JSON `code` field (0 = success, non-zero = various failures).

Quick start (Windows PowerShell):

1. Create a virtual environment and activate it:

```powershell
python -m venv .venv; .\.venv\Scripts\Activate.ps1
pip install -r server/biometrics/requirements.txt
```

2. Enroll a user (example id `alice`):

```powershell
python server/biometrics/multi_angle_capture.py --mode enroll --id alice
```

3. Verify the same user:

```powershell
python server/biometrics/multi_angle_capture.py --mode verify --id alice
```

Notes and caveats:

- Installing `face_recognition` and `dlib` on Windows may require Visual Studio Build Tools
  and cmake. If you run into issues, consider using the project's Node.js/JS face-api
  integration already present in the repo, or use a Linux WSL environment for simpler
  installation.
- This script is a prototype; for production you should harden error handling,
  secure storage of embeddings, and add liveness/spoof checks (e.g., texture, depth).

Integration:

You can call this script from your Node.js server (e.g., `server/secure-server.js`) using
child processes, or port the capture logic into the front-end and only use Python for
server-side verification if preferred.
