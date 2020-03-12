

<template>
  <div class="page" @mousemove="mousemove" @mouseup="mouseup">
    <div>
      <el-menu
        :default-active="sizeIndex"
        class="el-menu-demo"
        mode="horizontal"
        @select="handleSelect"
      >
        <el-submenu index="2">
          <template slot="title">分辨率</template>
          <el-menu-item
            v-for="(item,index) in sizes"
            :key="item.name"
            :index="index"
          >{{item.name}} ({{item.width}}*{{item.height}})</el-menu-item>
        </el-submenu>
      </el-menu>
    </div>
    <div class="content">
      <vue-drag-resize
        class="componentWrap"
        v-on:resizing="resize"
        v-on:dragging="resize"
        :w="componentSize.width"
        :h="componentSize.height"
      >
        <div class="sizeTip">组件显示区域({{componentSize.width}}*{{componentSize.height}})</div>
        <com v-bind="componentProps" ref="component"></com>
      </vue-drag-resize>
      <div class="block editor" :style="editerStyle">
        <div class="title" @click="editerActive=true" @mousedown="mousedown" @mouseup="mouseup">编辑面板</div>
        <div class="node">
          <editor :component-info="componentProps"></editor>
          <attribute v-if="isInit" :component-props="componentProps"></attribute>
        </div>
      </div>
    </div>
    <toast ref="toast" :compromise="true"></toast>
    <loading ref="loading"></loading>
    <img-viewer ref="imgViewer"></img-viewer>
  </div>
</template>

