const util = require('./util')
const request = require('request-promise')
const build = require('./maliang-build')
const commander = require('commander')
const fs = require('fs-extra')
const path = require('path')
const glob = require('glob')
const configUtil = require('./maliang-config.js')

commander
  .option('-t, --token [token]', '指定鉴权token')
  .option('--skip-build', '跳过构建')
  .parse(process.argv)

let skipBuild = commander['skipBuild']
let token = commander['token']


// const CWD = '/Users/arnan/Documents/code/ml-tpl'
const CWD = process.cwd()
let GET_TOKEN, CLI_KEY
let FIND_COMPONENT
let ADD_COMPONENT

async function initConfig() {
  let host
  try {
    host = await configUtil.getConfig('registry')
  } catch (e) {}
  host = host.replace(/(https?:\/\/[\w.\-:]+)(.*)$/, (m, p1, p2) => p1 + (p2.replace(/\/$/, '') || '/api'))
  GET_TOKEN = `${host}/upload/getTocken`
  FIND_COMPONENT = `${host}/component/find`
  ADD_COMPONENT = `${host}/component/add`
}

async function getAccessInfo() {
  let key = ''
  let tokenKey = 'token'
  let from = 'input'

  util.log('\n')
  if (token) {
    key = token
    from = 'commander'
  } else {
    try {
      key = await configUtil.getConfig(tokenKey)
      if (key) from = 'config'
    } catch (e) {}
  }
  if (from == 'config') {
    from = !(await util.confirm(`取得码良用户鉴权token【${key}】，是否使用？`)) ? 'input' : 'config'
  }
  if (from == 'input') {
    key = await util.quiz('请输入您的码良用户鉴权token (在【码良后台-用户设置-秘钥】页面可获取)')
  }
  key = String(key || '').trim()
  if (from == 'input' || from == 'commander') {
    try {
      await configUtil.setConfig(tokenKey, key)
    } catch (e) {}
  }
  CLI_KEY = key
  return key
}

async function genComponentJson(ns) {
  let PACKAGE_JSON_PATH = path.resolve(CWD, 'package.json')
  let pkg = await fs.readJson(PACKAGE_JSON_PATH)
  let visibilitylevel
  if (util.isNullOrUndefined(pkg.private)) {
    visibilitylevel = await util.confirm('是否设置该组件为所有人可见')
    pkg.private = !visibilitylevel
    await fs.writeFile(PACKAGE_JSON_PATH, JSON.stringify(pkg, null, 2), 'utf-8')
  } else {
    visibilitylevel = !pkg.private
  }
  return {
    namespace: util.normalizeName(ns),
    name: util.normalizeName(pkg.name),
    type: +pkg.type || 0,
    description: pkg.description,
    version: pkg.version,
    visibilitylevel: Number(visibilitylevel),
    tags: (pkg.tags || []).filter(t => !isNaN(t)).map(t => ({
      id: t
    })),
    built: pkg.built
  }
}

