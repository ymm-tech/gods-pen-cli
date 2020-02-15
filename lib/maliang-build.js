const path = require('path')
const fs = require('fs-extra')
const util = require('./util')
const archiver = require('archiver')

const CWD = process.cwd()
const resolve = (...file) => path.resolve(process.cwd(), ...file)
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

function doPack () {
  const output = fs.createWriteStream(resolve(`${pkg.name}.zip`))
  const archive = archiver('zip', {
    zlib: { level: 9 }
  })

  const status = new Promise((resolve, reject) => {
    output.on('close', () => (console.log('打包完成', `${pkg.name}.zip`, archive.pointer() + ' bytes'), resolve()))
    archive.on('warning', err => err.code !== 'ENOENT' ? reject(err) : console.error(err))
    archive.on('error', err => reject(err))
  })

  archive.pipe(output)
  archive.append((() => {
    const {private = true, name = 'unknow', type = 0, description = '', version = '0.0.1', tags = []} = pkg
    return JSON.stringify({ private, name, type, description, version, tags }, null, 2) 
  })(), { name: 'package.json' })
  archive.file(resolve('icon.png'), { name: 'icon.png' })
  archive.file(resolve('README.md'), { name: 'README.md' })
  archive.directory(resolve('dist/'), 'dist')

  archive.finalize()
  return status
}

async function start ({pack = false, build = true} = {}) {
  await pkgImport()
  if (build) {
    util.logGreen('构建中...')
    await executeCmd()
    util.logGreen('构建完成')
  }
  if (pack) await doPack()
}

module.exports = start
