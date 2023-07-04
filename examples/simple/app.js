/* global Vue */

// watcher(name: bbb, id: 1)
// watcher(name: count, id: 2)
// 渲染 watcher name: render id: 3

// new Wacther(()=> updateComponent(render()) )

// TODO: 每一个dep 收集的watcher是什么样子，每一个桶的变化，如果有组件呢？
// 常见问题：computed watcher 的缓存机制

const vm = new Vue({
  el: "#app",
  data: {
    intro: "这是个例子", // []
    parentMessage: "Parent", // []
    items: [{ message: "Foo" }, { message: "Bar" }], //  [] 对象内部 []
    count: 0, //  []
    aaa: 123, // []
  },
  // bbb get set  []
  computed: {
    bbb() {
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
