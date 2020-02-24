const path = require('path')
const fs = require('fs-extra')
const util = require('./util')
const commander = require('commander')
const os = require('os')

let CONFIG_FILE = path.resolve(os.homedir(), '.godspen-config.json')
let OPTIONS = ['env', 'token', 'registry', 'shop-token']

async function readConfig () {
  let config
  if (!config) {
    try {
      config = await fs.readJson(CONFIG_FILE)
    } catch (e) {
      config = {token: '', registry: 'https://godspen.ymm56.com'}
      await fs.writeJson(CONFIG_FILE, config)
    }
  }
  return config
}

async function getConfig (key) {
  let config = await readConfig()
  if (key) return config[key]
  return config
}

async function setConfig (key, val) {
  if (!OPTIONS.includes(key)) {
    util.logRed(`无效配置项 ${key}`)
    process.exit()
  }
  let config = await readConfig()
  if (key && val) {
    config[key] = val
    await fs.writeJson(CONFIG_FILE, config, 'utf-8')
  }
  return config
}

async function removeConfig (key) {
  let config = await readConfig()
  delete config[key]
  await fs.writeJson(CONFIG_FILE, config, 'utf-8')
}

async function start () {
  commander
    .arguments('<key> [val]', '设置或者读取全局配置如`token`、`env`、`host`等')
    .option('-r, --rm', '移除配置')
    .parse(process.argv)

  let configKey = commander.args[0]
  let configVal = commander.args[1]
  let rm = commander['rm']

  let config
  if(!configKey) {
    config = await getConfig()
    return util.log(config)
  }
  if (configKey) {
    if (rm) {
      await removeConfig(configKey)
      return
    } else if (!configVal) {
      config = await getConfig(configKey)
      return util.log(config)
    }
  }
  if (configKey && configVal) {
    config = await setConfig(configKey, configVal)
    util.log(config)
  }
}

module.exports = {
  start,
  getConfig,
  setConfig
}
