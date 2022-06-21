import chalk from 'chalk';


const logInfo = (msg, err) => console.info(chalk.white(msg), err);
const logError = (msg, err) => console.error(chalk.red(msg), err);
const logWarn = (msg) => console.warn(chalk.yellow(msg));
const logCmdInfo = (msg) => console.info(chalk.blue(msg));
const logEventInfo = (msg) => console.info(chalk.cyan(msg));

const logProcessManagerInfo = (msg, data) => data ?
  console.info(chalk.magenta(msg), data) :
  console.info(chalk.magenta(msg))


module.exports = {
  logInfo,
  logError,
  logWarn,
  logCmdInfo,
  logEventInfo,
  logProcessManagerInfo
}