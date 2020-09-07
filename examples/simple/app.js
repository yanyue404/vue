/* global Vue */

new Vue({
  el: "#app",
  data: {
    test: 1,
  },
  created() {
    console.log(this);
  },
  mounted() {
    console.dir(document.getElementById("app"));
  },
});
