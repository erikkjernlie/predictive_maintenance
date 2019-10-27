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

  componentDidUpdate(prevProps) {
    /*
    if (prevProps.dataPoints !== this.props.dataPoints) {
      console.log(this.props.dataPoints);
      if (this.props.dataPoints && this.props.dataPoints.length >= 0) {
        this.setState({
          dataPoint: this.props.dataPoints[9]
        });
      }
    }
    */
  }

  render() {
    return (
      <div>
        <Plot
          data={this.props.dataPoints}
          layout={this.state.layout}
          config={this.state.config}
          frames={this.state.frames}
        />
        {/*Value: {this.state.dataPoint}*/}
      </div>
    );
  }
}
