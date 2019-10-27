import React, { useEffect, useState } from "react";
import { useDataPoints, useConfig } from "../../stores/sensors/sensorsStore";
import { storage } from "../../firebase";
import MySocket from "../../Components/Livestream/MySocket";

import * as tf from "@tensorflow/tfjs";
import { csv } from "d3";
import "./CurrentProject.css";
/*import {
  setDatapoints,
  setSensors,
  setProjectName,
  setSensorData
} from "../../stores/sensors/sensorsActions";*/
import Sensor from "../../Components/Sensor/Sensor";
import SingleSensor from "../../Components/Sensor/SingleSensor";
import { Redirect } from "react-router-dom";

import {
  getR2Score,
  normalizeData,
  standardizeData,
  getCovarianceMatrix,
  getDatasetByColumns,
  getReducedDataset,
  shuffleData
} from "./statisticsLib.js";

import {
  loadConfig,
  loadData,
  uploadData,
  uploadConfig,
  loadConfigMod,
  loadCSVData
} from "./transferLib.js";
import {
  getFeatureTargetSplit,
  getTestTrainSplit,
  convertToTensors,
  getBasicModel,
  getComplexModel
} from "./machineLearningLib.js";
import { fetchModel, fetchConfig } from "../../stores/sensors/sensorsActions";

let dataPoints;
let sensors = [];
let sensorData;

function setDataPoints(p) {
  dataPoints = p;
}

function setSensors(s) {
  sensors = s;
}

function setSensorData(d) {
  sensorData = d;
}

const CurrentProject = ({ match }) => {
  const { projectName } = match.params;
  const [currentSensor, setCurrentSensor] = useState("");

  const [liveData, setLiveData] = useState(true);

  const [CSVData, setCSVData] = useState(null);

  if (!CSVData) {
    loadData(projectName, setCSVData);
  }

  const [loading, setLoading] = useState(false);

  const lastLoadedProjectName = projectName;

  const model = fetchModel(projectName);

  let plot_y = [];
  let plot_pred = [];

  function predict(dataPoint) {
    if (sensorData.hasDifferentValueRanges) {
      dataPoint = standardizeData(dataPoint);
    } else {
      dataPoint = normalizeData(dataPoint);
    }

    const prediction = model
      .predict(tf.tensor2d([dataPoint], [1, dataPoint.length]))
      .dataSync();
    if (prediction.length === 1) {
      return prediction[0];
    } else {
      return prediction;
    }
  }

  function doPredictions(model) {
    let predName = sensorData.output[0];
    console.log(model);
    let dataCopy = JSON.parse(JSON.stringify(dataPoints));
    let y_real = dataPoints.map(x => Number(x[predName]));
    dataCopy.forEach(x => delete x[predName]);
    let x_real = dataCopy.map(x => Object.values(x).map(y => Number(y)));
    console.log("y_real", y_real);
    console.log("x_real", x_real);
    if (sensorData.hasDifferentValueRanges) {
      x_real = standardizeData(x_real);
    } else {
      x_real = normalizeData(x_real);
    }

    let i = 0;
    x_real.forEach(p => {
      console.log("p", p);
      let prediction = model
        .predict(tf.tensor2d([p], [1, p.length]))
        .dataSync();
      console.log("pred", prediction);
      console.log("real", y_real[i]);
      plot_y.push(y_real[i]);
      plot_pred.push(prediction[0]);
      i = i + 1;
    });

    console.log(plot_y);
    console.log(plot_pred);
  }

  async function doStuff() {
    console.log("LAST LOADED", projectName);
    setLoading(true);

    await loadConfigMod(projectName, setSensorData);
    await loadData(projectName, setDataPoints);
    setSensors(sensorData.sensorNames);
    console.log("dataPoints", dataPoints);
    console.log("sensorData", sensorData);
    console.log("sensors", sensors);
    // await setModel(projectName);
    setLoading(false);
    doPredictions(model);
  }

  useEffect(() => {
    // doStuff();
    // console.log(conf);
  }, []);

  const changeLiveData = liveData => {
    setLiveData(liveData);
  };

  return (
    <div className="Container">
      <div className="CurrentProject__Title">
        Project: {lastLoadedProjectName}
      </div>
      {loading && <div>Loading data...</div>}
      {projectName === undefined &&
        lastLoadedProjectName &&
        lastLoadedProjectName.length === 0 && (
          <div>You currently have no current project selected. </div>
        )}

      <button onClick={() => changeLiveData(!liveData)}>CHANGE</button>
      {!loading && (
        <div>
          {
            <div className={!liveData ? "show" : "hide"}>
              <MySocket
                projectName={match.params.projectName}
                predict={() => predict()}
                model={model}
              />
            </div>
          }
          {
            <div className={liveData ? "show" : "hide"}>
              <div className="Setup__Option">
                Your sensors (choose one if you have not selected any):
              </div>
              <div className="CurrentProject__SensorsList">
                {CSVData &&
                  Object.keys(CSVData[0]).map(sensor => (
                    <div
                      className={
                        currentSensor === sensor ? "SelectedSensor" : ""
                      }
                      onClick={() => {
                        setCurrentSensor(sensor);
                      }}
                      key={sensor}
                    >
                      {sensor}
                    </div>
                  ))}
              </div>
              {currentSensor && (
                <div>
                  <Sensor
                    sensor={currentSensor}
                    dataPoints={CSVData}
                    sensors={Object.keys(CSVData[0])}
                  />
                </div>
              )}
            </div>
          }
        </div>
      )}
    </div>
  );
};

export default CurrentProject;
