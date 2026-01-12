export const GRAPH_CATALOG = {
  catalogId: "https://a2ui.dev/catalogs/graph-catalog/v1",
  components: {
    Graph: {
      type: "object",
      description: "Interactive chart/graph component supporting multiple visualization types",
      properties: {
        data: { 
          type: "array",
          description: "Array of data points. Supports formats: [{x, y}], [{label, value}], or [numbers]",
          items: {
            type: "object"
          }
        },
        graphType: { 
          type: "string",
          enum: ["line", "bar", "pie", "doughnut", "radar", "polarArea"],
          default: "line",
          description: "Type of chart to display"
        },
        interactive: { 
          type: "boolean",
          default: true,
          description: "Enable/disable hover interactions and tooltips"
        },
        title: {
          type: "string",
          description: "Chart title"
        },
        xLabel: {
          type: "string",
          description: "X-axis label"
        },
        yLabel: {
          type: "string",
          description: "Y-axis label"
        }
      },
      required: ["data"]
    }
  }
};
