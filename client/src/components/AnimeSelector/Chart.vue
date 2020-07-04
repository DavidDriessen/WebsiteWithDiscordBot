<script>
import { Bar } from "vue-chartjs";

export default {
  extends: Bar,
  props: {
    labels: {
      type: Array,
      default: null
    },
    values: {
      type: Array,
      default: null
    }
  },
  mounted() {
    this.renderChart({
      labels: this.labels,
      datasets: [
        {
          label: "Data One",
          backgroundColor: "#f87979",
          data: this.values
        }
      ]
    });
  }
};
</script>
