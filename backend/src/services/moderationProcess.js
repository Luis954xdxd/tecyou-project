const path = require('path');
const { spawn } = require('child_process');
const axios = require('axios');

const MODERATION_HEALTH_URL =
  process.env.MODERATION_HEALTH_URL || 'http://127.0.0.1:8001/health';

let moderationProcess = null;

const getPythonCommand = () => {
  if (process.env.MODERATION_PYTHON) {
    return {
      command: process.env.MODERATION_PYTHON,
      argsPrefix: [],
    };
  }

  if (process.platform === 'win32') {
    return {
      command: 'py',
      argsPrefix: ['-3'],
    };
  }

  return {
    command: 'python3',
    argsPrefix: [],
  };
};

const isModerationRunning = async () => {
  try {
    const response = await axios.get(MODERATION_HEALTH_URL, { timeout: 700 });
    return Boolean(response.data?.ok);
  } catch {
    return false;
  }
};

const stopModerationService = () => {
  if (!moderationProcess || moderationProcess.killed) return;
  moderationProcess.kill();
  moderationProcess = null;
};

const startModerationService = async () => {
  if (process.env.AUTO_START_MODERATION === 'false') {
    console.log('Moderacion automatica desactivada por AUTO_START_MODERATION=false.');
    return;
  }

  if (await isModerationRunning()) {
    console.log('Servicio de moderacion ya activo en http://127.0.0.1:8001.');
    return;
  }

  const scriptPath = path.join(__dirname, '..', '..', 'moderation_app.py');
  const { command, argsPrefix } = getPythonCommand();

  moderationProcess = spawn(command, [...argsPrefix, scriptPath], {
    cwd: path.join(__dirname, '..', '..'),
    env: process.env,
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true,
  });

  moderationProcess.stdout.on('data', (data) => {
    process.stdout.write(`[moderacion] ${data}`);
  });

  moderationProcess.stderr.on('data', (data) => {
    process.stderr.write(`[moderacion] ${data}`);
  });

  moderationProcess.on('error', (error) => {
    console.error(
      'No se pudo iniciar el servicio de moderacion. ' +
        `Configura MODERATION_PYTHON si tu comando de Python es distinto. Detalle: ${error.message}`
    );
  });

  moderationProcess.on('exit', (code, signal) => {
    if (code !== 0 && signal !== 'SIGTERM') {
      console.error(`Servicio de moderacion detenido. code=${code}, signal=${signal || 'none'}`);
    }

    moderationProcess = null;
  });

  process.once('exit', stopModerationService);
  process.once('SIGINT', () => {
    stopModerationService();
    process.exit(0);
  });
  process.once('SIGTERM', () => {
    stopModerationService();
    process.exit(0);
  });

  console.log('Iniciando servicio de moderacion en http://127.0.0.1:8001...');
};

module.exports = {
  startModerationService,
};