<script>
  import com from '../src/index'
  import Attribute from './components/Attribute'
  import Loading from './components/Loading'
  import example from '../src/example'
  import Editor from '../editor/index'
  import ImgViewer from './components/ImgViewer'
  import Toast from './components/Toast'
  import MessageBox from 'mint-ui/message-box/'
  import 'mint-ui/message-box/style.css'

  export default {
    components: {Toast, Loading, ImgViewer, example, com, Editor, Attribute},
    name: 'p',
    created () {
      // 这里注册了一些全局方法，和渲染器里面的统一的。
      var that = this
      window.msgBox = MessageBox
      window.alert = function (msg, fn) {
        MessageBox.close()
        var m, t
        if (typeof msg === 'object') {
          m = msg.msg
          t = msg.title
        } else {
          m = String(msg)
          t = '提示'
        }
        MessageBox.alert(m, t).then(action => {
          typeof fn === 'function' && fn(action)
        })
      }
      window.confirm = function (msg, fn, re) {
        MessageBox.close()
        var m, t
        if (typeof msg === 'object') {
          m = msg.msg
          t = msg.title
        } else {
          m = String(msg)
          t = '提示'
        }
        MessageBox.confirm(m, t).then(action => {
          typeof fn === 'function' && fn(action)
        }).catch(action => {
          typeof re === 'function' && re(action)
        })
      }
      window.prompt = function (msg, fn, re) {
        MessageBox.close()
        var m, t
        if (typeof msg === 'object') {
          m = msg.msg
          t = msg.title
        } else {
          m = String(msg)
          t = '提示'
        }
        MessageBox.prompt(m, t).then(val => {
          typeof fn === 'function' && fn(val)
        }).catch(action => {
          typeof re === 'function' && re(action)
        })
      }
      window.loading = function (hide) {
        if (!that.$refs['loading']) return
        if (!hide) that.$refs['loading'].open()
        else that.$refs['loading'].hide()
      }
      window.toast = function (msg, fn) {
        if (!that.$refs['toast']) return
        that.$refs['toast'].render({msg, fn})
      }
      window.viewImg = (imgs, index) => {
        if (!that.$refs.imgViewer) return
        that.$refs.imgViewer.open(imgs, index)
      }
    },
    data () {
      return {
        // 开发过程的分辨率选项
        sizes: {
          'Mobile S': {
            name: 'Mobile S',
            width: 320,
            height: 500
          },
          'Mobile M': {
            name: 'Mobile M',
            width: 360,
            height: 600
          },
          'Mobile L': {
            name: 'Mobile L',
            width: 414,
            height: 700
          },
          'Desktop': {
            name: 'Desktop',
            width: 960,
            height: 720
          }
        },
        sizeIndex: 'Mobile S',
        isInit: false, // 是否初始化完成
        editerActive: false, // 编辑面板是否要拖拽了
        componentSize: { // 组件当前的大小
          width: 320,
          height: 480
        },
        editerPanel: {
          x: 600,
          y: 0,
          active: false,
          org: {x: 0, y: 0},
          start: {x: 0, y: 0},
        },

        // 组件开发的时候，配置传入的默认参数，按需修改，这里面的字段一般需要和  src/index.vue 里面的props的key保持一致
        componentProps: {
          reanderType: 'canvas',
          packageType: 'common',
          datasourcekey: '',
          option: {
            title: {
              text: 'ECharts 入门示例'
            },
            tooltip: {},
            legend: {
              data: ['销量']
            },
            xAxis: {
              data: ['衬衫', '羊毛衫', '雪纺衫', '裤子', '高跟鞋', '袜子']
            },
            yAxis: {},
            series: [{
              name: '销量',
              type: 'bar',
              data: [5, 20, 36, 10, 10, 20]
            }]
          }
        },
      }
    },
    computed: {
      editerStyle () {
        return {
          left: this.editerPanel.x + 'px',
          top: this.editerPanel.y + 'px'
        }
      }
    },
    mounted () {
      this.componentSize = this.sizes[this.sizeIndex]
      window.componentVm = this.$refs['component']
      this.isInit = true
    },
    methods: {
      mousedown: function (event) {
        this.editerPanel.org = {
          x: this.editerPanel.x,
          y: this.editerPanel.y
        }
        this.editerPanel.start = {
          x: event.pageX,
          y: event.pageY
        }
        this.active = true
      },
      mousemove: function (event) {
        if (!this.active) {
          return
        }
        this.editerPanel.x = this.editerPanel.org.x + (event.pageX - this.editerPanel.start.x)
        this.editerPanel.y = this.editerPanel.org.y + (event.pageY - this.editerPanel.start.y)
      },
      mouseup () {
        this.active = false
      },
      onActivated (e) {
        console.log(e)
        e.stopPropagation()
        if (e && e.target) {
          // e.target.focus()
        }
      },
      handleSelect (key) {
        this.sizeIndex = key
        this.componentSize = this.sizes[this.sizeIndex]
      },
      resize (newRec) {
        this.componentSize.width = newRec.width
        this.componentSize.height = newRec.height
      },
      getComponent (order) {
        return this.$refs.ones[order - 1]
      }
    }
  }
</script>

<style lang="stylus" rel="stylesheet/stylus" type="text/stylus">
  @require './style.css';

  html, body {
    margin: 0;
    padding: 0;
  }

  .page {
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
    position: absolute;

    .content {
      position: relative;
      flex: 1;

      .componentWrap {
        width: 100%;
        height: 100%;
        left: 0;
        top: 0;
        border: 1px solid red;
        box-shadow: 0px 5px 10px 0px #ccc;
        position: absolute;

        .sizeTip {
          bottom: -26px;
          position: absolute;
          color: #ccc;
          right: 0;
        }

        .node {
          width: 100%;
          height: 100%;
        }
      }

      .editor {
        flex: 1;
        position: absolute;
        width: 300px;
        right: 0;
        box-shadow: 0px 1px 1px 1px #ccc;
        display: flex;
        flex-direction: column;

        &:hover {
          opacity: 1;
        }

        .node {
          flex: 1;
          padding: 10px;
          overflow: auto;
        }
      }
    }

    .title {
      cursor: move;
      border-bottom: 1px solid #ccc;
      box-shadow: 0px -1px 10px 0px #ccc;
      color: #666;
      padding: 10px;
    }

    .block {
      margin: 10px;
      min-height: 200px;
      margin-bottom: 20px;
      background-color: #fff;
    }
  }
</style>


