/* global Vue */

// watcher(name: concat, id: 1)
// 渲染 watcher name: render id: 2
// watcher(name: count, id: 3)

// new Wacther(()=> updateComponent(render()) )

// TODO: 每一个dep 收集的watcher是什么样子，每一个桶的变化，如果有组件呢？
// 常见问题：computed watcher 的缓存机制

const vm = new Vue({
  el: "#app",
  data: {
    intro: "这是个例子", // []
    count: 0, //  []
    aaa: 123, // []
  },
  // concat get set  []
  computed: {
    ccc() {
      return this.intro;
    },
    concat() {
      return this.intro + this.count;
    },
  },
  methods: {
    handleClick() {
      this.count++;
    },
  },
});

vm.$watch("count", (newVal) => {
  console.log(newVal);
});
