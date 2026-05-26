import type {LogLevel} from '../../types/index'

// --- Betterstack (Logtail) transport ---
const LOGTAIL_TOKEN = process.env.LOGTAIL_TOKEN;
const LOGTAIL_URL = process.env.LOGTAIL_URL || 'https://s2467770.eu-fsn-3.betterstackdata.com';

function formatForBetterstack(message: string, data?: unknown): string {
  if (data === undefined || data === null) return message;
  if (data instanceof Error) return `${message} — ${data.message}`;
  if (typeof data === 'object') {
    const summary = Object.entries(data as Record<string, unknown>)
      .map(([k, v]) => `${k}=${typeof v === 'string' ? v : JSON.stringify(v)}`)
      .join(' ');
    return `${message} | ${summary}`;
  }
  return `${message} — ${data}`;
}

function sendToBetterstack(level: LogLevel, message: string, data?: unknown): void {
  if (!LOGTAIL_TOKEN) return;

  const payload = {
    dt: new Date().toISOString(),
    level,
    message: formatForBetterstack(message, data),
    ...(data instanceof Error
      ? { error: data.message, stack: data.stack }
      : typeof data === 'object' && data !== null
        ? data as Record<string, unknown>
        : data !== undefined
          ? { data }
          : {}),
  };

  fetch(LOGTAIL_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${LOGTAIL_TOKEN}`,
    },
    body: JSON.stringify(payload),
  }).catch(() => {
    // non-critical — never block on logging
  });
}

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
} as const;

const levelColors: Record<LogLevel, string> = {
  debug: colors.dim,
  info: colors.green,
  warn: colors.yellow,
  error: colors.red,
};

const levelIcons: Record<LogLevel, string> = {
  debug: '🔍',
  info: 'ℹ️ ',
  warn: '⚠️ ',
  error: '❌',
};

const LOG_LEVEL: LogLevel = (process.env.LOG_LEVEL as LogLevel) || 'info';
const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= LOG_LEVELS[LOG_LEVEL];
}

function formatTimestamp(): string {
  return new Date().toISOString();
}

function formatData(data: unknown): string {
  if (data === undefined || data === null) {
    return '';
  }
  
  if (data instanceof Error) {
    return `\n  ${colors.red}${data.message}${colors.reset}\n  ${colors.dim}${data.stack}${colors.reset}`;
  }
  
  if (typeof data === 'object') {
    try {
      return '\n  ' + JSON.stringify(data, null, 2).split('\n').join('\n  ');
    } catch {
      return String(data);
    }
  }
  
  return String(data);
}

function logToConsole(level: LogLevel, output: string): void {
  if (level === 'error') {
    console.error(output);
  } else if (level === 'warn') {
    console.warn(output);
  } else {
    console.log(output);
  }
}

function log(level: LogLevel, message: string, data?: unknown): void {
  if (!shouldLog(level)) return;

  const timestamp = formatTimestamp();
  const color = levelColors[level];
  const icon = levelIcons[level];
  const formattedData = formatData(data);
  const output = `${colors.dim}${timestamp}${colors.reset} ${icon} ${color}[${level.toUpperCase()}]${colors.reset} ${message}${formattedData}`;

  logToConsole(level, output);
  sendToBetterstack(level, message, data);
}

function debug(message: string, data?: unknown): void {
  log('debug', message, data);
}

function info(message: string, data?: unknown): void {
  log('info', message, data);
}

function warn(message: string, data?: unknown): void {
  log('warn', message, data);
}

function error(message: string, data?: unknown): void {
  log('error', message, data);
}

function call(callSid: string, level: LogLevel, message: string, data?: unknown): void {
  if (!shouldLog(level)) return;

  const callPrefix = `${colors.cyan}[${callSid.substring(0, 8)}...]${colors.reset}`;
  const timestamp = formatTimestamp();
  const color = levelColors[level];
  const icon = levelIcons[level];
  const formattedData = formatData(data);
  const output = `${colors.dim}${timestamp}${colors.reset} ${icon} ${color}[${level.toUpperCase()}]${colors.reset} ${callPrefix} ${message}${formattedData}`;

  logToConsole(level, output);

  const bsData = data instanceof Error
    ? { callSid, error: data.message, stack: data.stack }
    : typeof data === 'object' && data !== null
      ? { callSid, ...(data as Record<string, unknown>) }
      : data !== undefined
        ? { callSid, data }
        : { callSid };
  sendToBetterstack(level, message, bsData);
}

function apiTiming(
  service: string,
  operation: string,
  durationMs: number,
  success: boolean
): void {
  const status = success 
    ? `${colors.green}OK${colors.reset}` 
    : `${colors.red}FAIL${colors.reset}`;
  
  const duration = durationMs > 1000 
    ? `${colors.yellow}${durationMs}ms${colors.reset}` 
    : `${durationMs}ms`;
  
  info(`${service}.${operation}: ${status} (${duration})`);
}

function request(
  method: string,
  path: string,
  statusCode: number,
  durationMs: number
): void {
  const statusColor = statusCode >= 500 
    ? colors.red 
    : statusCode >= 400 
      ? colors.yellow 
      : colors.green;
  
  info(`${colors.cyan}${method}${colors.reset} ${path} ${statusColor}${statusCode}${colors.reset} ${durationMs}ms`);
}

const logger = {
  debug,
  info,
  warn,
  error,
  call,
  apiTiming,
  request,
};

export default logger;