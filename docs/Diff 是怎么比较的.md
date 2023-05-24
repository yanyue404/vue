- src\platforms\web\runtime\index.js $mount

```js
// 定义组件实例补丁⽅法
Vue.prototype.__patch__ = inBrowser ? patch : noop;

// public mount method
Vue.prototype.$mount = function (
  el?: string | Element,
  hydrating?: boolean
): Component {
  el = el && inBrowser ? query(el) : undefined;
  return mountComponent(this, el, hydrating);
};
```

- src\core/instance/lifecycle.js mountComponent

创建组件更新函数，创建组件 watcher 实例

```js
updateComponent = () => {
   // ⾸先执⾏vm._render() 返回VNode
 // 然后VNode作为参数执⾏update做dom更新
  vm._update(vm._render(), hydrating)
}
updateComponent = () => {

new Watcher(vm, updateComponent, noop, {
  before () {
    if (vm._isMounted && !vm._isDestroyed) {
      callHook(vm, 'beforeUpdate')
    }
  }
}, true /* isRenderWatcher */)
```

- src\core\instance\render.js \_render

- src\core\instance\lifecycle.js \_update

执⾏ patching 算法，初始化或更新 vnode ⾄$el

```js
// based on the rendering backend used.
if (!prevVnode) {
  // initial render
  // 如果没有⽼vnode，说明在初始化
  vm.$el = vm.__patch__(vm.$el, vnode, hydrating, false /* removeOnly */);
} else {
  // updates
  // 更新周期直接diff，返回新的dom
  vm.$el = vm.__patch__(prevVnode, vnode);
}
```

- src\core\vdom\patch.js createPatchFunction

创建浏览器平台特有 patch 函数，主要负责 dom 更新操作

```js
// 扩展操作：把通⽤模块和浏览器中特有模块合并
const modules = platformModules.concat(baseModules);
// ⼯⼚函数：创建浏览器特有的patch函数，这⾥主要解决跨平台问题
export const patch: Function = createPatchFunction({ nodeOps, modules });
```

## patch

那么 patch 如何⼯作的呢？

⾸先说⼀下 patch 的核⼼ diff 算法：通过**同层的树节点进⾏⽐较**⽽⾮对树进⾏逐层搜索遍历的⽅式，所以
时间复杂度只有 O(n)，是⼀种相当⾼效的算法。

同层级只做三件事：增删改。具体规则是：new VNode 不存在就删；old VNode 不存在就增；都存在就
⽐较类型，类型不同直接替换、类型相同执⾏更新；

**patchVnode**

两个 VNode 类型相同，就执⾏更新操作，包括三种类型操作：属性更新 PROPS、⽂本更新 TEXT、⼦节点更新 REORDER

patchVnode 具体规则如下：

1. 如果新旧 VNode 都是静态的，同时它们的 key 相同（代表同⼀节点），并且新的 VNode 是 clone 或者是标记了 v-once，那么只需要替换 elm 以及 componentInstance 即可。

2. 新⽼节点均有 children ⼦节点，则对⼦节点进⾏ diff 操作，调⽤ updateChildren，这个 updateChildren 也是 diff 的核⼼。

3. 如果⽼节点没有⼦节点⽽新节点存在⼦节点，先清空⽼节点 DOM 的⽂本内容，然后为当前 DOM 节点加⼊⼦节点。

4. 当新节点没有⼦节点⽽⽼节点有⼦节点的时候，则移除该 DOM 节点的所有⼦节点。

5. 当新⽼节点都⽆⼦节点的时候，只是⽂本的替换。

**updateChildren**

updateChildren 主要作⽤是⽤⼀种较⾼效的⽅式⽐对新旧两个 VNode 的 children 得出最⼩操作补丁。执⾏⼀个双循环是传统⽅式，vue 中针对 web 场景特点做了特别的算法优化，
