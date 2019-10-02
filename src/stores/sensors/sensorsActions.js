import sensorsStore from "./sensorsStore";
import * as tf from "@tensorflow/tfjs";
import { csv } from "d3";

/*

export function fetchSensors() {
  console.log("FETCHING SENSORS");
  sensorsStore.setState({ fetching: true });

  return csv("rig_feil.csv").then(data => {
    console.log(Object.keys(data[0]));
    sensorsStore.setState({
      data: data,
      sensors: Object.keys(data[0])
    });
  });
}

*/

export function setSensors(sensorNames) {
  sensorsStore.setState({
    sensorNames: sensorNames
  });
}

export function setDatapoints(dataPoints) {
  sensorsStore.setState({
    dataPoints: dataPoints
  });
}
