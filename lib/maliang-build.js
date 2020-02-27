const path = require('path')
const fs = require('fs-extra')
const glob = require('glob')
const archiver = require('archiver')
const request = require('request-promise')
const { promisify } = require('util')
const imageSize = promisify(require('image-size'))
const open = require('open')
const util = require('./util')
const configUtil = require('./maliang-config.js')

const SHOP_TOKEN_PAGE = 'https://godspen.ymm56.com/shop/#/accountSetting'
const RESOURCE_DETAIL = 'https://godspen.ymm56.com/shop/index.html#/resources?id='
const SHOP_USER_INFO = 'https://godspen.ymm56.com/shop/api/users/info'
const SHOP_COMPONENT_ADD = 'https://godspen.ymm56.com/shop/api/component/addOne'
const OSS_GET_TOKEN = 'https://godspen.ymm56.com/shop/api/upload/getTocken'

const CWD = process.cwd()
const resolve = (...file) => path.resolve(process.cwd(), ...file)
const debug = process.argv.includes('--verbose') ? console.log : () => {}

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

async function getAccessInfo(tokenFromArg) {
  let key = ''
  let tokenKey = 'shop-token'
  let from = 'input'
  
  util.log('\n')
  if (tokenFromArg) {
    key = tokenFromArg
    from = 'commander'
  } else {
    try {
      key = await configUtil.getConfig(tokenKey)
      if (key) from = 'config'
    } catch (e) {}
  }
  if (from == 'config') {
    from = !(await util.confirm(`从本地取得商城用户鉴权token【${key}】，是否使用？`)) ? 'input' : 'config'
  }
  if (from == 'input') {
    key = await util.quiz(`请输入您的商城用户鉴权token(在【码良资源商城-用户设置-秘钥】页面可获取.  ${SHOP_TOKEN_PAGE} )\n`)
  }
  key = String(key || '').trim()
  if (from == 'input' || from == 'commander') {
    try {
      await configUtil.setConfig(tokenKey, key)
    } catch (e) {}
  }
  return key
}

async function getUserInfo (token) {
  return await request({
    method: 'get',
    url: SHOP_USER_INFO,
    headers: {
      clikey: token,
    },
    json: true
  }).then(({code, data} = {}) => {
    if (code === 1) return data
    else throw new Error(`获取用户信息失败 ${code}`)
  }).catch(e => {
    console.error(e && e.message)
    process.exit()
  })
}

