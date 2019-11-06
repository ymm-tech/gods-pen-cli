const path = require('path')
const fs = require('fs-extra')
const inquirer = require('inquirer')
const chalk = require('chalk')
const request = require('request-promise')
const runScript = require('runscript')
const exec = require('child_process').exec

const IS_WIN = process.platform === 'win32'
const PROCESS_REGEX = IS_WIN ? /^(.*)\s+(\d+)\s*$/ : /^\s*(\d+)\s+(.*)/

function quiz (msg, backup) {
  return inquirer.prompt([{
    name: 'input',
    type: 'input',
    default: backup,
    message: msg,
  }]).then(({input}) => input)
}

function log (msg, color) {
  var msgStr = msg instanceof Error ? msg.message : typeof msg == 'object' ? JSON.stringify(msg, null, 2) : msg 
  if (color) {
    msgStr = (chalk[color] || chalk['white'])(msgStr)
  }
  console.log(msgStr)
}

function logGreen (msg) {
  log(msg, 'green')
}

function logRed (msg) {
  log(msg, 'red')
}

function confirm (msg, backup = true) {
  return inquirer.prompt([{
    name: 'yes',
    type: 'confirm',
    default: backup,
    message: msg,
  }]).then(({yes}) => yes)
}

function select (msg, list, backup = 0) {
  return inquirer.prompt([{
    name: 'select',
    type: 'list',
    choices: list,
    default: backup,
    message: msg,
  }]).then(({select}) => select)
}

function checks (msg, list) {
  return inquirer.prompt([{
    name: 'checks',
    type: 'checkbox',
    choices: list,
    message: msg,
  }]).then(({checks}) => checks)
}

function isNullOrUndefined (arg) {
  return arg === null || arg === '' || arg === null
}

function asyncExec (cmd) {
  var ls = exec(cmd)
  return new Promise((resolve, reject) => {
    ls.stdout.on('data', log)
    ls.stderr.on('data', logRed)
    ls.on('error', reject)
    ls.on('close', resolve)
  })
}

function normalizeName (name = '') {
  return name.replace(/[-_]+(\w)/g, (m, p) => p.toUpperCase())
}

function getTags (host) {
  var options = {
    method: 'POST',
    url: `${host}/editor/tags/list`,
    json: true,
    headers: {
      'cache-control': 'no-cache',
      'Content-Type': 'application/json;charset=UTF-8',
      Accept: 'application/json, texhtml' 
    },
    body: {"categoryId":3, "name":""}
  }

  return request(options)
  .then(({data}) => data)
  .catch(e => [])
}

async function findNodeProcess (filterFn) {
  const command = IS_WIN ?
    'wmic Path win32_process Where "Name = \'node.exe\'" Get CommandLine,ProcessId' :
    'ps -eo "pid,args"'
  const stdio = await runScript(command, { stdio: 'pipe' })
  const processList = stdio.stdout.toString().split('\n')
    .reduce((arr, line) => {
      if (!!line && !line.includes('/bin/sh') && line.includes('node')) {
        const m = line.match(PROCESS_REGEX)
        if (m) {
          const item = IS_WIN ? { pid: m[2], cmd: m[1] } : { pid: m[1], cmd: m[2] }
          if (!filterFn || filterFn(item)) {
            arr.push(item)
          }
        }
      }
      return arr
    }, [])
  return processList
}

function killProcess (pids, signal) {
  pids = typeof pids === 'string' ? pids.split(',') : pids
  pids.forEach(pid => {
    try {
      process.kill(pid, signal)
    } catch (err) {
      if (err.code !== 'ESRCH') {
        throw err
      }
    }
  })
}

async function commandExist (cmd) {
  cmd = IS_WIN ? `where ${cmd}` : `type ${cmd}`
  const stdio = await runScript(cmd, { stdio: 'pipe' }).catch(e => ({stderr: e.toString()}))
  return !stdio.stderr
}

async function dirCheck (dir, {
  msg = '%s 已存在，确定要覆盖它么?',
  onlyCheck = false,
  defaultRemove = true
} = {}) { // 默认值缺失 https://github.com/ymm-tech/gods-pen-cli/issues/3
  let exist = await fs.pathExists(dir)
  if (!exist) return 'na'
  if (onlyCheck) return 'keep'
  let shouldDelete = await confirm(msg.replace(/%s/g, dir), defaultRemove)
  if (!shouldDelete) return 'keep'
  await fs.remove(dir)
  return 'clear'
}

module.exports = {
  quiz,
  getTags,
  confirm,
  select,
  checks,
  log,
  asyncExec,
  logGreen,
  logRed,
  isNullOrUndefined,
  normalizeName,
  findNodeProcess,
  killProcess,
  commandExist,
  dirCheck
}
