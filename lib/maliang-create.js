const process = require('process')
const commander = require('commander')
const path = require('path')
const ejs = require('ejs')
const fs = require('fs-extra')
const package = require('../package.json')
const util = require('./util.js')
const glob = require('glob')

commander
  .arguments('<name>', '项目文件目录')
  .parse(process.argv)

let name = commander.args[0] || 'test'
if (!name) {
  util.logRed('请输入创建项目的文件目录')
  process.exit(1)
}

async function projectDirCheck (projectDir) {
  let exist = await fs.pathExists(projectDir)
  if (!exist) return
  let shouldDelete = await util.confirm(`${projectDir} 已存在,确定要覆盖它么?`)
  if (!shouldDelete) process.exit()
  await fs.remove(projectDir)
  return util.logGreen(`移除 ${projectDir} 成功.`)
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
      !(question.pattern || /^.+$/).test(answer = (
        question.type !== 'confirm' ? (await util.quiz(question.desc, question.default)).trim() : 
        await util.confirm(question.desc, question.default)
      ))
    ) {
      util.logRed(`不要包含特殊字符哦${String(question.pattern)}`)
    }
    answers[key] = answer
  }
  return answers
}

async function start() {
  const CWD = process.cwd()
  const PROJECT_DIR = path.resolve(CWD, name)
  const TPL_DIR = path.resolve(__dirname, '../', 'tpl')

  await projectDirCheck(PROJECT_DIR)
  await generateProject(PROJECT_DIR, TPL_DIR)

  let questions = {
    'name': {
      desc: '请输入组件名（英文）',
      default: name,
      pattern: /^[A-Za-z_][\w-]+$/
    },
    'namespace': {
      desc: '请输入组件命名空间（比如你的常用id，简短点哦）',
      pattern: /^[A-Za-z_][\w-]+$/
    },
    'description': {
      desc: '请输入功能描述',
      default: 'hello world'
    },
    'useEditor': {
      desc: '是否创建属性配置组件？默认为否',
      type: 'confirm',
      default: false
    },
  }
  let answer = await pleaseAnswerMe(questions)
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
