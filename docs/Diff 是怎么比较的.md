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

updateChildren 主要作⽤是⽤⼀种较⾼效的⽅式⽐对新旧两个 VNode 的 children 得出最⼩操作补丁。执⾏⼀个双循环是传统⽅式，vue 中针对 web 场景特点做了特别的算法优化.

```js
function updateChildren(parentElm, oldCh, newCh) {
  let oldStartIdx = 0  // 旧第一个下标
  let oldStartVnode = oldCh[0]  // 旧第一个节点
  let oldEndIdx = oldCh.length - 1  // 旧最后下标
  let oldEndVnode = oldCh[oldEndIdx]  // 旧最后节点

  let newStartIdx = 0  // 新第一个下标
  let newStartVnode = newCh[0]  // 新第一个节点
  let newEndIdx = newCh.length - 1  // 新最后下标
  let newEndVnode = newCh[newEndIdx]  // 新最后节点

  let oldKeyToIdx  // 旧节点key和下标的对象集合
  let idxInOld  // 新节点key在旧节点key集合里的下标
  let vnodeToMove  // idxInOld对应的旧节点
  let refElm  // 参考节点

  checkDuplicateKeys(newCh) // 检测newVnode的key是否有重复

  while(oldStartIdx <= oldEndIdx && newStartIdx <= newEndIdx) {  // 开始遍历children

    if (isUndef(oldStartVnode)) {  // 跳过因位移留下的undefined
      oldStartVnode = oldCh[++oldStartIdx]
    } else if (isUndef(oldEndVnode)) {  // 跳过因位移留下的undefine
      oldEndVnode = oldCh[--oldEndIdx]
    }

    else if(sameVnode(oldStartVnode, newStartVnode)) {  // 比对新第一和旧第一节点
      patchVnode(oldStartVnode, newStartVnode)  // 递归调用
      oldStartVnode = oldCh[++oldStartIdx]  // 旧第一节点和下表重新标记后移
      newStartVnode = newCh[++newStartIdx]  // 新第一节点和下表重新标记后移
    }

    else if (sameVnode(oldEndVnode, newEndVnode)) {  // 比对旧最后和新最后节点
      patchVnode(oldEndVnode, newEndVnode)  // 递归调用
      oldEndVnode = oldCh[--oldEndIdx]  // 旧最后节点和下表重新标记前移
      newEndVnode = newCh[--newEndIdx]  // 新最后节点和下表重新标记前移
    }

    else if (sameVnode(oldStartVnode, newEndVnode)) { // 比对旧第一和新最后节点
      patchVnode(oldStartVnode, newEndVnode)  // 递归调用
      nodeOps.insertBefore(parentElm, oldStartVnode.elm, nodeOps.nextSibling(oldEndVnode.elm))
      // 将旧第一节点右移到最后，视图立刻呈现
      oldStartVnode = oldCh[++oldStartIdx]  // 旧开始节点被处理，旧开始节点为第二个
      newEndVnode = newCh[--newEndIdx]  // 新最后节点被处理，新最后节点为倒数第二个
    }

    else if (sameVnode(oldEndVnode, newStartVnode)) { // 比对旧最后和新第一节点
      patchVnode(oldEndVnode, newStartVnode, insertedVnodeQueue)  // 递归调用
      nodeOps.insertBefore(parentElm, oldEndVnode.elm, oldStartVnode.elm)
      // 将旧最后节点左移到最前面，视图立刻呈现
      oldEndVnode = oldCh[--oldEndIdx]  // 旧最后节点被处理，旧最后节点为倒数第二个
      newStartVnode = newCh[++newStartIdx]  // 新第一节点被处理，新第一节点为第二个
    }

    else {  // 不包括以上四种快捷比对方式
      if (isUndef(oldKeyToIdx)) {
        oldKeyToIdx = createKeyToOldIdx(oldCh, oldStartIdx, oldEndIdx)
        // 获取旧开始到结束节点的key和下表集合
      }

      idxInOld = isDef(newStartVnode.key)  // 获取新节点key在旧节点key集合里的下标
          ? oldKeyToIdx[newStartVnode.key]
          : findIdxInOld(newStartVnode, oldCh, oldStartIdx, oldEndIdx)

      if (isUndef(idxInOld)) { // 找不到对应的下标，表示新节点是新增的，需要创建新dom
        createElm(
          newStartVnode,
          insertedVnodeQueue,
          parentElm,
          oldStartVnode.elm,
          false,
          newCh,
          newStartIdx
        )
      }

      else {  // 能找到对应的下标，表示是已有的节点，移动位置即可
        vnodeToMove = oldCh[idxInOld]  // 获取对应已有的旧节点
        patchVnode(vnodeToMove, newStartVnode, insertedVnodeQueue)
        oldCh[idxInOld] = undefined
        nodeOps.insertBefore(parentElm, vnodeToMove.elm, oldStartVnode.elm)
      }

      newStartVnode = newCh[++newStartIdx]  // 新开始下标和节点更新为第二个节点

    }
  }

  ...

}
```

