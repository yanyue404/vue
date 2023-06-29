/* @flow */

import {
  warn,
  tip,
  remove,
  isObject,
  parsePath,
  _Set as Set,
  handleError,
  noop
} from '../util/index'

import { traverse } from './traverse'
import { queueWatcher } from './scheduler'
import Dep, { pushTarget, popTarget } from './dep'

import type { SimpleSet } from '../util/index'

let uid = 0

/**
 * A watcher parses an expression, collects dependencies,
 * and fires callback when the expression value changes.
 * This is used for both the $watch() api and directives.
 */
export default class Watcher {
  vm: Component;
  expression: string;
  cb: Function;
  id: number;
  deep: boolean;
  user: boolean;
  lazy: boolean;
  sync: boolean;
  dirty: boolean;
  active: boolean;
  deps: Array<Dep>;
  newDeps: Array<Dep>;
  depIds: SimpleSet;
  newDepIds: SimpleSet;
  before: ?Function;
  getter: Function;
  value: any;

  constructor (
    vm: Component,
    expOrFn: string | Function,
    cb: Function,
    options?: ?Object, // 对应上面的 { before () {...}  } 对象
    isRenderWatcher?: boolean // 是否渲染watcher，首次 $mount
  ) {
    this.vm = vm
    if (isRenderWatcher) {
      // 如果是渲染 watcher 就在该渲染 watcher 挂载到 vm 上
      // 前面的 mountComponent 说过是给子组件中调用 vm.$forceUpdate 时准备的
      vm._watcher = this
    }
    vm._watchers.push(this)
    // options
    if (options) {
      this.deep = !!options.deep
      this.user = !!options.user
      this.lazy = !!options.lazy
      this.sync = !!options.sync
      this.before = options.before
    } else {
      this.deep = this.user = this.lazy = this.sync = false
    }
    this.cb = cb
    this.id = ++uid // uid for batching
    this.active = true
    this.dirty = this.lazy // for lazy watchers
    this.deps = []
    this.newDeps = [] // 新关联起来的 dep
    this.depIds = new Set()
    this.newDepIds = new Set()
    this.expression = process.env.NODE_ENV !== 'production'
      ? expOrFn.toString()
      : ''
    // parse expression for getter
    if (typeof expOrFn === 'function') {
      this.getter = expOrFn
    } else {
      this.getter = parsePath(expOrFn)
      if (!this.getter) {
        this.getter = noop
        process.env.NODE_ENV !== 'production' && warn(
          `Failed watching path: "${expOrFn}" ` +
          'Watcher only accepts simple dot-delimited paths. ' +
          'For full control, use a function instead.',
          vm
        )
      }
    }
    // lazy Watcher 并不会立刻求值，而是返回的是 undefined。
    this.value = this.lazy
      ? undefined
      : this.get()
  }

  /**
   * Evaluate the getter, and re-collect dependencies.
   */
  get () {
    // 打开 Dep.target，Dep.target = this，this 就是 watcher 实例啊
    // 这个地方再下面的收集依赖的时候用
    pushTarget(this)
    let value
    const vm = this.vm
    try {
      //  执行回调函数，比如 updateComponent，进入 patch 阶段
      value = this.getter.call(vm, vm)
    } catch (e) {
      if (this.user) {
        handleError(e, vm, `getter for watcher "${this.expression}"`)
      } else {
        throw e
      }
    } finally {
      // "touch" every property so they are all tracked as
      // dependencies for deep watching
      if (this.deep) {
        traverse(value)
      }
      // 关闭 Dep.target, Dep.target = null
      popTarget()
      this.cleanupDeps()
    }
    return value
  }

