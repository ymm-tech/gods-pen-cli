<template>
  <div class="component loading">
    <mt-popup v-model="show" popup-transition="popup-fade" class="loading-popup" ref="loadEntity">
      <mt-spinner color="#fff" type="fading-circle" :size="40"></mt-spinner>
    </mt-popup>
  </div>
</template>
<style lang="stylus" rel="stylesheet/stylus" type="text/stylus">
  .component.loading {
    .loading-popup {
      position: absolute;
      top: 45%;
      left: 50%;
      transform: translate3D(-50%, -50%, 0);
    }

    .mint-popup {
      background: transparent;
    }
  }
</style>

<script type="text/ecmascript-6">
  import Spinner from 'mint-ui/spinner'
  import 'mint-ui/spinner/style.css'
  import Popup from 'mint-ui/popup'
  import 'mint-ui/popup/style.css'

  export default {
    mixins: [],
    components: { MtSpinner: Spinner, MtPopup: Popup },
    name: 'Loading',
    data: function () {
      return {
        show: false
      }
    },
    created: function () {
    },
    methods: {
      open () {
        this.show = true
        const $loadEntity = this.$refs.loadEntity.$el
        if (!$loadEntity) return
        $loadEntity.style.display = 'block'
      },
      hide () {
        this.show = false
        const $loadEntity = this.$refs.loadEntity.$el
        if (!$loadEntity) return
        $loadEntity.style.display = 'none'
      }
    }
  }
</script>
