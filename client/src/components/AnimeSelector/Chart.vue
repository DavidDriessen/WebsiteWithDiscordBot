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
    this.renderChart(
      {
        labels: this.labels,
        datasets: [
          {
            label: "Data One",
            backgroundColor: "#f87979",
            data: this.values
          }
        ]
      },
      {
        scales: {
          yAxes: [
            {
              ticks: {
                beginAtZero: true
              },
              gridLines: {
                display: true
              }
            }
          ],
          xAxes: [
            {
              ticks: {
                beginAtZero: true
              },
              gridLines: {
                display: false
              }
            }
          ]
        },
        legend: {
          display: false
        },
        tooltips: {
          enabled: true,
          mode: "single",
          callbacks: {
            label: function(tooltipItems) {
              return (
                tooltipItems.yLabel +
                " member" +
                (tooltipItems.yLabel > 1 ? "s" : "")
              );
            }
          }
        },
        responsive: true,
        maintainAspectRatio: true,
        height: 200
      }
    );
  }
};
</script>
