const os = require('os')
const path = require('path')
const fs = require('fs-extra')
const request = require('request')
const commander = require('commander')
const runScript = require('runscript')
const unzip = require('unzip')
const ora = require('ora')
const open = require('open')
const util = require('./util')

const TMP_DIR = os.tmpdir()
const CWD = process.cwd()
const REPOS = [
  {
    uri: 'https://github.com/ymm-tech/gods-pen.git',
    name: 'gods-pen',
    start: ['npm run editor:dev', 'npm run client:dev'],
    build: ['npm run editor:build', 'npm run client:build']
  },
  { 
    uri: 'https://github.com/ymm-tech/gods-pen-admin.git',
    name: 'gods-pen-admin',
    start: ['npm run dev'],
    build: ['npm run build']
  },
  { 
    uri: 'https://github.com/ymm-tech/gods-pen-server.git',
    name: 'gods-pen-server',
    start: ['npm run dev'],
  }
]

async function initProject () {
  await checkYarn()
  await fetchProject()
  await installDependency()
  await showHowToConfigProject()
}

function startServer () {
  util.logGreen('请确保已对项目进行了必要配置\n')
  for (let repo of REPOS) {
    ;(repo.start instanceof Array ? repo.start : [repo.start]).map((cmd) => {
      runScript(`cd ${repo.name} && ${cmd}`)
    })
  }
}

async function buildProject () {
  util.logGreen('请确保已对项目进行了必要配置\n')
  const DEST = path.resolve(CWD, 'gods-pen-dist')
  await fs.ensureDir(DEST)
  for (let repo of REPOS) {
    if (!repo.build || !repo.build.length) continue
    for (let cmd of (repo.build instanceof Array ? repo.build : [repo.build])) {
      await runScript(`cd ${repo.name} && ${cmd}`)
    }
    await fs.copy(path.resolve(CWD, repo.name, 'dist/'), DEST)
  }
  util.logGreen(`完成构建，至 ${DEST} 查看`)
}

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
    let modulesDir = path.resolve(CWD, name, 'node_modules')
    if ('keep' === (await util.dirCheck(modulesDir, { msg: modulesDir + '文件夹已存在，是否需要重新安装依赖？', defaultRemove: false }))) return
    const cmd = `cd ${name} && yarn`
    const spinner = ora(`${name} 依赖安装中`).start()
    let result = await runScript(cmd, {stdio: 'pipe'})
    .then(() => 0).catch(({ stdio }) => {
      return util.logRed(stdio.stderr.toString()), 1
    })
    if (result !== 0) spinner.fail(`${name} 依赖安装失败`)
    else spinner.succeed(`${name} 依赖安装成功`)
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
    if ('keep' === (await util.dirCheck(repoPath, { msg: '%s 已存在，是否删除并从代码仓库重新获取？', defaultRemove: false }))) return
    const spinner = ora(`${hasGit ? '通过 git' : ''} 获取 ${uri}`).start()
    if (hasGit) {
      let result = await runScript(`git clone ${uri} --depth=1`, { stdio: 'pipe' })
      .then(() => 0).catch(({ stdio }) => {
        return util.logRed(stdio.stderr.toString()), 1
      })
      if (result !== 0) spinner.fail(`${name} 获取失败`)
      else spinner.succeed(`${uri} 获取成功`)
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

async function showHowToConfigProject () {
  const configHelpUri = 'https://godspen.ymm56.com/doc/cookbook/source.html'
  util.logGreen(`接下来您需要进行项目配置\n查看配置帮助 ${configHelpUri}`)
  const yes = await util.confirm('是否立即前往？')
  if (yes) await open(configHelpUri)
}

function start () {
  commander
    .arguments('<command>', '拉取代码/启动服务')
    .usage(`<command>\n
    Commands\n
      fetch    拉取代码
      start    启动服务
      build    构建项目
    `)
    .parse(process.argv)

  const op = commander.args[0]
  switch (op) {
    case 'fetch':
      initProject()
      break
    case 'start':
      startServer()
      break
    case 'build':
      buildProject()
      break
    default:
      commander.help()
  }
}

module.exports = start
