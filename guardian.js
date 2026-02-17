const { spawn } = require('child_process');
const http = require('http');
const path = require('path');

const CONFIG = {
  backend: {
    command: 'npm',
    args: ['run', 'dev'],
    cwd: path.join(__dirname, 'server'),
    port: 5000,
    healthUrl: 'http://localhost:5000/health',
    name: 'Backend Server',
  },
  frontend: {
    command: 'npm',
    args: ['run', 'dev'],
    cwd: path.join(__dirname, 'client'),
    port: 5173,
    healthUrl: 'http://localhost:5173',
    name: 'Frontend Client',
  },
  intervals: {
    healthCheck: 10000, // 10 seconds
    respawnDelay: 3000, // 3 seconds
  }
};

const processes = {
  backend: null,
  frontend: null
};

function log(name, message, type = 'info') {
  const timestamp = new Date().toLocaleTimeString();
  const colors = {
    info: '\x1b[36m', // Cyan
    warn: '\x1b[33m', // Yellow
    error: '\x1b[31m', // Red
    success: '\x1b[32m', // Green
    reset: '\x1b[0m'
  };
  console.log(`${colors.reset}[${timestamp}] ${colors[type]}[${name}]${colors.reset} ${message}`);
}

function startProcess(key) {
  const config = CONFIG[key];
  log(config.name, `Starting process...`, 'info');

  const proc = spawn(config.command, config.args, {
    cwd: config.cwd,
    shell: true,
    stdio: 'inherit'
  });

  processes[key] = proc;

  proc.on('exit', (code) => {
    log(config.name, `Process exited with code ${code}. Restarting in ${CONFIG.intervals.respawnDelay}ms...`, 'warn');
    processes[key] = null;
    setTimeout(() => startProcess(key), CONFIG.intervals.respawnDelay);
  });

  proc.on('error', (err) => {
    log(config.name, `Failed to start process: ${err.message}`, 'error');
  });
}

function checkHealth(key) {
  const config = CONFIG[key];
  if (!processes[key]) return;

  http.get(config.healthUrl, (res) => {
    if (res.statusCode === 200) {
      // res.on('data', () => {}); // Consume data
      // log(config.name, 'Health check passed', 'success');
    } else {
      log(config.name, `Health check failed with status: ${res.statusCode}`, 'warn');
    }
  }).on('error', (err) => {
    log(config.name, `Health check failed: ${err.message}`, 'error');
    // We don't necessarily kill the process here because it might just be slow to start
    // NPM run dev can take a while to bind to the port
  });
}

// Initial Start
log('Guardian', 'Initializing Infinite-Running Infrastructure...', 'success');
startProcess('backend');
startProcess('frontend');

// Periodic Health Checks
setInterval(() => {
  checkHealth('backend');
  checkHealth('frontend');
}, CONFIG.intervals.healthCheck);

// Handle Guardian Shutdown
process.on('SIGINT', () => {
  log('Guardian', 'Shutting down all processes...', 'warn');
  if (processes.backend) processes.backend.kill();
  if (processes.frontend) processes.frontend.kill();
  process.exit(0);
});
