let Vue;

class Store {
  constructor({ state = {}, mutations = {}, actions = {} }) {
    this._mutations = mutations;
    this._actions = actions;
    this._vm = new Vue({
      data: {
        $$state: state,
      },
    });
  }

  state() {
    return this._vm.state;
  }

  commit(type, payload, _options) {
    const entry = this._mutations[type];
    entry.forEach(function commitIterator(handler) {
      handler(payload);
    });
  }

  dispatch(type, payload) {
    const entry = this._actions[type];

    return entry.length > 1
      ? Promise.all(entry.map((handler) => handler(payload)))
      : entry[0](payload);
  }
}

function vuexInit() {
  const options = this.$options;
  if (options.store) {
    this.$store = options.store;
  } else {
    this.$store = options.parent.$store;
  }
}

function install(_Vue) {
  Vue = _Vue;
  Vue.mixin({ beforeCreate: vuexInit });
}

export default {
  Store,
  install,
};