async function ossUpload({
  credentials,
  COMPONENT_PATH,
  package
} = {}) {
  let mainFile;
  await (async function () {
    const componentFiles = glob.sync('{dist/**/*.*,README.md,icon.png,cover.png,changelog.md}', {
      cwd: CWD,
      absolute: false
    })
    for (let file of componentFiles) {
      if (/\.tmp$/.test(file)) continue
      util.log(`\n上传文件${file}`)
      let filekey = `${COMPONENT_PATH.split(/[/@]/).join('/')}/${file.replace(/^dist[\/]/, '')}`
      var fileurl = `${credentials.host}/${credentials.dir}${filekey}`
      try {
        if (/(index|editor)\.js$/.test(file)) {
          if (/index\.js$/.test(file)) mainFile = fileurl
          file = await setConstVar(path.resolve(CWD, file), {
            namespace: package.namespace,
            publicpath: `${credentials.host}/${credentials.dir}`,
            version: package.version,
            name: package.name
          })
        }
        await upload(filekey, path.resolve(CWD, file), credentials)
      } catch (err) {
        util.logRed(err.message || err)
        process.exit()
      }
      util.log(`上传成功: ${fileurl}`)
    }
  })()
  return mainFile

  async function setConstVar(filepath, {
    publicpath,
    namespace,
    name,
    version
  }) {
    let str = await fs.readFile(filepath, 'utf-8')
    str = str.replace(/__OSS_BUCKET__/g, publicpath)
    str = str.replace(/__NAMESPACE__/g, namespace)
    str = str.replace(/__NAME__/g, name)
    str = str.replace(/__VERSION__/g, version)
    const tmp = filepath + '.tmp'
    await fs.writeFile(tmp, str, 'utf-8')
    return tmp
  }

  function upload(name, filepath, {
    policy,
    dir,
    accessid,
    host,
    signature
  }) {
    var options = {
      method: 'POST',
      url: host,
      headers: {
        'cache-control': 'no-cache',
        'Content-Type': 'multipart/form-data'
      },
      formData: {
        name,
        key: dir + name,
        policy,
        OSSAccessKeyId: accessid,
        success_action_status: '200',
        signature,
        file: {
          value: fs.createReadStream(filepath),
          options: {
            filename: name,
          }
        }
      }
    }
    return request(options)
  }
}


async function checkComponent({
  name,
  namespace,
  version
}) {
  await request({
      url: FIND_COMPONENT,
      headers: {
        clikey: CLI_KEY
      },
      json: true,
      method: 'POST',
      body: {
        name: `${namespace}/${name}`,
        version
      }
    })
    .then(d => {
      let list = d && d.data && d.data.list || []
      if (list.length > 0) {
        throw new Error(`请核对您的组件版本或者组件命名(package.json 'version'、'name'字段)，组件库已有记录\n${list.map(com => `${com.name}@${com.version}`).join('\n')}`)
      }
    })
    .catch(e => {
      util.logRed(e.message)
      process.exit()
    })
}

async function addComponent(mainFile, package) {
  await request({
      url: ADD_COMPONENT,
      headers: {
        clikey: CLI_KEY
      },
      method: 'POST',
      json: true,
      body: {
        name: `${package.namespace}/${package.name}`,
        version: package.version,
        desc: package.description,
        type: package.type,
        tags: package.tags,
        path: mainFile.replace(/^http:/, 'https:'),
        visibilitylevel: package.visibilitylevel
      }
    })
    .then(d => {
      if (!d || d.code != 1) {
        throw new Error(d && d.msg || '添加组件失败')
      }
    })
    .catch(e => {
      util.logRed(e.message || e)
      process.exit()
    })
}

async function getCredentials() {
  var credentials = await request({
      url: GET_TOKEN,
      headers: {
        clikey: CLI_KEY
      },
      json: true,
    })
    .then((d = {}) => {
      var credentials = d.data
      if (!credentials) {
        throw new Error(d.msg || '获取 oss token 失败')
      }
      return credentials
    })
    .catch(e => {
      util.logRed(e)
      process.exit()
    })
  return credentials
}

async function start() {
  await initConfig()

  await getAccessInfo()

  util.logGreen('\n授权KEY')
  util.log(CLI_KEY)

  const credentials = await getCredentials()

  util.log(credentials)

  const package = await genComponentJson(credentials.ns)

  util.logGreen('\n组件信息')
  util.log(package)

  await checkComponent(package)

  if (!(skipBuild || package.built)) {
    util.log('\n')
    try {
      await build()
    } catch (e) {
      console.error(e)
      process.exit()
    }
  }

  let COMPONENT_PATH = `${package.namespace}/${package.name}@${package.version}`
  let mainFile = await ossUpload({
    credentials,
    COMPONENT_PATH,
    package
  })

  await addComponent(mainFile, package)
  util.logGreen('\n发布成功')
  util.logGreen(COMPONENT_PATH)
}
// start()
module.exports = start