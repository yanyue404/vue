import attrs from './attrs'
import klass from './class'
import events from './events'
import domProps from './dom-props'
import style from './style'
import transition from './transition'

// 平台特有的一些操作，比如：attr、class、style、event 等，还有核心的 directive 和 ref
// 它们会向外暴露一些特有的方法，比如：create、activate、update、remove、destroy
// 这些方法在 patch 阶段时会被调用，从而做相应的操作，比如 创建 attr、指令等

export default [
  attrs,
  klass,
  events,
  domProps,
  style,
  transition
]
