const os = require('os')
const path = require('path')
const fs = require('fs-extra')
const request = require('request')
const commander = require('commander')
const runScript = require('runscript')
const unzip = require('unzip')
const ora = require('ora')
const util = require('./util')

const TMP_DIR = os.tmpdir()
const CWD = process.cwd()
const REPOS = [
  { uri: 'https://github.com/node-modules/runscript.git', name: 'runscript', start: [] },
  { uri: 'https://github.com/EvanOxfeld/node-unzip.git', name: 'node-unzip', start: '' },
]

async function initProject () {
  await checkYarn()
  await fetchProject()
  await installDependency()
}

function startServer () {
  for (let repo of REPOS) {
    ;(repo.start instanceof Array ? repo.start : [repo.start]).map((cmd) => {
      runScript(`cd ${repo.name} && ${cmd}`)
    })
  }
}

// async function configProject () {
//   let status = await util.dirCheck(path.resolve(CWD, 'gods-pen/src/config/dev.js', ''), { onlyCheck: true })
// }

async function checkYarn () {
  const hasYarn = await util.commandExist('yarn')
  if (!hasYarn) {
    util.logRed('未安装 yarn，请安装后再操作\nnpm install yarn -g')
    process.exit()
  }
}

async function installDependency () {
  for (let repo of REPOS) {
    await install(repo)
  }

  async function install ({name}) {
    let status = await util.dirCheck(path.resolve(CWD, name, 'node_modules'), { onlyCheck: true })
    if ('na' !== status) return
    const cmd = `cd ${name} && yarn`
    const spinner = ora(`${name} 依赖安装中`).start()
    await runScript(cmd, {stdio: 'pipe'})
    spinner.succeed(`${name} 依赖安装成功`)
  }
}

async function fetchProject () {
  const hasGit = await util.commandExist('git')
  
  for (let repo of REPOS) {
    await fetch(repo)
  }

  async function fetch ({uri, name}) {
    const repoPath = path.resolve(CWD, name)
    const repoZipPath = path.resolve(TMP_DIR, `${name}.${Math.random().toString(16).slice(2, 12)}.zip`)
    if ('keep' === (await util.dirCheck(repoPath, { msg: '%s 已存在，是否仍需从代码仓库获取？' }))) return
    const spinner = ora(`${hasGit ? '通过 git' : ''} 获取 ${uri}`).start()
    if (hasGit) {
      await runScript(`git clone ${uri} --depth=1`, { stdio: 'pipe' })
      spinner.succeed(`${uri} 获取成功`)
      return
    }
    let file = fs.createWriteStream(repoZipPath)
    await new Promise((resolve, reject) => {
      request({
        uri: uri.replace(/\.git$/, '/archive/master.zip'),
        gzip: true
      })
      .pipe(file)
      .on('finish', resolve)
      .on('error', reject)
    })
    .catch(error => {
      console.log(`request failed: ${error}`)
    })
    spinner.text = `${uri} 下载完成`
    await new Promise((resolve, reject) => {
      fs.createReadStream(repoZipPath)
        .pipe(unzip.Extract({ path: CWD }))
        .on('close', resolve)
        .on('error', reject)
    })
    spinner.text = `${uri} 解压完成`
    await fs.move(repoPath.replace(/[\/]?$/, '-master'), repoPath)
    spinner.succeed(`${uri} 获取成功`)
  }
}

async function start () {
  commander
    .arguments('[fetch|start]', '拉取代码/启动服务')
    .parse(process.argv)

  const op = commander.args[0]
  if (op === 'fetch') initProject()
  if (op === 'start') startServer()
}

// module.exports = start

startServer()
