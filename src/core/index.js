// 从 Vue 的出生文件导入 Vue
import Vue from "./instance/index";
import { initGlobalAPI } from "./global-api/index";
import { isServerRendering } from "core/util/env";
import { FunctionalRenderContext } from "core/vdom/create-functional-component";

// 扩展 {... config,set,delete,nextTick,options,use,mixin,extend,component,directive,filter}
initGlobalAPI(Vue);

// 是不是服务端环境
Object.defineProperty(Vue.prototype, "$isServer", {
  get: isServerRendering,
});

Object.defineProperty(Vue.prototype, "$ssrContext", {
  get() {
    /* istanbul ignore next */
    return this.$vnode && this.$vnode.ssrContext;
  },
});

// expose FunctionalRenderContext for ssr runtime helper installation
Object.defineProperty(Vue, "FunctionalRenderContext", {
  value: FunctionalRenderContext,
});

// rollup replace 插件替换版本号
Vue.version = "__VERSION__";

export default Vue;