async function doPack (currentUser = {}) {
  const ICON = resolve('icon.png')
  const COVER = resolve('cover.png')
  const README = resolve('README.md')
  const CHANGELOG = resolve('changelog.md')
  const DIST = resolve('dist/')
  const OUTPUT = resolve(`${pkg.name}.zip`)

  if (!(await fileExist(ICON))) return (util.logRed('未在项目根目录下获取到组件图标 icon.png'), process.exit())
  if (!(await fileExist(COVER))) return (util.logRed('未在项目根目录下获取到组件封面 cover.png'), process.exit())
  if (!(await fileExist(README))) return (util.logRed('未在项目根目录下获取到组件说明文件 README.md'), process.exit())
  if (!(await fileExist(CHANGELOG))) return (util.logRed('未在项目根目录下获取到组件变更记录 changelog.md'), process.exit())
  if (!(await fileExist(DIST))) return (util.logRed('未获取到组件输出目录 dist/, 请 移除 "--skip-build" 选项后再次打包'), process.exit())

  const coverSize = await imageSize(COVER)
  const iconSize = await imageSize(ICON)
  if (iconSize.width !== 200 || iconSize.height !== 200) return (util.logRed(`组件图标 icon.png 尺寸 ${iconSize.width}x${iconSize.height} 不符合要求，应该为 200x200`), process.exit())
  if (coverSize.width < 200 || coverSize.width!=coverSize.height || coverSize.width>800) return (util.logRed(`组件图标 cover.png 尺寸 ${iconSize.width}x${iconSize.height} 不符合要求，推荐400*400`), process.exit())

  const manifest = (() => {
    const {private = true, name = 'unknow', type = 0, label = '', description = '', version = '0.0.1', tags = []} = pkg
    const jss = glob.sync(resolve('dist/*.js'))
    const size = jss.reduce((o, f) => {
      o += fs.statSync(f).size
      return o
    }, 0)
    return { name: `${currentUser.name}_${name}`,label , type, description, version, private, tags, size, built: true}
  })()

  const readme = fs.readFileSync(README, 'utf8')
  const changelog = fs.readFileSync(CHANGELOG, 'utf8')

  const output = fs.createWriteStream(OUTPUT)
  const archive = archiver('zip', {
    zlib: { level: 9 }
  })

  const status = new Promise((resolve, reject) => {
    output.on('close', () => (console.log('打包完成', `${pkg.name}.zip`, archive.pointer() + ' bytes'), resolve(Object.assign({}, manifest, {readme, changelog, zip: OUTPUT}))))
    archive.on('warning', err => err.code !== 'ENOENT' ? reject(err) : console.error(err))
    archive.on('error', err => reject(err))
  })

  archive.pipe(output)
  archive.append(JSON.stringify(manifest, null, 2), { name: 'package.json' })
  archive.file(ICON, { name: 'icon.png' })
  archive.file(COVER, { name: 'cover.png' })
  archive.file(README, { name: 'README.md' })
  archive.file(CHANGELOG, { name: 'changelog.md' })
  archive.file(path.resolve(__dirname, 'install.js.tpl'), { name: 'install.js' })
  archive.glob('dist/**/*.!(tmp|map|js.tmp|js.map)', {cwd: CWD, absolute: false}, 'dist')

  archive.finalize()
  return await status
}

async function doPush (currentUser = {}, manifest = {}, token = '') {
  const credential = await getCredentials(token)
  debug('credential', credential)
  const zipUrl = await ossUpload(`godspenshop/${Math.random().toString(32).slice(2, 8)}_${Date.now()}.zip`, manifest.zip, credential)
  debug('zipUrl', zipUrl)
  if (!zipUrl) throw new Error('资源上传失败')
  debug('manifest.description', manifest.description)
  return await request({
    'method': 'POST',
    'url': SHOP_COMPONENT_ADD,
    'headers': {
      'clikey': token,
      'Content-Type': 'application/json'
    },
    body: {
      name: manifest.description,
      content: zipUrl,
      desc: manifest.readme,
      version: manifest.version,
      changelog: manifest.changelog,
      componentkey: `${currentUser.name}/${manifest.name}`,
      size: manifest.size
    },
    json: true
  }).then(({code, msg, data} = {}) => {
    if (code !== 1) {
      util.logRed(msg || '资源发布失败')
      process.exit()
    }
    data.resourceId = data.resourceId || data.id // hack
    debug('pushresult', data)
    return data
  })
}

function openResourceDetail (id) {
  const page = `${RESOURCE_DETAIL}${id}`
  return open(page)
}

async function getCredentials (token) {
  var credentials = await request({
    url: OSS_GET_TOKEN,
    headers: { clikey: token},
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
  return credentials
}

function ossUpload (name, filepath, {policy, dir, accessid, host, signature}) {
  const url = `${host}/${dir}${name}`
  const options = {
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
  return request(options).then(v => url)
}

async function start ({pack = false, build = true, push = true, token} = {}) {
  await pkgImport()
  if (build) {
    util.logGreen('构建中...')
    await executeCmd()
    util.logGreen('构建完成')
  }
  if (pack) {
    const TOKEN = await getAccessInfo(token)
    debug('TOKEN', TOKEN)
    const userInfo = await getUserInfo(TOKEN)
    debug('userInfo', userInfo)
    const manifest = await doPack(userInfo)
    debug('manifest', manifest)
    if (push) {
      const {resourceId} = await doPush(userInfo, manifest, TOKEN)
      debug('resourceId', resourceId)
      const ok = await util.confirm('资源发布成功，是否需要跳转至详情页面查看')
      if (ok) openResourceDetail(resourceId)
    }
  }
}

module.exports = start
