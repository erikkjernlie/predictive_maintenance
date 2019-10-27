import sensorsStore from "./sensorsStore";
import { storage } from "../../firebase";
import { csv } from "d3";
import * as tf from "@tensorflow/tfjs";

function addConfigVariable(variable, value) {
  let config = sensorsStore.getState().config;
  config[variable] = config[variable].concat(value);
  sensorsStore.setState({
    config: config
  });
}
function setConfigVariable(variable, value) {
  let config = sensorsStore.getState().config;
  config[variable] = value;
  sensorsStore.setState({
    config: config
  });
}
export function setSensorNames(value) {
  addConfigVariable("sensorNames", value);
}

export function setDataPoints(dataPoints) {
  sensorsStore.setState({
    dataPoints: dataPoints
  });
}
export function setDataPointsProcessed(dataPointsProcessed) {
  sensorsStore.setState({
    dataPointsProcessed: dataPointsProcessed
  });
}
function addInput(value) {
  addConfigVariable("input", value);
}
function addOutput(value) {
  addConfigVariable("output", value);
}
function addInternal(value) {
  addConfigVariable("internal", value);
}
function resetSensors() {
  let config = sensorsStore.getState().config;
  config["input"] = [];
  config["output"] = [];
  config["internal"] = [];
  sensorsStore.setState({
    config: config
  });
}

export function setData(value) {
  let config = sensorsStore.getState().config;
  config["data"] = value;
  sensorsStore.setState({
    config: config
  });
}

export function addSensor(sensor, type, unit, min, max) {
  let config = sensorsStore.getState().config;
  delete config.sensors.sensor;
  let obj = {
    [sensor]: {
      name: sensor,
      type: type,
      unit: unit,
      min: min,
      max: max
    }
  };
  config["sensors"] = { ...config["sensors"], ...obj };
  config["input"] = [];
  config["output"] = [];
  config["internal"] = [];
  Object.keys(config.sensors).forEach(x =>
    config[config.sensors[x].type].push(config.sensors[x].name)
  );
  sensorsStore.setState({
    config: config
  });
}

export function setMinValue(sensor, minValue) {
  console.log(minValue); // figure out where to store this
}

export function setMaxValue(sensor, maxValue) {
  console.log(maxValue); // figure out where to store this
}

export function setProjectName(value) {
  setConfigVariable("projectName", value);
}
export function setLiveFeedURL(value) {
  setConfigVariable("liveFeedURL", value);
}
export function setPredictedValueAbsoluteError(value) {
  setConfigVariable("predictedValueAbsoluteError", value);
}
export function setPredictedValuePercentageError(value) {
  setConfigVariable("predictedValuePercentageError", value);
}
export function setDifferentValueRanges(value) {
  setConfigVariable("differentValueRanges", value);
}
export function setReduceTrainingTime(value) {
  setConfigVariable("reduceTrainingTime", value);
}
export function setIsComplex(value) {
  setConfigVariable("isComplex", value);
}
export function setConfig(value) {
  sensorsStore.setState({
    config: value
  });
}
export function setConfigProcessed(value) {
  sensorsStore.setState({
    configProcessed: value
  });
}
