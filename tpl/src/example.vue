<template>
  <div class="component truck-text" @click="handleClick">
    <p>{{cText}}</p>
    <p>并顺便加载了个echart</p>
    <p>typeof window.echarts = {{echartType}}</p>
  </div>
</template>

<script>
  /**
   *
   * truck-text
   * @module truck-text
   * @desc 文本框
   * @prop {text} - 显示文本
   * @prop {click} - 点击事件
   *
   */
  import {VueExtend, Util} from 'godspen-lib'
  export default {
    mixins: [VueExtend.mixin],
    name: 'truck-text',
    data () {
      return {
        echartType: undefined
      }
    },
    props: {
      // 文本框输入
      text: {
        type: [String, Number],
        editor: {
          type: 'text',
          label: '文字内容',
          desc: '具体的内容数据'
        },
        default: 'hello 码良'
      },
      // 点击事件
      click: {
        type: Array,
        default: function () {
          return []
        },
        editor: {
          label: '点击事件',
          type: 'function' // 码良编辑器输入类型
        }
      }
    },
    computed: {
      cText () {
        // 入参prop `text`
        // 利用计算属性，接入【模板字符串】解析能力
        // 如 `我的名字叫${info.name} 我的编号是${$scope.no}`
        return this.scopeGet('text')
      }
    },
    /**
    * 编辑器配置面板内的自定义方法
    */
    editorMethods: {
      jump: {
        label: '网页跳转',
        params: [{
          label: '跳转地址',
          desc: '参数详细说明：跳转路径 可以是 https 和 ymm 等协议开头的任意链接',
          type: 'string',
          default: 'https://www.baidu.com'
        }]
      }
    },
    mounted: async function () {
      this.echartType = typeof window.echarts
      // 纯属演示异步加载js资源，与本组件无关； loadJs返回一个promise实例 可以用async 或者 then 来处理回调
      await Util.loadJs('https://cdn.bootcss.com/echarts/4.0.3/echarts.min.js')
      this.echartType = typeof window.echarts
      // debugger
      // echarts 可用
      // window.echarts.init({})
    },
    methods: {
      handleClick (ev) {
        // 入参prop`click` 可能为数组且含实参，所以不能直接来执行，oncallExecute可以帮助执行
        this.oncallExecute(this.click, [ev])
      },
      // 对应于editorMethods内的jump配置
      jump: function (url) {
        window.location.href = url
      },
    }
  }
</script>

<style lang="stylus" rel="stylesheet/stylus" type="text/stylus" scoped>
  // 组件实际渲染时，其外部包裹有一个node组件，用来设置组件的位置大小等
  // 因node大小可在编辑器内调整，这里设置宽高为100%来适应此调整
  // 可在`package.json`设置`style`字段提供node初始大小，但不限于初始大小，也可指定其他样式。
  // 如无调整大小的需求，组件宽高可自行设置(需注意，尺寸基于屏幕宽度320px)
  .truck-text {
    width: 100%;
    height: 100%;
    font-size: 20px;
    text-align: center;
  }
</style>
