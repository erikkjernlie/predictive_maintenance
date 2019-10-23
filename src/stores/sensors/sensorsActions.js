import sensorsStore from "./sensorsStore";
import { storage } from "../../firebase";
import { csv } from "d3";

export function setSensors(sensorNames) {
  sensorsStore.setState({
    sensorNames: sensorNames
  });
}

export function setDataPoints(dataPoints) {
  sensorsStore.setState({
    dataPoints: dataPoints
  });
}

export function setConfig(variable, value) {
  let sensorData = sensorsStore.getState().sensorData;
  sensorData[variable] = value;
  sensorsStore.setState({
    sensorData: sensorData
  });
}

export function setProjectName(projectName) {
  let sensorData = sensorsStore.getState().sensorData;

  const downloadRef = storage.ref(`${projectName}/data.csv`);
  downloadRef.getDownloadURL().then(url => {
    csv(url).then(data => {
      let sensorNames = Object.keys(data[0]);
      setSensors(sensorNames);
      setDataPoints(data);
    });
  });
  sensorData["projectName"] = projectName;
  sensorsStore.setState({
    sensorData: sensorData
  });
}

export function createProjectName(projectName) {
  let sensorData = sensorsStore.getState().sensorData;
  sensorData["projectName"] = projectName;
  sensorsStore.setState({
    sensorData: sensorData
  });
}

export function setLiveFeedURL(url) {
  let sensorData = sensorsStore.getState().sensorData;
  sensorData["URLtoLiveFeed"] = url;
  sensorsStore.setState({
    sensorData: sensorData
  });
}

export function setSensorData(sensorData) {
  sensorsStore.setState({
    sensorData: sensorData
  });
}

// CAN REMOVE THIS ONE
export function saveSensorData(sensor, type, unit) {
  let sensorData = sensorsStore.getState().sensorData;
  console.log(sensorData);
  if (sensorData["internal"].indexOf(sensor) >= 0) {
    sensorData["internal"] = sensorData["internal"].filter(s => s !== sensor);
  }
  if (sensorData["input"].indexOf(sensor) >= 0) {
    sensorData["input"] = sensorData["input"].filter(s => s !== sensor);
  }
  if (sensorData["output"].indexOf(sensor) >= 0) {
    sensorData["output"] = sensorData["output"].filter(s => s !== sensor);
  }
  sensorData[type] = sensorData[type].concat(sensor);
  console.log(sensorData);
  sensorsStore.setState({
    sensorData: sensorData
  });
}

export function addSensor(sensor, type, unit) {
  let sensorData = sensorsStore.getState().sensorData;
  sensorData["sensors"] = sensorData["sensors"].concat({
    name: sensor,
    type: type,
    unit: unit
  });
  sensorsStore.setState({
    sensorData: sensorData
  });
}
