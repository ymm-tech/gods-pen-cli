<template>
  <div class="component"></div>
</template>

<script>
  import {VueExtend, Util} from 'godspen-lib'
  import {bind} from 'size-sensor'
  export default {
    mixins: [VueExtend.mixin],
    name: 'echarts',
    label: process.env.LABEL,
    style: process.env.STYLE,
    stack: false, // 是否是堆叠模式 ，true：孩子元素会按楼层一个个向下排布， false: 孩子元素绝对定位，随意放置位置
    childLimit: 9999,  // 孩子元素最大限制数
    leaf: false, // 是否是叶子节点，为true的时候该节点下面不能添加节点
    props: { // 设置该元素支持的属性配置
      packageType: {
        type: String,
        default: 'common',
        editor: {
          type: 'enum',  // 该类型支持列表  https://godspen.ymm56.com/doc/develop/script.html#%E6%B7%BB%E5%8A%A0%E8%87%AA%E5%AE%9A%E4%B9%89%E5%B1%9E%E6%80%A7
          label: '资源大小',
          desc: '完全版：体积最大，包含所有的图表和组件，常用版：体积适中，包含常见的图表和组件,精简版：体积较小，仅包含最常用的图表和组件',
          defaultList: {
            'all': '完整版',
            'common': '常用版',
            'simple': '精简版'
          }
        },
      },
      reanderType: {
        type: String,
        default: 'canvas',
        editor: {
          work: function () {
            return this.packageType != 'simple'
          },
          type: 'enum',
          label: '配置信息',
          desc: 'echarts的option配置信息',
          defaultList: { // map结构的选项 key为值，value为显示文本
            'canvas': 'canvas',
            'svg': 'svg'
          }
        },
      },
      usedatasource: {
        type: Boolean, // 此项必须为Boolean
        editor: {
          type: 'checkbox',
          label: '使用数据源',
          desc: '开启后配置数据可以在数据总线里面获取,可以配合数据源组件通过接口获取配置数据'
        }
      },
      datasourcekey: {
        type: String,
        default: 'a.b',
        editor: {
          label: '数据总线Path',
          desc: '',
          work: function () {
            return this.usedatasource
          }
        }
      },
      // 文本框输入
      option: {
        type: [Object],
        editor: {
          type: 'Object',
          label: '配置信息',
          work: function () {
            return !this.usedatasource
          },
          desc: 'echarts的option配置信息,注意这里填入的是JSON数据，而不是js对象'
        },
        default () {
          return {
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
        }
      },
    },
    computed: {
      config () {
        var data = this.option
        if (this.usedatasource) {
          var dataStr = this.dataHubGet && this.dataHubGet(this.datasourcekey)
          try {
            data = JSON.parse(dataStr)
          } catch (e) {
            console.log('error Scroll-Ranking', '获取数据解析json对象异常')
            data = []
          }
        }
        return data
      }
    },
    watch: {
      option: {
        handler (val) {
          this.myChart && this.myChart.setOption(this.config)
        },
        deep: true
      },
      reanderType () {
        this.myChart.dispose()
        this.myChart = window.echarts.init(this.$el, null, {renderer: this.reanderType})
        this.myChart.setOption(this.config)
      },
      packageType (val) {
        if (val == 'simple') {
          this.reanderType = 'canvas'
        }
        this.loadEcharts()
      }
    },
    mounted: async function () {
      // 监听元素大小变化，然后重新渲染，一般如果你的组件的大小不是自动适配的。那么你可以通过如下方法进行重新布局设置
      bind(this.$el, element => {
        this.myChart && this.myChart.resize()
      })
      await this.loadEcharts()
    },
    editorMethods: {
    },
    methods: {
      async loadEcharts () {
        // 纯属演示异步加载js资源，与本组件无关； loadJs返回一个promise实例 可以用async 或者 then 来处理回调
        var names = {
          'all': '',
          'common': 'common.',
          'simple': 'simple.'
        }
        await Util.loadJs(`https://cdn.bootcss.com/echarts/4.6.0/echarts.${names[this.packageType]}min.js`)
        this.myChart = window.echarts.init(this.$el, null, {renderer: this.reanderType})
        // 使用刚指定的配置项和数据显示图表。
        this.myChart.setOption(this.config)
      }
    }
  }
</script>

<style lang="stylus" rel="stylesheet/stylus" type="text/stylus" scoped>
  .component {
    // 为了适配组件在编辑器里面能按拖动大大小适配，建议一个组件的宽高就是 100% 100%。
    // 如果要设置拖动到编辑器里面的初始化样式，请到package.json 的style属性里面添加默认值
    width: 100%;
    height: 100%;
  }
</style>
