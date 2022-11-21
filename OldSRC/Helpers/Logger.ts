const format = require('dateformat')
const chalk = require('chalk')

const log = (content: string[], color = 'white') => {
  content = content || [];
  if (!Array.isArray(content)) {
    content = [content]
  }
  const time = format(Date.now(), 'mm/dd HH:MM:ss')
  const log = [
    chalk.gray(time),
    '|',
    ...content.map((str) => chalk[color](str))
  ]
  // eslint-disable-next-line no-console
  console.log(...log)
  return log
}

export const Logger = {
  success: (...content: string[]) => log(content, 'green'),
  warn: (...content: string[]) => log(content, 'yellow'),
  error: (...content: string[]) => log(content, 'red'),
  info: (...content: string[]) => log(content, 'cyan'),
  log: (...content: string[]) => log(content),
}
export default Logger;
export type Logger = typeof Logger;