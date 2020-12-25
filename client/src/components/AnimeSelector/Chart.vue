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
    setTimeout(() => this.render(), 200);
  },
  watch: {
    mode() {
      this.render();
    }
  },
  methods: {
    render() {
      let datasets;
      let labels;
      let stacked = false;
      let legend = false;
      function generateRandomColor() {
        const letters = "0123456789ABCDEF";
        let color = "#";
        for (let i = 0; i < 6; i++) {
          color += letters[Math.floor(Math.random() * 16)];
        }
        return color;
      }
      switch (this.mode) {
        case 2:
          legend = true;
          labels = [
            ...new Set(
              this.data.reduce(
                (total, o) => total.concat(o.votes.map(v => v.user)),
                []
              )
            )
          ];
          datasets = this.data.map(o => ({
            label: o.media ? o.media.title : o.content,
            backgroundColor: generateRandomColor(),
            data: o.votes.map(v => ({
              votes: o.votes,
              x: v.user,
              y: v.choice
            }))
          }));
          break;
        case 1:
          labels = this.data.map(o => (o.media ? o.media.title : o.content));
          datasets = [
            {
              backgroundColor: "#fd722b",
              data: this.data.map(o => ({
                votes: o.votes,
                x: o.media ? o.media.title : o.content,
                y: o.votes.reduce(
                  (total, v) => total + (v.choice > 0 ? 1 : 0),
                  0
                )
              }))
            }
          ];
          break;
        default:
          stacked = true;
          labels = this.data.map(o => (o.media ? o.media.title : o.content));
          datasets = [
            {
              backgroundColor: "#fd722b",
              data: this.data.map(o => ({
                votes: o.votes,
                x: o.media ? o.media.title : o.content,
                y: o.votes.reduce((total, v) => total + v.choice, 0)
              }))
            }
          ];
      }

      this.renderChart(
        {
          labels,
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
            display: legend
          },
          tooltips: {
            enabled: true,
            mode: "single",
            callbacks: {
              label: function(tooltipItems, data) {
                const members =
                  data.datasets[tooltipItems.datasetIndex].data[
                    tooltipItems.index
                  ].votes;
                return members.map(m => m.user + ": " + m.choice).join("\n");
              }
            }
          },
          responsive: true,
          maintainAspectRatio: false,
          height: 200
        }
      );
    }
  }
};
</script>
