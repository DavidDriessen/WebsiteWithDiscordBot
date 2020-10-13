<script>
import { Bar } from "vue-chartjs";

export default {
  extends: Bar,
  props: {
    labels: {
      type: Array,
      default: null
    },
    data: {
      type: Array,
      default: null
    },
    mode: {
      type: Number,
      default: 0
    }
  },
  mounted() {
    let datasets;
    let stacked = false;
    switch (this.mode) {
      case 4:
        stacked = true;
      // eslint-disable-next-line no-fallthrough
      case 3:
        datasets = [
          {
            label: "OK",
            backgroundColor: "#f8d879",
            data: this.data[2]
          },
          {
            label: "Must",
            backgroundColor: "#65f532",
            data: this.data[3]
          }
        ];
        break;
      case 2:
        datasets = [
          {
            label: "Yes",
            backgroundColor: "#29ff25",
            data: this.data[0].map((v, k) => v + this.data[1][k])
          }
        ];
        break;
      case 1:
        datasets = [
          {
            label: "Nope",
            backgroundColor: "#f87979",
            data: this.data[0]
          },
          {
            label: "Has to be",
            backgroundColor: "#fd722b",
            data: this.data[1]
          },
          {
            label: "OK",
            backgroundColor: "#f8d879",
            data: this.data[2]
          },
          {
            label: "Must",
            backgroundColor: "#65f532",
            data: this.data[3]
          }
        ];
        break;
      default:
        stacked = true;
        datasets = [
          {
            label: "Nope",
            backgroundColor: "#f87979",
            data: this.data[0].map(v => -v)
          },
          {
            label: "Has to be",
            backgroundColor: "#fd722b",
            data: this.data[1].map(v => v / 2)
          },
          {
            label: "OK",
            backgroundColor: "#f8d879",
            data: this.data[2]
          },
          {
            label: "Must",
            backgroundColor: "#65f532",
            data: this.data[3].map(v => v * 2)
          }
        ];
    }

    this.renderChart(
      {
        labels: this.labels,
        datasets
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
              },
              stacked
            }
          ],
          xAxes: [
            {
              ticks: {
                beginAtZero: true
              },
              gridLines: {
                display: false
              },
              stacked
            }
          ]
        },
        legend: {
          display: true
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
