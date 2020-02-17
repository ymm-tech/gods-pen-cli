const path = require('path')
const fs = require('fs-extra')
const util = require('./util')
const glob = require('glob')
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

async function fileExist (file) {
  return await new Promise(resolve => {
    fs.access(file, fs.constants.F_OK, err => resolve(!err))
  }).catch(() => false)
}

async function doPack () {
  const ICON = resolve('icon.png')
  const README = resolve('README.md')
  const CHANGELOG = resolve('CHANGELOG.md')
  const DIST = resolve('dist/')

  if (!(await fileExist(ICON))) return util.logRed('未获取到组件图标 icon.png')
  if (!(await fileExist(README))) return util.logRed('未获取到组件说明文件 README.md')
  if (!(await fileExist(CHANGELOG))) return util.logRed('未获取到组件变更记录 CHANGELOG.md')
  if (!(await fileExist(DIST))) return util.logRed('未获取到组件输出目录 dist/, 请 移除 "--skip-build" 选项后再次打包')

  const manifest = (() => {
    const {private = true, name = 'unknow', type = 0, description = '', version = '0.0.1', tags = []} = pkg
    const jss = glob.sync(resolve('dist/*.js'))
    const size = jss.reduce((o, f) => {
      o += fs.statSync(f).size
      return o
    }, 0)
    return JSON.stringify({ private, name, type, description, version, tags, size }, null, 2)
  })()

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
  archive.append(manifest, { name: 'package.json' })
  archive.file(ICON, { name: 'icon.png' })
  archive.file(README, { name: 'README.md' })
  archive.file(CHANGELOG, { name: 'CHANGELOG.md' })
  archive.directory(DIST, 'dist')

  archive.finalize()
  return await status
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
