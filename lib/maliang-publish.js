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
let GET_TOKEN
let FIND_COMPONENT
let ADD_COMPONENT

async function initConfig () {
  let host
  try {
    host = await configUtil.getConfig('registry')
  } catch (e){}
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
    from = !(await util.confirm(`取得鉴权key【${key}】，是否使用？`)) ? 'input' : 'config'
  }
  if (from == 'input') {
    key = await util.quiz('请输入您的鉴权key(在【码良后台-用户设置-秘钥】页面可获取)')
  }
  key = String(key || '').trim()
  if (from == 'input' || from == 'commander') {
    try {
      await configUtil.setConfig(tokenKey, key)
    } catch (e) {}
  }
  return key
}

async function genComponentJson () {
  let PACKAGE_JSON_PATH = path.resolve(CWD, 'package.json')
  let pkg = await fs.readJson(PACKAGE_JSON_PATH)
  let visibilitylevel
  if (util.isNullOrUndefined(pkg.private)) {
    visibilitylevel = await util.confirm('是否设置该组件为所有人可见')
    pkg.private = !visibilitylevel
    await fs.writeFile(PACKAGE_JSON_PATH, JSON.stringify(pkg, null, 2) , 'utf-8')
  } else {
    visibilitylevel = !pkg.private
  }
  return {
    name: pkg.name,
    type: +pkg.type || 0,
    namespace: pkg.namespace,
    description: pkg.description,
    version: pkg.version,
    visibilitylevel: Number(visibilitylevel)
  }
}

async function ossUpload ({CLI_KEY, COMPONENT_PATH}) {
  var credentials = await request({
    url: GET_TOKEN,
    headers: { clikey: CLI_KEY},
    json: true,
  })
  .then(d => {
    var credentials = d.data
    if (!credentials) {
      throw new Error('获取 oss token 失败')
    }
    return credentials
  })
  .catch(e => {
    util.logRed(e)
    process.exit()
  })

  let mainFile
  ;await (async function () {
    const componentFiles = glob.sync('{dist/**/*.*,README.md,icon.png}', {cwd: CWD, absolute: false})
    for(let file of componentFiles) {
      util.log(`\n上传文件${file}`)
      let filekey = `${COMPONENT_PATH.split(/[/@]/).join('/')}/${file.replace(/^dist[\/]/, '')}`
      var fileurl = `${credentials.host}/${credentials.dir}${filekey}`
      try {
        if (/(index|editor)\.js$/.test(file)) {
          await setPublicPath(path.resolve(CWD, file), `${credentials.host}/${credentials.dir}`)
          if (/index\.js$/.test(file)) mainFile = fileurl
        }
        await upload(filekey, path.resolve(CWD, file), credentials)
      } catch(err) {
        util.logRed(err.message || err)
        process.exit()
      }
      util.log(`上传成功: ${fileurl}`)
    }
  })()
  return mainFile

  async function setPublicPath (filepath, publicpath) {
    let str = await fs.readFile(filepath, 'utf-8')
    str = str.replace(/<OSS_BUCKET>/g, publicpath)
    await fs.writeFile(filepath, str, 'utf-8')
  }

  function upload (name, filepath, {policy, dir, accessid, host, signature}) {
    var options = {
      method: 'POST',
      url: host,
      headers: {
        'cache-control': 'no-cache',
        'Content-Type': 'multipart/form-data'
      },
      formData:{
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

function genComponentName (info) {
  return `${util.normalizeName(info.namespace)}/${util.normalizeName(info.name)}`
}

async function checkComponent ({CLI_KEY, componentJson}) {
  var credentials = await request({
    url: FIND_COMPONENT,
    headers: { clikey: CLI_KEY},
    json: true,
    method: 'POST',
    body: {
      name: genComponentName(componentJson),
      version: componentJson.version
    }
  })
  .then(d => {
    let list = d && d.data && d.data.list || []
    if (list.length > 0) {
      throw new Error(`请核对您的组件版本或者组件命名(package.json 'version'、'name'、'namespace' 字段)，组件库已有记录\n${list.map(com => `${com.name}@${com.version}`).join('\n')}`)
    }
  })
  .catch(e => {
    util.logRed(e.message)
    process.exit()
  })
}

async function addComponent ({CLI_KEY, mainFile, componentJson}) {
  var credentials = await request({
    url: ADD_COMPONENT,
    headers: { clikey: CLI_KEY},
    method: 'POST',
    json: true,
    body: {
      name: genComponentName(componentJson),
      version: componentJson.version,
      desc: componentJson.description,
      type: componentJson.type,
      path: mainFile.replace(/^http:/, 'https:'),
      visibilitylevel: componentJson.visibilitylevel
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

async function start () {
  await initConfig()
  
  let componentJson = await genComponentJson()
  
  util.logGreen('\n组件信息')
  util.log(componentJson)

  let CLI_KEY = await getAccessInfo()
  util.logGreen('\n授权KEY')
  util.log(CLI_KEY)

  await checkComponent({componentJson, CLI_KEY})
  
  if (!skipBuild) {
    util.log('\n')
    try {
      await build()
    } catch (e) {
      console.error(e)
      process.exit()
    }
  }
  
  let COMPONENT_PATH = `${genComponentName(componentJson)}@${componentJson.version}`
  let mainFile = await ossUpload({CLI_KEY, COMPONENT_PATH})
  
  await addComponent({componentJson, mainFile, CLI_KEY})
  util.logGreen('\n发布成功')
  util.logGreen(COMPONENT_PATH)
}
// start()
module.exports = start
