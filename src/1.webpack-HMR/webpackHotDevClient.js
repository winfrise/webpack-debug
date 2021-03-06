let socket = io('/') // 选通过 socket.io 连接发服务器
let currentHash // 当前的 hash
let lastHash // 上一次的 hash, 官网叫 hotCurrentHash
const onConnected = () => {
  console.log('客户端已经连接')
  // 6. 客户端会监听到些 hash 消息
  socket.on('hash', hash => {
    console.log('hash事件:', hash)
    currentHash = hash
  })
  // 7. 客户端收到 ok 的消息
  socket.on('ok', () => {
    console.log('ok 事件:')
    hotCheck()
  })
  socket.on('disconnect', () => {
    lastHash = currentHash = null
  })
}
// 8. 执行 hotCheck 方法进行更新
function hotCheck() {
  debugger
  if (!lastHash || lastHash === currentHash) {
    return (lastHash = currentHash)
  }
  // 9. 向 server 端发送 Ajax 请求,服务端返回一个 hot-update.json 文件, 该文件包含了所有要更新的模块的 hash 值和 chunk 名
  hotDonwloadManifest().then(update => {
    console.log('update', update)
    let chunkIds = Object.keys(update.c)
    chunkIds.forEach(chunkId => {
      // 10. 通过 JSONP 请求获取到最新的模块代码
      hotDownloadUpdateChunk(chunkId)
    })
  })
}

function hotDownloadUpdateChunk(chunkId) {
  debugger
  var script = document.createElement('script')
  script.charset = 'utf8'
  // script.src = '/' + chunkId + '.' + lastHash + '.hot-update.js' // TODO:hash有问题
  script.src = '/' + 'main' + '.' + 'fullhash' + '.hot-update.js'
  document.head.appendChild(script)
}
function hotDonwloadManifest() {
  debugger
  // var url = '/' + lastHash + '.hot-update.json' // TODO:hash有问题
  var url = '/' + 'main.fullhash' + '.hot-update.json'
  return fetch(url).then(res => res.json()).catch(error => {console.log(error)})
}
// 11. 补丁JS取回来后调用 webpackHotUpdate 方法
window.webpackHotUpdate = (chunkId, moreModules) => {
  for (let moduleId in moreModules) {
    let oldModule = __webpack__require__.c(moduleId) // 获取老模块
    let {parents, children} = oldModule
    var module = (__webpack__require__.c[moduleId] = {
      i:  moduleId,
      exports: {},
      parents,
      children,
      hot: window.hotCreateModule()
    })
    moreModules[moduleId].call(
      module.exports,
      module,
      module.exports,
      __webpack__require__
    )
    moreModules.forEach(parent => {
      let parentModule = __webpack__require__.c[parent]
      parentModule.hot &&
        parentModule.hot._acceptedDepentdencies[moduleId] &&
        parentModule.hot._acceptedDependencies[moduleId]()
    })
    lastHash = currentHash
  }
}
socket.on('connect',  onConnected)
window.hotCreateModule = () => {
  var hot = {
    _acceptedDependencies: {}, // 接收的依赖
    accept: function (dep, callback) {
      for(var i = 0; i < dep.length; i++) {
        hot._acceptedDependencies[dep[i]] = callback 
        // hot._acceptedDependencies['/title'] = callback
      }
    }
  }
  return hot
}