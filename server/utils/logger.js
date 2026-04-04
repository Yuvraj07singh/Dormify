// ─── Structured Logger ─────────────────────────────────────────────────
// Production-ready logging utility replacing console.log throughout the app.
// Outputs structured JSON in production, pretty-printed in development.

const LOG_LEVELS = { error: 0, warn: 1, info: 2, http: 3, debug: 4 };

const currentLevel = () => {
    const env = process.env.NODE_ENV || "development";
    return env === "production" ? "warn" : "debug";
};

const shouldLog = (level) => LOG_LEVELS[level] <= LOG_LEVELS[currentLevel()];

const formatMessage = (level, message, meta = {}) => {
    const timestamp = new Date().toISOString();
    const isProd = process.env.NODE_ENV === "production";

    if (isProd) {
        return JSON.stringify({ timestamp, level, message, ...meta });
    }

    const colors = { error: "\x1b[31m", warn: "\x1b[33m", info: "\x1b[36m", http: "\x1b[35m", debug: "\x1b[37m" };
    const reset = "\x1b[0m";
    const color = colors[level] || reset;
    const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : "";
    return `${color}[${timestamp}] [${level.toUpperCase()}]${reset} ${message}${metaStr}`;
};

const log = (level, message, meta) => {
    if (!shouldLog(level)) return;
    const formatted = formatMessage(level, message, meta);
    if (level === "error") {
        console.error(formatted);
    } else if (level === "warn") {
        console.warn(formatted);
    } else {
        console.log(formatted);
    }
};

const logger = {
    error: (msg, meta) => log("error", msg, meta),
    warn: (msg, meta) => log("warn", msg, meta),
    info: (msg, meta) => log("info", msg, meta),
    http: (msg, meta) => log("http", msg, meta),
    debug: (msg, meta) => log("debug", msg, meta),
};

module.exports = logger;
