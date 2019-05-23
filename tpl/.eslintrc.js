module.exports = {
  parserOptions: {
    sourceType: 'module'
  },
  extends: 'standard',
  plugins: [
    'vue',
    'html'
  ],
  'rules': {
    "no-extra-boolean-cast": 0,
    "no-eval": 0,
    // allow paren-less arrow functions
    'arrow-parens': 0,
    // no-fallthrough
    'no-fallthrough': 0,
    // allow debugger during development
    'no-debugger': process.env.NODE_ENV === 'production' ? 2 : 0,
    "eqeqeq": 0,//必须使用全等
    "no-extend-native": 0,
    "no-multi-spaces":0,
    "indent":0,
    "no-mixed-operators": 0,
    "comma-dangle": [2, "only-multiline"]            //定义数组或对象最后多余的逗号
  }
}
