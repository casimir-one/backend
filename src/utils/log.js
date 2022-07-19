import chalk from 'chalk';

const logWithOrWithoutData = (msg, data) => data ? console.info(msg, data) : console.info(msg);

const logInfo = (msg, err) => console.info(chalk.white(msg), err);
const logError = (msg, err) => console.error(chalk.red(msg), err);
const logWarn = (msg) => console.warn(chalk.yellow(msg));
const logCmdInfo = (msg) => console.info(chalk.blue(msg));
const logEventInfo = (msg) => console.info(chalk.cyan(msg));

const logDebug = (msg, data) => logWithOrWithoutData(chalk.hex('#FFA500')(msg), data);
const logProcessManagerInfo = (msg, data) => logWithOrWithoutData(chalk.magenta(msg), data);


module.exports = {
  logInfo,
  logError,
  logDebug,
  logWarn,
  logCmdInfo,
  logEventInfo,
  logProcessManagerInfo
}