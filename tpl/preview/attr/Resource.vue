<template>
  <div class="resourceEditor">
    <el-input placeholder="选择资源" size="mini" v-model="inUrl">
      <el-button slot="append" icon="el-icon-upload" @click="selectImage">选择</el-button>
      <el-button size="mini" slot="append" icon="el-icon-picture" @click="cropper">裁剪</el-button>
    </el-input>
    <div class="preview">
      <div class="in" :style="previewBg"></div>
    </div>
  </div>
</template>
<style lang="stylus" rel="stylesheet/stylus" scoped type="text/stylus">
  .resourceEditor {
    padding: 0 10px;

    .preview {
      width: 100%;
      height: 150px;
      margin-top: 10px;
      background-color: #dddddd;

      // background-image: url('../../assets/image/bgblank.svg');
      .in {
        width: 100%;
        height: 100%;
        background-size: contain;
        background-repeat: no-repeat;
        background-position: center;
      }
    }
  }
</style>

<script type="text/ecmascript-6">
  export default {
    name: 'ResourceEditor',
    components: {},
    props: {
      url: {
        type: String
      },
      type: {
        type: String,
        default: 'image'
      }
    },
    watch: {
      url: function (newVal, oldVal) {
        this.inUrl = newVal
      },
      inUrl: function (newVal) {
        this.$emit('update:url', newVal)
      }
    },
    data: function () {
      return {
        inUrl: this.url
      }
    },
    computed: {
      previewBg () {
        return {
          'background-image': `url(${this.inUrl})`
        }
      }
    },
    mounted: function () {
    },
    methods: {
      selectImage: function () {
        this.$message('编辑器模式下不能使用')
      },
      cropper: function () {
        // this.crop = true
        this.$message('编辑器模式下不能裁剪')
      }
    }
  }
</script>

