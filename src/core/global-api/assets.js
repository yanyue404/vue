/* @flow */

import { ASSET_TYPES } from 'shared/constants'
import { isPlainObject, validateComponentName } from '../util/index'

export function initAssetRegisters (Vue: GlobalAPI) {
  /**
   * Create asset registration methods.
   */
  ASSET_TYPES.forEach(type => {
    Vue[type] = function (
      id: string,
      definition: Function | Object
    ): Function | Object | void {
      if (!definition) {
        return this.options[type + 's'][id]
      } else {
        /* istanbul ignore if */
        if (process.env.NODE_ENV !== 'production' && type === 'component') {
          validateComponentName(id)
        }
        // component的特殊处理
        if (type === 'component' && isPlainObject(definition)) {
          //指定name
          definition.name = definition.name || id
          //转换组件配置对象为构造函数
          definition = this.options._base.extend(definition)
        }
        if (type === 'directive' && typeof definition === 'function') {
          definition = { bind: definition, update: definition }
        }
        //全局注册：options['components'][id] = Ctor
        //此处注册之后，就可以在全局其他地方使用
        this.options[type + 's'][id] = definition
        return definition
      }
    }
  })
}
