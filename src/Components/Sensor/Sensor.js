import React, { useState } from "react";
import Plot from "react-plotly.js";

const Sensor = props => {
  const layout = {
    width: 420,
    height: 340,
    padding: 0,
    title: "Data from test rigg",
    plot_bgcolor: "#fff"
  };

  const newData = props.dataPoints.map(
    dataPointForAllSensors =>
      dataPointForAllSensors[props.sensors.indexOf(props.sensor)]
  );

  // NOW WE CAN ALSO PLOT UNIT
  // AND WE ALSO NEED TO TAKE IN TIMESTAMPS!!!!!!!!!!
  const data = [
    {
      y: newData,
      mode: "line",
      type: "scattergl",
      name: "Real value"
    }
  ];

  const config = {};
  const frames = [];

  return (
    <div>
      <div>{props.sensor}</div>
      <Plot data={data} layout={layout} config={config} frames={frames} />
    </div>
  );
};

export default Sensor;