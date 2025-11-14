const { spawn } = require('child_process');
const { execSync } = require('child_process');

/**
 * Check if Python is available on the system
 */
function checkPythonAvailable() {
  try {
    const python = process.env.PYTHON || 'python';
    execSync(`${python} --version`, { stdio: 'pipe' });
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Run a python script with arguments and capture stdout/stderr.
 * Returns a Promise that resolves to { code, stdout, stderr }.
 */
function runPython(scriptPath, args = [], options = {}) {
  // Check if Python is available
  if (!checkPythonAvailable()) {
    return Promise.resolve({
      code: 1,
      stdout: '',
      stderr: 'Error: Python is not installed or not available in PATH. Please install Python to use biometric features.',
      killed: false
    });
  }

  const python = process.env.PYTHON || 'python';
  const fullArgs = [scriptPath, ...args];
  const spawned = spawn(python, fullArgs, { shell: false });

  let stdout = '';
  let stderr = '';

  spawned.stdout.on('data', (data) => {
    stdout += data.toString();
  });

  spawned.stderr.on('data', (data) => {
    stderr += data.toString();
  });

  const timeout = options.timeout || 120000; // default 2 minutes
  let killed = false;
  const timer = setTimeout(() => {
    killed = true;
    try {
      spawned.kill('SIGKILL');
    } catch (e) {
      // ignore
    }
  }, timeout);

  return new Promise((resolve) => {
    spawned.on('close', (code) => {
      clearTimeout(timer);
      resolve({ code, stdout, stderr, killed });
    });

    spawned.on('error', (err) => {
      clearTimeout(timer);
      resolve({ code: 1, stdout, stderr: String(err), killed });
    });
  });
}

module.exports = { runPython };