最后的收尾代码：

```js
function updateChildren(parentElm, oldCh, newCh) {
  let oldStartIdx = 0
  ...

  while(oldStartIdx <= oldEndIdx && newStartIdx <= newEndIdx) {
    ...
  }

  if (oldStartIdx > oldEndIdx) {  // 如果旧节点列表先处理完，处理剩余新节点
    refElm = isUndef(newCh[newEndIdx + 1]) ? null : newCh[newEndIdx + 1].elm
    addVnodes(parentElm, refElm, newCh, newStartIdx, newEndIdx, insertedVnodeQueue)  // 添加
  }

  else if (newStartIdx > newEndIdx) {  // 如果新节点列表先处理完，处理剩余旧节点
    removeVnodes(parentElm, oldCh, oldStartIdx, oldEndIdx)  // 删除废弃节点
  }
}

```

函数内首先会定义一堆`let`定义的变量，这些变量是随着`while`循环体而改变当前值的，循环的退出条件为只要新旧节点列表有一个处理完就退出，看着循环体代码挺复杂，其实它只是做了三件事，明白了哪三件事再看循环体，会发现其实并不复杂：

> #### 1\. 跳过 undefined

为什么会有`undefined`，之后的流程图会说明清楚。这里只要记住，如果旧开始节点为`undefined`，就后移一位；如果旧结束节点为`undefined`，就前移一位。

> #### 2\. 快捷查找

首先会尝试四种快速查找的方式，如果不匹配，再做进一步处理：

- 2.1 新开始和旧开始节点比对

如果匹配，表示它们位置都是对的，`Dom`不用改，就将新旧节点开始的下标往后移一位即可。

- 2.2 旧结束和新结束节点比对

如果匹配，也表示它们位置是对的，`Dom`不用改，就将新旧节点结束的下标前移一位即可。

- 2.3 旧开始和新结束节点比对

如果匹配，位置不对需要更新`Dom`视图，将旧开始节点对应的真实`Dom`插入到最后一位，旧开始节点下标后移一位，新结束节点下标前移一位。

- 2.4 旧结束和新开始节点比对

如果匹配，位置不对需要更新`Dom`视图，将旧结束节点对应的真实`Dom`插入到旧开始节点对应真实`Dom`的前面，旧结束节点下标前移一位，新开始节点下标后移一位。

> #### 3\. key 值查找

- 3.1 如果和已有 key 值匹配

那就说明是已有的节点，只是位置不对，那就移动节点位置即可。

- 3.2 如果和已有 key 值不匹配

再已有的`key`值集合内找不到，那就说明是新的节点，那就创建一个对应的真实`Dom`节点，插入到旧开始节点对应的真实`Dom`前面即可。

## 参考

- https://juejin.cn/post/6844903921408802829
