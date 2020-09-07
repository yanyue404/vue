/* global Vue */

new Vue({
  el: "#app",
  data: {
    key: "Vue！",
    parentMessage: "Parent",
    items: [{ message: "Foo" }, { message: "Bar" }],
    count: 0,
  },
  computed: {
    text() {
      return "hello, " + this.key;
    },
  },
  methods: {
    handleClick() {
      for (let i = 0; i < 1000; i++) {
        this.count++;
      }
    },
  },
  created() {
    console.log(this.text);
  },
  mounted() {
    console.dir(document.getElementById("app"));
  },
});
