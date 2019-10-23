import React from "react";
import Plot from "react-plotly.js";

const SingleSensor = props => {
  const layout = {
    width: 420,
    height: 340,
    padding: 0,
    title: "Data from test rigg",
    plot_bgcolor: "#fff"
  };

  const newData = props.dataPoints;

  console.log(props.dataPoints);

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
      <h4>Selected sensor: {props.sensor}</h4>
      <Plot data={data} layout={layout} config={config} frames={frames} />
    </div>
  );
};

export default SingleSensor;