  /**
   * Add a dependency to this directive.
   */
  // 两件事：
  // 1. 添加 dep 给自己 watcher
  // 2. 添加自己 (watcher) 到 dep
  addDep (dep: Dep) {
    // 判重，如果 dep 已经存在则不重复添加
    const id = dep.id
    if (!this.newDepIds.has(id)) {
      // 缓存 dep.id 用于判重
      this.newDepIds.add(id)
      this.newDeps.push(dep)
      // 避免在 dep 中重复添加 watcher，
      // this.depIds 的设置在 cleanupDeps 方法中
      if (!this.depIds.has(id)) {
        // 添加 watcher 自己到 dep 中
        dep.addSub(this)
      }
    }
  }

  /**
   * Clean up for dependency collection.
   */
  cleanupDeps () {
    let i = this.deps.length
    while (i--) {
      const dep = this.deps[i]
      if (!this.newDepIds.has(dep.id)) {
        dep.removeSub(this)
      }
    }
    let tmp = this.depIds
    this.depIds = this.newDepIds
    this.newDepIds = tmp
    this.newDepIds.clear()
    tmp = this.deps
    this.deps = this.newDeps
    this.newDeps = tmp
    this.newDeps.length = 0
  }

  /**
   * Subscriber interface.
   * Will be called when a dependency changes.
   */
  update () {
    /* istanbul ignore else */
    // computed 的 lazy watcher
    if (this.lazy) {
      // 将 dirty 置为 true，可以让 computedGetter 执行时重新计算 computed 回调函数的执行结果
      this.dirty = true
    } else if (this.sync) {
      // 同步执行，在使用 vm.$watch 或者 watch 选项时可以传一个 sync 选项，
      // 当为 true 时在数据更新时该 watcher 就不走异步更新队列，直接执行 this.run 
      // 方法进行更新
      // 这个属性在官方文档中没有出现
      this.run()
    } else {
      // 更新时一般都在这里，将 watcher 放入到 watcher 队列,
      // 然后异步更新队列
      queueWatcher(this)
    }
  }

  /**
   * Scheduler job interface.
   * Will be called by the scheduler.
   */
  run () {
    if (this.active) {
      tip('\nwatcher id:' + this.id + '\n表达式：' + this.expression + '\n被调度器执行啦～');
      // 调用 this.get 方法对 watcher 重新求值
      const value = this.get()
      if (
        value !== this.value ||
        // deep wathcer 和 Object/Array 的 watcher 即便是同一个值也要触发重新计算
        // 因为有可能其中的key value 已经发生了变化
        isObject(value) ||
        this.deep
      ) {
        // set new value
        // 缓存旧值为之前的 value
        const oldValue = this.value
        // 更新 value 为最新求得的 value
        this.value = value
        if (this.user) {
          try {
            // 如果是用户 watcher，则执行用户传递的第三个参数——回调函数，
            this.cb.call(this.vm, value, oldValue)
          } catch (e) {
            handleError(e, this.vm, `callback for watcher "${this.expression}"`)
          }
        } else {
          // 更新一个渲染 watcher 时，
          // 也就是说这个 run 方法是由渲染 watcher.run 调用，
          // 其 cb 是调用了 updateComponent 方法
          this.cb.call(this.vm, value, oldValue)
        }
      }
    }
  }

  /**
   * Evaluate the value of the watcher.
   * This only gets called for lazy watchers.
   */
  evaluate () {
    this.value = this.get()
     // 读取完值 dirty（脏）置为 false，dep 再次更新 watcher update 就又变成 dirty true
    this.dirty = false
  }

  /**
   * Depend on all deps collected by this watcher.
   */
  depend () {
    // deps 中保存了计算属性用到的所有 dep 实例，每个属性的 dep 实例中保存了它的所有依赖 
    let i = this.deps.length
    while (i--) {
      this.deps[i].depend()
    }
  }

  /**
   * Remove self from all dependencies' subscriber list.
   */
  teardown () {
    if (this.active) {
      // remove self from vm's watcher list
      // this is a somewhat expensive operation so we skip it
      // if the vm is being destroyed.
      if (!this.vm._isBeingDestroyed) {
        remove(this.vm._watchers, this)
      }
      let i = this.deps.length
      while (i--) {
        this.deps[i].removeSub(this)
      }
      this.active = false
    }
  }
}
