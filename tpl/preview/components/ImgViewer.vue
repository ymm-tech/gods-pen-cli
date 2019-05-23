<template>
  <popup v-model="visible" class="component img-viwer">
    <div :style="style">
      <swipe :continuous="false" :speed="200" :prevent="false" :auto="0" :defaultIndex="defaultIndex" @change="handleChange" class="swpier">
        <swipe-item v-for="(img, index) in imgs" :key="index">
          <fit-img class="fit-img" :src="img"></fit-img>
        </swipe-item>
      </swipe>
    </div>
  </popup>
</template>
<style lang="stylus" rel="stylesheet/stylus" type="text/stylus">
  .component.img-viwer {
    background-color: rgba(0, 0, 0, 0.9);

    .swpier {
      height: 100%;
      width: 100%;
    }

    .fit-img {
      height: 100%;
      width: 100%;
    }

    .mint-swipe-indicator {
      background-color: #333;

      &.is-active {
        background-color: #fff;
      }
    }
  }
</style>

<script type="text/ecmascript-6">
  import FitImg from './FitImg'
  import SwipeItem from 'mint-ui/swipe-item/'
  import 'mint-ui/swipe-item/style.css'
  import Swipe from 'mint-ui/swipe'
  import 'mint-ui/swipe/style.css'
  import Popup from 'mint-ui/popup'
  import 'mint-ui/popup/style.css'

  export default {
    mixins: [],
    name: 'ImgViewer',
    components: { Popup, Swipe, SwipeItem, FitImg },
    data () {
      return {
        visible: false,
        imgs: [],
        style: {},
        defaultIndex: 0
      }
    },
    beforeMount () {
      this.style = {
        height: document.documentElement.clientHeight + 'px',
        width: document.documentElement.clientWidth + 'px',
      }
    },
    methods: {
      handleChange (index) {
        this.$emit('change', index)
      },
      open (imgs, index = 0) {
        if (this.visible) return
        this.imgs = imgs || []
        this.defaultIndex = index
        this.visible = true
      },
      close () {
        this.visible = false
        this.imgs = []
        this.defaultIndex = 0
      }
    }
  }
</script>
