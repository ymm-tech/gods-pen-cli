#!/usr/bin/env node

const {execSync, spawn} = require('child_process')
const os = require('os')

const versionDiff = (v1, v2) => {
  const vers = [v1, v2].map(String).map(v => v.split('.').map(a => `0000${a}`).join('.'))
  return vers[0] > vers[1] ? 1 : vers[0] == vers[1] ? 0 : -1
}

function asyncExec (cmd, args = []) {
  const ls = spawn(cmd, args, { stdio: 'inherit' })
  return new Promise((resolve, reject) => {
    ls.on('error', reject)
    ls.on('close', resolve)
  })
}

const exist = (() => {
  try {
    execSync(os.platform() !== 'win32' ? 'type gods-pen-publish' : 'where gods-pen-publish')
    return true
  } catch (e) {
    return false
  }
})()

const outOfDate = (() => {
  if (!exist) return false
  let version = '0.0.0'
  try {
    version = execSync('gods-pen -v')
    version = version.toString().trim()
  } catch (e) {
  }
  return versionDiff(version, '1.0.6') <= 0
})()

;(async () => {
  console.log('开始执行组件发布，请按照提示操作')
  if (outOfDate) {
    console.log('gods-pen 工具版本过低或未安装，将为您升级到最新版本')
    await asyncExec('npm', ['install', 'gods-pen-cli', '-g'])
  }
  
  await asyncExec('gods-pen', ['publish'])
})()
