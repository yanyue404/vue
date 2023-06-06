# Vue

v2.6.10

## Introduction

Vue (pronounced `/vjuː/`, like view) is a **progressive framework** for building user interfaces.

## build

```bash
# 安装依赖
npm install

# 安装打包工具
npm install rollup -g

# 执⾏打包 (修改examples 引用打包结果 vue.js)
npm run dev
```

## Project Structure

- `scripts`: 包含构建相关的文件，一般情况下我们不需要动
  - `alias.js`: 别名配置
  - `config.js`: 生成 rollup 配置的文件
- `dist`: 构建后文件的输出目录
- `examples`: 存放一些使用 Vue 开发的应用案例
- `flow`: 类型声明，使用开源项目 [Flow](https://flowtype.org/)
- `packages`: 存放独立发布的包的目录
- `test`: 包含所有测试文件
- `src`: 这个是我们最应该关注的目录，包含了源码
  - `compiler`: 编译器代码的存放目录，将 template 编译为 render 函数
  - `core`: 存放通用的，平台无关的代码
    - `observer`: 响应系统，包含数据观测的核心代码
    - `vdom`: 包含虚拟 DOM 创建(creation)和打补丁(patching)的代码
    - `instance`: 包含 Vue 构造函数涉及相关的代码
    - `global-api`: 包含给 Vue 构造函数挂载全局方法(静态方法)或属性的代码
    - `components`: 包含抽象出来的通用组件
  - `server`: 包含服务端渲染(server-side rendering)的相关代码
  - `platforms`: 包含平台特有的相关代码
    - `web/entry-runtime.js`: 运行时版本，不包含模板(template)到 render 函数的编译器，所以不支持 `template` 选项
    - `web/entry-runtime-with-compiler.js`: 独立构建版本的入口，输出 dist/vue.js，它包含模板(template)到 render 函数的编译器 (入口文件)
    - `web/entry-compiler.js`: vue-template-compiler 包的入口文件
    - `runtime/index.js` 编译入口使用的 Vue
  - `sfc`: 包含单文件组件(.vue 文件)的解析逻辑，用于 vue-template-compiler 包
  - `shared`: 包含整个代码库通用的代码

## Documentation

To check out [live examples](https://vuejs.org/v2/examples/) and docs, visit [vuejs.org](https://vuejs.org).

## Contribution

Please make sure to read the [Contributing Guide](https://github.com/vuejs/vue/blob/dev/.github/CONTRIBUTING.md) before making a pull request. If you have a Vue-related project/component/tool, add it with a pull request to [this curated list](https://github.com/vuejs/awesome-vue)!

## Reference link

- [HcySunYang](https://github.com/HcySunYang)
  - [Vue2.1.7 源码学习](http://hcysun.me/2017/03/03/Vue%E6%BA%90%E7%A0%81%E5%AD%A6%E4%B9%A0)
  - [vue-design](https://github.com/HcySunYang/vue-design/tree/elegant)
  - http://caibaojian.com/vue-design/art/
  - https://hcysunyang.github.io/vue-design/zh/
- [抽丝剥茧带你复习 vue 源码（2023 年面试版本）](https://juejin.cn/post/7195517440344211512)
- [浅曦 vue 源码](https://juejin.cn/column/7054724545126596615)
- [processon vue 源码解析流程图](https://www.processon.com/mindmap/64782a1c7fa8dd4359265019)
- [Vue 原理解析 - diff 部分](https://juejin.cn/user/3087084380239341/posts)
  - [Vue 原理解析（八）：一起搞明白令人头疼的 diff 算法](https://juejin.cn/post/6844903921408802829)

## Others

### Questions

For questions and support please use [the official forum](http://forum.vuejs.org) or [community chat](https://chat.vuejs.org/). The issue list of this repo is **exclusively** for bug reports and feature requests.

### Issues

Please make sure to read the [Issue Reporting Checklist](https://github.com/vuejs/vue/blob/dev/.github/CONTRIBUTING.md#issue-reporting-guidelines) before opening an issue. Issues not conforming to the guidelines may be closed immediately.

### Changelog

Detailed changes for each release are documented in the [release notes](https://github.com/vuejs/vue/releases).

## License

[MIT](http://opensource.org/licenses/MIT)

Copyright (c) 2013-present, Yuxi (Evan) You
