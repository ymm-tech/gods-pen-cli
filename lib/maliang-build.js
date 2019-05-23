const path = require('path')
const fs = require('fs-extra')
const util = require('./util')

let CWD = process.cwd()
let pkg = {}

async function pkgImport () {
  try {
    pkg = await fs.readJson(path.resolve(CWD, 'package.json'))
  } catch (err) {
    util.logRed(err.toString())
  }
  if (!pkg.scripts || !pkg.scripts['dist']) {
    util.logRed('请检查package.json文件是否提供了`dist`脚本')
    process.exit()
  }
}

async function executeCmd () {
  const BUILD_CMD = 'npm run dist'
  await util.asyncExec(BUILD_CMD)
}

async function start () {
  await pkgImport()
  util.logGreen('构建中...')
  await executeCmd()
  util.logGreen('构建完成')
}

module.exports = start
