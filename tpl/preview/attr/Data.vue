<template>
  <div class="dataEditor">
    <el-input type="textarea" class="input" v-model="inContent"></el-input>
  </div>
</template>
<style lang="stylus" rel="stylesheet/stylus" scoped type="text/stylus">
  .dataEditor {
    height: 300px;
    width: 100%;

    .input {
      height: 100%;
      width: 100%;

      >>>textarea {
        height: 100%;
        width: 100%;
      }
    }
  }
</style>

<script type="text/ecmascript-6">
  /**
   * 数据编辑器，
   * 后续扩展接口访问支持
   */
  export default {
    mixins: [],
    name: 'DataEditor',
    components: {},
    props: {
      content: {
        type: [String, Array, Object]
      },
      /**
       * 支持 空，array，object
       */
      type: {
        type: String
      }
    },
    watch: {
      inContent: function (newVal) {
        if (this.type) {
          try {
            newVal = JSON.parse(newVal)
          } catch (e) {

          }
        }
        this.$emit('update:content', newVal)
        this.$emit('change', newVal)
      }
    },
    data: function () {
      return {
        inContent: ''
      }
    },
    mounted: function () {
      if (this.type) {
        this.inContent = JSON.stringify(this.content, null, 2)
      }
    },
    methods: {
    }
  }
</script>

