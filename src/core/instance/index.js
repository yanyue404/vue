import { initMixin } from "./init";
import { stateMixin } from "./state";
import { renderMixin } from "./render";
import { eventsMixin } from "./events";
import { lifecycleMixin } from "./lifecycle";
import { warn } from "../util/index";

function Vue(options) {
  if (process.env.NODE_ENV !== "production" && !(this instanceof Vue)) {
    warn("Vue is a constructor and should be called with the `new` keyword");
  }
  this._init(options);
}

initMixin(Vue); // _init，_uid，$options 当前 Vue 实例的初始化选项，注意：这是经过 mergeOptions() 后的
stateMixin(Vue); // $data, $props 设为只读属性，继续添加 $set, $delete, $watch
eventsMixin(Vue); // $on, $emit, $off, $once
lifecycleMixin(Vue); // _update, $forceUpdate, $destroy
renderMixin(Vue); // installRenderHelpers 函数中的方法，$nextTick，_render

export default Vue;
