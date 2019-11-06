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
  loadProcessedConfig
} from "./transferLib.js";
import {
  getFeatureTargetSplit,
  getTestTrainSplit,
  convertToTensors,
  getBasicModel,
  getComplexModel
} from "./machineLearningLib.js";
import { fetchModel } from "./transferLib.js";

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

  const config = useConfig();

  let plot_y = [];
  let plot_pred = [];

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

      <button onClick={() => changeLiveData(!liveData)}>
        See {!liveData ? "live data" : "historical data"}.
      </button>
      {!loading && config && (
        <div>
          {
            <div className={liveData ? "show" : "hide"}>
              <MySocket
                projectName={match.params.projectName}
                model={model}
                config={config}
              />
            </div>
          }
          {
            <div className={!liveData ? "show" : "hide"}>
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
