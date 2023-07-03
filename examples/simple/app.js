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
    key: "Vue！", // []
    parentMessage: "Parent", // [
    items: [{ message: "Foo" }, { message: "Bar" }], //  []
    count: 0, //  []
    aaa: 123, // []
  },
  // bbb get set  []
  computed: {
    bbb() {
      return this.count + this.key
    }
  },
  methods: {
    handleClick() {
      for (let i = 0; i < 1000; i++) {
        this.count++;
      }
    },
  },
  mounted() {
    console.dir(document.getElementById("app"));
  },
});

vm.$watch('count', ()=> {})
