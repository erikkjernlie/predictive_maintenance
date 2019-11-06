import React, { Component } from "react";
import Plot from "react-plotly.js";

export default class PlotIt extends Component {
  state = {
    layout: {
      width: 1000,
      height: 340,
      padding: 0,
      plot_bgcolor: "#fff"
    },
    config: {},
    frames: [],
    dataPoint: 0
  };

  render() {
    return (
      <div>
        <Plot
          data={this.props.dataPoints}
          layout={this.state.layout}
          config={this.state.config}
          frames={this.state.frames}
        />
      </div>
    );
  }
}
