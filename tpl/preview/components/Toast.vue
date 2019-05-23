<template>
  <div class="component toast-box" ref="toast-box"></div>
</template>
<style lang="stylus" rel="stylesheet/stylus" type="text/stylus">
  .component.toast-box .toast {
    position: fixed;
    left: 50%;
    top: 45%;
    width: 80%;
    transform: translate3D(-50%, -50%, 0);
    word-wrap: break-word;
    text-align: center;
    z-index: 1000;

    .toast-item {
      position: relative;
      display: inline-block;
      opacity: 0;
      padding: 8px 16px
      font-size: 14px;
      line-height: 1;
      line-height: 1.5;
      border-radius: 3px;
      background-color: rgba(51, 51, 51, 0.9);
      color: #FFFFFF;
      max-width: 100%;
    }

    .fade-in-out {
      animation: fade-in-out 2.5s linear forwards;
    }

    @keyframes fade-in-out {
      0% {
        opacity: 0;
      }

      25% {
        opacity: 1;
      }

      75% {
        opacity: 1;
      }

      100% {
        opacity: 0;
      }
    }
  }
</style>

<script type="text/ecmascript-6">
  export default {
    mixins: [],
    name: 'Toast',
    data: function () {
      return {
        busyQ: [],
      }
    },
    computed: {
      pending () {
        return this.busyQ.length > 0
      }
    },
    props: {
      compromise: {
        type: Boolean,
        default: false
      }
    },
    mounted: function () {
      this.$nextTick(() => document.body.appendChild(this.$el))
    },
    methods: {
      render ({msg, fn}) {
        var that = this
        var $toastBox = that.$refs['toast-box']
        var $toast = document.createElement('div')
        var $toastItem = document.createElement('div')
        $toast.classList.add('toast')
        $toastItem.classList.add('toast-item')
        $toastItem.innerText = msg
        $toastItem.addEventListener('animationend', onanimationend($toast, fn))
        $toastItem.addEventListener('webkitAnimationend', onanimationend($toast, fn))
        $toast.appendChild($toastItem)
        $toastBox.appendChild($toast)
        $toastItem.classList.add('fade-in-out')
        this.busyQ.push(1)
        /* 部分手机机型没有animationend事件，所以用setTimeout做兼容 */
        setTimeout(onanimationend($toast, fn), 2516)
        function onanimationend ($t, fn) {
          return function () {
            try {
              $toastBox.removeChild($t)
              that.busyQ.pop()
              that.compromise && !that.pending && typeof fn === 'function' && fn()
            } catch (e) { }
          }
        }
      },
    }
  }
</script>
