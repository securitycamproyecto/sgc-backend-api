import { createLogger, format, transports } from 'winston';
const { combine, timestamp, label, printf } = format;

const myFormat = printf(({ level, message, label, timestamp }: any) => {
  return `${timestamp} [${label}] ${level}: ${message}`;
});

const logger = createLogger({
    format: combine(
        label({ label: '⚡️ SecurityCam Admin Backend' }),
        timestamp(),
        myFormat
    ),
    transports: [
        new transports.Console()
    ]
});

export default logger;