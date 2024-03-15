/* @flow */

import type Watcher from './watcher'
import config from '../config'
import { callHook, activateChildComponent } from '../instance/lifecycle'

import {
  warn,
  nextTick,
  devtools,
  inBrowser,
  isIE
} from '../util/index'

export const MAX_UPDATE_COUNT = 100

const queue: Array<Watcher> = [] // 维护要执行 的  wacher 队列
const activatedChildren: Array<Component> = []
let has: { [key: number]: ?true } = {} // 维护已经收集过的 wacher id
let circular: { [key: number]: number } = {}
let waiting = false // 事件循环放行标志, 保证flushSchedulerQueue回调只允许被置入callbacks一次
let flushing = false // queue 是否在执行
let index = 0

/**
 * Reset the scheduler's state.
 */
function resetSchedulerState () {
  index = queue.length = activatedChildren.length = 0
  has = {}
  if (process.env.NODE_ENV !== 'production') {
    circular = {}
  }
  waiting = flushing = false
}

// Async edge case #6566 requires saving the timestamp when event listeners are
// attached. However, calling performance.now() has a perf overhead especially
// if the page has thousands of event listeners. Instead, we take a timestamp
// every time the scheduler flushes and use that for all event listeners
// attached during that flush.
export let currentFlushTimestamp = 0

// Async edge case fix requires storing an event listener's attach timestamp.
let getNow: () => number = Date.now

// Determine what event timestamp the browser is using. Annoyingly, the
// timestamp can either be hi-res (relative to page load) or low-res
// (relative to UNIX epoch), so in order to compare time we have to use the
// same timestamp type when saving the flush timestamp.
// All IE versions use low-res event timestamps, and have problematic clock
// implementations (#9632)
if (inBrowser && !isIE) {
  const performance = window.performance
  if (
    performance &&
    typeof performance.now === 'function' &&
    getNow() > document.createEvent('Event').timeStamp
  ) {
    // if the event timestamp, although evaluated AFTER the Date.now(), is
    // smaller than it, it means the event is using a hi-res timestamp,
    // and we need to use the hi-res version for event listener timestamps as
    // well.
    getNow = () => performance.now()
  }
}

/**
 * Flush both queues and run the watchers.
 * 清空所有的队列并执行 watchers
 */
function flushSchedulerQueue () {
  currentFlushTimestamp = getNow()
  flushing = true
  let watcher, id

  // 给 queue 里面的 watcher按 id 降序进行排序
  // Sort queue before flush.
  // This ensures that:
  // 1. Components are updated from parent to child. (because parent is always
  //    created before the child)
  // 2. A component's user watchers are run before its render watcher (because
  //    user watchers are created before the render watcher)
  // 3. If a component is destroyed during a parent component's watcher run,
  //    its watchers can be skipped.
  queue.sort((a, b) => a.id - b.id)

  // do not cache length because more watchers might be pushed
  // as we run existing watchers
  for (index = 0; index < queue.length; index++) {
    watcher = queue[index]
    // 如有，创建渲染 watcher 时传递的 before 选项
    if (watcher.before) {
      watcher.before()
    }
    id = watcher.id
    has[id] = null
    // 执行 watcher.run()，最终触发更新函数，
    // 比如渲染 watcher 的 updateComponent
    watcher.run()
    // in dev build, check and stop circular updates.
    if (process.env.NODE_ENV !== 'production' && has[id] != null) {
      circular[id] = (circular[id] || 0) + 1
      if (circular[id] > MAX_UPDATE_COUNT) {
        warn(
          'You may have an infinite update loop ' + (
            watcher.user
              ? `in watcher with expression "${watcher.expression}"`
              : `in a component render function.`
          ),
          watcher.vm
        )
        break
      }
    }
  }

  // keep copies of post queues before resetting state
  // 在重置状态（flushing/wating）前复制保存激活的子列表
  const activatedQueue = activatedChildren.slice()
  const updatedQueue = queue.slice()

  resetSchedulerState()

  // 调用组件的 updated 和 activated 钩子
  callActivatedHooks(activatedQueue)
  callUpdatedHooks(updatedQueue)

  // devtool hook
  /* istanbul ignore if */
  if (devtools && config.devtools) {
    devtools.emit('flush')
  }
}

function callUpdatedHooks (queue) {
  let i = queue.length
  while (i--) {
    const watcher = queue[i]
    const vm = watcher.vm
    if (vm._watcher === watcher && vm._isMounted && !vm._isDestroyed) {
      callHook(vm, 'updated')
    }
  }
}

/**
 * Queue a kept-alive component that was activated during patch.
 * The queue will be processed after the entire tree has been patched.
 */
export function queueActivatedComponent (vm: Component) {
  // setting _inactive to false here so that a render function can
  // rely on checking whether it's in an inactive tree (e.g. router-view)
  vm._inactive = false
  activatedChildren.push(vm)
}

function callActivatedHooks (queue) {
  for (let i = 0; i < queue.length; i++) {
    queue[i]._inactive = true
    activateChildComponent(queue[i], true /* true */)
  }
}

/**
 * Push a watcher into the watcher queue.
 * Jobs with duplicate IDs will be skipped unless it's
 * pushed when the queue is being flushed.
 */
export function queueWatcher (watcher: Watcher) {
  const id = watcher.id
  // 判断重复处理，处理不存在的 watcher
  // 用户 watcher id  小于 渲染 watcher 的 id
  // 当 用户 wacher 执行时候渲染 watcher 已经在 queue，渲染 watcher 不会重复添加
  if (has[id] == null) {
    has[id] = true
    // 如果队列未处于正在执行状态，初始的 flushing 为 false，则将该 watcher 推入队列
    if (!flushing) {
      queue.push(watcher)
    } else {
      // 已经在刷新队列了
      // 从队列末尾开始倒序遍历，根据当前 watcher.id 找到它大于的 watcher.id 的位置，然后将自己插入到该位置之后的下一个位置
      // 即将当前 watcher 放入已排序的队列中，且队列仍是有序的
      let i = queue.length - 1
      while (i > index && queue[i].id > watcher.id) {
        i--
      }
      queue.splice(i + 1, 0, watcher)
    }
    // queue the flush
    // 确保本次事件循环中只会在下一个循环中添加一个 flushSchedulerQueue 任务
    // 下一次 tick 执行完才会清空
    if (!waiting) {
      waiting = true

      if (process.env.NODE_ENV !== 'production' && !config.async) {
        // 直接刷新调度队列
        // 一般不会走这儿，Vue 默认是异步执行，如果改为同步执行，性能会大打折扣
        flushSchedulerQueue()
        return
      }
      // nextTick 就是 Vue.nextTick 或者 this.$nextTick
      // 其主要作用有两点：
      // 1. 生成一个timerFunc，把回调作为microTask或macroTask参与到事件循环中来
      // 2. 通过 pending 控制向浏览器任务队列中添加 flushCallbacks 函数，等待适当的时机执行
      nextTick(flushSchedulerQueue)
    }
  }
}
