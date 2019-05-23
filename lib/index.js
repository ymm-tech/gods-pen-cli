const process = require('process')
const commander = require('commander')
const package = require('../package.json')

commander
  .version(package.version, '-v, --version')
  .description(`码良命令行工具 @${package.version}`)
  .usage('<command> [options]')
  .command('config <key> [val]', '全局配置')
  .command('create <name>', '创建一个组件')
  .command('build', '构建组件')
  .command('publish [options]', '发布组件')
  .parse(process.argv)
