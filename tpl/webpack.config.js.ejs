const path = require('path')
const webpack = require('webpack')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const merge = require('webpack-merge')
let pkg = require('./package.json')

function getIPAdress () {
  var interfaces = require('os').networkInterfaces()
  for (var devName in interfaces) {
    var iface = interfaces[ devName ]
    for (var i = 0; i < iface.length; i++) {
      var alias = iface[ i ]
      if (alias.family === 'IPv4' && alias.address !== '127.0.0.1' && !alias.internal) {
        return alias.address
      }
    }
  }
}

function normalizeName (name) {
  return name.replace(/[-_]+(\w)/g, (m, p) => p.toUpperCase())
}

const COMPONENT_PATH = '__NAMESPACE__/__NAME__@__VERSION__'

let config = {
  module: {
    rules: [
      {
        test: /\.(js|vue)$/,
        loader: 'eslint-loader',
        enforce: 'pre',
        include: [path.resolve(__dirname, 'src'), path.resolve(__dirname, './preview')],
        exclude: [path.resolve(__dirname, './preview/mint-ui/')],
        options: {
          formatter: require('eslint-friendly-formatter'),
          emitWarning: false
        }
      },
      {
        test: /\.css$/,
        use: [
          'vue-style-loader',
          'css-loader',
          'postcss-loader'
        ],
      },
      {
        test: /\.less$/,
        use: [
          'vue-style-loader',
          'css-loader',
          'less-loader'
        ]
      },
      {
        test: /\.styl(us)?$/,
        use: [
          'vue-style-loader',
          'css-loader',
          'stylus-loader'
        ]
      },
      {
        test: /\.vue$/,
        loader: 'vue-loader',
        options: {
          transformToRequire: {
            video: ['src', 'poster'],
            source: 'src',
            audio: 'src',
            img: 'src',
            image: 'xlink:href'
          },
          loaders: {
          }
        }
      },
      {
        test: /\.js$/,
        loader: 'babel-loader',
        exclude: /node_modules/
      },
      {
        test: /\.(png|jpe?g|gif|svg)(\?.*)?$/,
        loader: 'url-loader',
        options: {
          limit: 1,
          name: '[name].[hash:7].[ext]'
        }
      },
      {
        test: /\.(mp4|webm|ogg|mp3|wav|flac|aac)(\?.*)?$/,
        loader: 'url-loader',
        options: {
          limit: 1,
          name: '[name].[hash:7].[ext]'
        }
      },
      {
        test: /\.(woff2?|eot|ttf|otf)(\?.*)?$/,
        loader: 'url-loader',
        options: {
          limit: 1,
          name: '[name].[hash:7].[ext]'
        }
      }
    ]
  },
  resolve: {
    extensions: ['*', '.js', '.vue', '.json']
  },
  externals: {
    'godspen-lib': "$GP"
  },
  performance: {
    hints: false
  },
  devtool: '#hidden-source-map',
  plugins: [
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: JSON.stringify(process.env.NODE_ENV),
        LABEL: JSON.stringify(pkg.label),
        STYLE: JSON.stringify(pkg.style)
      }
    })
  ]
}

if (process.env.NODE_ENV === 'development') {
  module.exports = merge(config, {
    entry: './preview/index.js',
    output: {
      path: path.resolve(__dirname, './dist'),
      publicPath: '/',
      filename: 'app.js'
    },
    resolve: {
      alias: {
        'vue$': 'vue/dist/vue.esm.js',
        'mint-ui': path.resolve(__dirname, './preview/mint-ui/')
      },
    },
    devServer: {
      clientLogLevel: 'warning',
      historyApiFallback: true,
      hot: true,
      host: getIPAdress(),
      open: false,
      overlay: false,
      publicPath: '/',
    },
    plugins: [
      new webpack.HotModuleReplacementPlugin(),
      new webpack.NamedModulesPlugin(),
      new webpack.NoEmitOnErrorsPlugin(),
      new HtmlWebpackPlugin({
        filename: 'index.html',
        template: '!!ejs-loader!./preview/index.tpl',
        inject: true
      })
    ]
  })
}

if (process.env.NODE_ENV === 'production') {
  module.exports = merge(config, {
    entry: {
      index: './src/index.vue',
      editor: './editor/index.vue'
    },
    output: {
      path: path.resolve(__dirname, './dist'),
      publicPath: `__OSS_BUCKET__${COMPONENT_PATH.replace('@', '/')}/`, // __OSS_BUCKET__占位符请勿修改，文件上传时会自动替换
      library: COMPONENT_PATH + '[name]',
      libraryTarget: 'umd',
      filename: '[name].js'
    },
    devtool: '#hidden-source-map',
    plugins: [
      new webpack.optimize.UglifyJsPlugin({
        sourceMap: true,
        compress: {
          warnings: false
        }
      }),
      new webpack.LoaderOptionsPlugin({
        minimize: true
      })
    ]
  })
}
