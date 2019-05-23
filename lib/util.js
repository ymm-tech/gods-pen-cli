const path = require('path')
const fs = require('fs-extra')
const inquirer = require('inquirer')
const chalk = require('chalk')
const exec = require('child_process').exec

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

module.exports = {
  quiz,
  confirm,
  log,
  asyncExec,
  logGreen,
  logRed,
  isNullOrUndefined,
  normalizeName
}
