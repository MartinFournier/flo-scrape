import { createLogger, format, transports } from 'winston';

const logger = createLogger({
  level: 'debug',
  format: format.combine(
    format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss',
    }),
    format.errors({ stack: true }),
    format.splat(),
    // format.json(),
  ),
  defaultMeta: { service: 'flo-scrape' },
  transports: [
    // new transports.File({ filename: 'error.log', level: 'error' }),
    // new transports.File({ filename: 'combined.log' }),
    new transports.Console({
      format: format.combine(
        format.colorize(),
        format.simple()
      )
    }),
  ],
});

// if (process.env.NODE_ENV !== 'production') {
//   logger.add(new transports.Console({
//     format: format.combine(
//       format.colorize(),
//       format.simple()
//     )
//   }));
// }

export { logger };
