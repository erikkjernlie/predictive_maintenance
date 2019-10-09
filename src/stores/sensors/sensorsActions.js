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

export function saveSensorData(sensor, type) {
  let b = sensorsStore.getState().sensorData;
  console.log(b);
  if (b["internal"].indexOf(sensor) >= 0) {
    b["internal"] = b["internal"].filter(s => s !== sensor);
  }
  if (b["input"].indexOf(sensor) >= 0) {
    b["input"] = b["input"].filter(s => s !== sensor);
  }
  if (b["output"].indexOf(sensor) >= 0) {
    b["output"] = b["output"].filter(s => s !== sensor);
  }
  b[type] = b[type].concat(sensor);
  console.log(b);
  sensorsStore.setState({
    sensorData: b
  });
}
