function loadJs (url = '') {
  if (!url) return
  if (!loadJs.cache) loadJs.cache = {}
  if (loadJs.cache[url]) return Promise.resolve()
  return new Promise((resolve, reject) => {
    _loadjs(
      url,
      () => {
        loadJs.cache[url] = 'cached'
        resolve()
      },
      () => {
        console.error(`${url} 加载失败`)
        reject(new Error(`${url} 加载失败`))
      }
    )
  })

  function _loadjs (url, fn, fail) {
    var script = document.createElement('script')
    script.src = url
    script.async = true
    script.onload = fn
    script.onerror = fail
    ;(document.body || document.head).appendChild(script)
  }
}

var FINGER_PRINT_URL = 'https://cdn.staticfile.org/fingerprintjs2/1.8.0/fingerprint2.min.js'
var STORAGE_KEY = 'YMMFP'

function getFingerPrint () {
  if (!getFingerPrint.promise) {
    getFingerPrint.promise = new Promise((resolve) => {
      var fingerPrint = localStorage.getItem(STORAGE_KEY)
      if (fingerPrint) return resolve(fingerPrint)
      loadJs(FINGER_PRINT_URL).then(() => {
        if (!window.Fingerprint2) resolve('unknown')
        window.Fingerprint2 && new window.Fingerprint2().get((res) => {
          localStorage.setItem(STORAGE_KEY, res)
          resolve(res)
        })
      })
    })
  }
  return getFingerPrint.promise
}

export default {
  loadJs,
  getFingerPrint
}

export {
  loadJs,
  getFingerPrint
}
