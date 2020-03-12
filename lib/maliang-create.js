const process = require('process')
const commander = require('commander')
const path = require('path')
const ejs = require('ejs')
const fs = require('fs-extra')
const package = require('../package.json')
const util = require('./util.js')
const configUtil = require('./maliang-config.js')
const glob = require('glob')

commander
  .arguments('<name>', '项目文件目录')
  .parse(process.argv)

let name = commander.args[0] || 'test'
if (!name) {
  util.logRed('请输入创建项目的文件目录')
  process.exit(1)
}

async function initData () {
  let host
  try {
    host = await configUtil.getConfig('registry')
  } catch (e){}
  host = host.replace(/(https?:\/\/[\w.\-:]+)(.*)$/, (m, p1, p2) => p1 + (p2.replace(/\/$/, '') || '/api'))

  return await util.getTags(host)
}

async function projectDirCheck (projectDir) {
  let status = await util.dirCheck(projectDir)
  switch (status) {
    case 'na': break
    case 'keep': process.exit()
    case 'clear': util.logGreen(`移除 ${projectDir} 成功.`)
  }
}

async function generateProject (projectDir, tpl) {
  let goon = await util.confirm(`准备创建项目,是否继续？`)
  // let goon = 'yes'
  if (!goon) process.exit()
  await fs.copy(tpl, projectDir, {
    filter: function (src) {
      return !/tpl(\\|\/)node_modules/.test(src)
    }
  })
  // util.logGreen('模板获取完毕')
}

async function renderEjs (files, context) {
  for(let tpl of files) {
    await render(tpl)
  }
  util.logGreen('项目初始化完成')
  async function  render(tpl) {
    let content = await ejs.renderFile(tpl, context, {async: true})
    await fs.writeFile(tpl.replace('.ejs', ''), content, 'utf8')
    await fs.remove(tpl)
  }
}

async function pleaseAnswerMe (questions) {
  var answers = {}
  for (let key of Object.keys(questions)) {
    let question = questions[key]
    let answer
    while (
      !(question.pattern || /^.+$/).test(answer = await getAnswer(question))
    ) {
      util.logRed(question.message || `不要包含特殊字符哦${String(question.pattern)}`)
    }
    answers[key] = answer
  }

  async function getAnswer (question) {
    let answer
    switch (question.type) {
      case 'confirm':
        answer = await util.confirm(question.desc, question.default)
        break
      case 'select':
        answer = await util.select(question.desc, question.options, question.default)
          break
      case 'checks':
        answer = await util.checks(question.desc, question.options)
          break
      default:
        answer = (await util.quiz(question.desc, question.default)).trim()
    }
    return answer
  }
  return answers
}

async function start() {
  const CWD = process.cwd()
  const PROJECT_DIR = path.resolve(CWD, name)
  const TPL_DIR = path.resolve(__dirname, '../', 'tpl')
  let tags = []

  await Promise.all([new Promise(async resolve => {
    await projectDirCheck(PROJECT_DIR)
    await generateProject(PROJECT_DIR, TPL_DIR)
    resolve()
  }), initData().then(v => {
    tags = v.map(({id, name}) => ({name: name, value: id}))
  })])

  let questions = {
    'name': {
      desc: '请输入组件名（英文）',
      default: name,
      pattern: /^[A-Za-z_][\w-]+$/
    },
    'label': {
      desc: '请输入组件名（中文, 2-8个字）',
      pattern: /^[^\s\r\n\t]{2,8}$/
    },
    'type': {
      desc: '请选择组件类型',
      type: 'select',
      options: [
        {name: 'web', value: '0'},
        {name: 'flutter', value: 1},
      ],
      default: 0
    },
    'tags': {
      desc: '请选择组件标签',
      type: 'checks',
      options: tags,
      message: '不要偷懒哦'
    }
  }
  let answer = await pleaseAnswerMe(questions)
  answer.description = answer.label // 不再分别设置 description 和 label
  const PROJECT_EJS = glob.sync('**/*.ejs', {cwd: PROJECT_DIR, absolute: true, dot: true})
  await renderEjs(PROJECT_EJS, answer)

  util.logGreen('\n开发')
  util.log(`cd ${name}`)
  util.log('yarn')
  util.log('yarn start')

  util.logGreen('\n发布')
  util.log('gods-pen publish')
}

module.exports = start
