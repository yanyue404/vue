/* @flow */

import config from "../config";
import { initUse } from "./use";
import { initMixin } from "./mixin";
import { initExtend } from "./extend";
import { initAssetRegisters } from "./assets";
import { set, del } from "../observer/index";
import { ASSET_TYPES } from "shared/constants";
import builtInComponents from "../components/index";
import { observe } from "core/observer/index";

import {
  warn,
  extend,
  nextTick,
  mergeOptions,
  defineReactive,
} from "../util/index";

export function initGlobalAPI(Vue: GlobalAPI) {
  const configDef = {};
  configDef.get = () => config;
  if (process.env.NODE_ENV !== "production") {
    configDef.set = () => {
      warn(
        "Do not replace the Vue.config object, set individual fields instead."
      );
    };
  }
  // config 代理的是从 core/config.js 文件导出的对象
  Object.defineProperty(Vue, "config", configDef);

  // exposed util methods.
  // NOTE: these are not considered part of the public API - avoid relying on
  // them unless you are aware of the risk.
  Vue.util = {
    warn,
    extend,
    mergeOptions,
    defineReactive,
  };

  Vue.set = set;
  Vue.delete = del;
  Vue.nextTick = nextTick;

  // 2.6 explicit observable API
  Vue.observable = <T>(obj: T): T => {
    observe(obj);
    return obj;
  };
  {
    /* 初始化 options */
  }
  Vue.options = Object.create(null);
  {/* 初始化 component，directive，filter */}
  ASSET_TYPES.forEach((type) => {
    Vue.options[type + "s"] = Object.create(null);
  });

  // this is used to identify the "base" constructor to extend all plain-object
  // components with in Weex's multi-instance scenarios.
  Vue.options._base = Vue;

  {/* Vue.options.components 混入 KeepAlive
    * Transition 和 TransitionGroup 组件在 runtime/index.js 文件中被添加
    */
  }

  extend(Vue.options.components, builtInComponents);
  {
    /* Vue.use 用来安装 vue 插件 */
  }
  initUse(Vue);
  {
    /* Vue.mixin */
  }
  initMixin(Vue);
  {
    /* Vue.extend */
  }
  initExtend(Vue);
  {
    /* Vue.component 全局注册组件
      Vue.directive 全局注册指令
      Vue.filter 全局注册过滤器*/
  }
  initAssetRegisters(Vue);
}
