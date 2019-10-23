import React, { useEffect, useState } from "react";
import {
  useDataPoints,
  useSensorNames,
  useProjectName,
  useSensorData
} from "../../stores/sensors/sensorsStore";
import { storage } from "../../firebase";
import MySocket from "../../Components/Livestream/MySocket";

import * as tf from "@tensorflow/tfjs";
import { csv } from "d3";
import "./CurrentProject.css";
import {
  setDatapoints,
  setSensors,
  setProjectName,
  setSensorData
} from "../../stores/sensors/sensorsActions";
import Sensor from "../../Components/Sensor/Sensor";
import SingleSensor from "../../Components/Sensor/SingleSensor";
import { Redirect } from "react-router-dom";

import {
  getR2Score,
  normalizeData,
  standardizeData,
  getCovarianceMatrix,
  getDatasetByColumns,
  discardCovariantColumns,
  shuffleData
} from "./statisticsLib.js";

const CurrentProject = ({ match }) => {
  const dataPoints = useDataPoints();
  const sensorNames = useSensorNames();
  const sensorData = useSensorData();
  // PROJECTNAME const p = useSensorNames();
  const { projectName } = match.params;
  const [currentSensor, setCurrentSensor] = useState(sensorNames[0]);

  const [loading, setLoading] = useState(false);

  const lastLoadedProjectName = useProjectName();

  let points;
  let names;
  let info;
  
  let plot_y = []
  let plot_pred = []

  function doPredictions(model) {
    console.log(model)
    let predictions = [];
    let real = [];
    let predName = info.output[0];
    let predData = points;
    console.log("predData", predData);
    console.log("predName", predName);
    let dataCopy = JSON.parse(JSON.stringify(points))
    let y_real = points.map(x => Number(x[predName]))
    dataCopy.forEach(x => delete x[predName])
    let x_real = dataCopy.map(x => Object.values(x).map(y => Number(y)));
    console.log("y_real", y_real)
    console.log("x_real", x_real)
    if (info.hasDifferentValueRanges) {
      x_real = standardizeData(x_real);
    } else {
      x_real = normalizeData(x_real);
    }

    let i = 0
    x_real.forEach(p => {
      let prediction = model.predict(tf.tensor2d([p], [1, p.length])).dataSync()
      console.log("pred", prediction);
      console.log("real", y_real[i]);
      plot_y.push(y_real[i]);
      plot_pred.push(prediction[0]);
      i = i + 1;
    });

    console.log(plot_y)
    console.log(plot_pred)
  }

  useEffect(async () => {
    console.log("LAST LOADED", projectName, lastLoadedProjectName);
    setLoading(true);

    // fetching data if we de not have anything from before
    const downloadRef = storage.ref(`${projectName}/data.csv`);
    await downloadRef.getDownloadURL().then(async url => {
      await csv(url).then(async data => {
        let sensorNames = Object.keys(data[0]);
        await setSensors(sensorNames);
        await setDatapoints(data);
        await setProjectName(projectName);
        await setLoading(false);
        points = data;
        names = sensorNames;
        console.log("data", data);
      });
    });
    const downloadRefConfig = storage.ref(`${projectName}/sensorData.json`);
    await downloadRefConfig.getDownloadURL().then(async url => {
      await fetch(url)
        .then(async response => response.json())
        .then(async jsonData => {
          console.log("sensorData", jsonData);
          await setSensorData(jsonData);
          console.log("output", jsonData.output);
          info = jsonData;
        });
    });

    console.log("Items")
    console.log(dataPoints)
    console.log(sensorNames)
    console.log(sensorData)
    console.log("...................")

    console.log(points)
    console.log(names)
    console.log(info)

    console.log(".........")

    console.log("Loading model")
    const loadedModel = await tf.loadLayersModel(
      "indexeddb://" + projectName + "/model"
    );

    doPredictions(loadedModel)
  }, []);

  return (
    <div className="Container">
      <div className="CurrentProject__Title">
        Project: {lastLoadedProjectName}
      </div>
      {loading && <div>Loading data...</div>}
      {projectName === undefined && lastLoadedProjectName.length === 0 && (
        <div>You currently have no current project selected. </div>
      )}
      {!loading && (
        <div>
          <div className="Setup__Option">
            Your sensors (choose one if you have not selected any):
          </div>
          <div className="CurrentProject__SensorsList">
            {sensorNames.map(sensor => (
              <div
                className={currentSensor === sensor ? "SelectedSensor" : ""}
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
                dataPoints={dataPoints}
                sensors={sensorNames}
              />
            </div>
          )}
          <div>
            <SingleSensor
              sensor={currentSensor}
              dataPoints={plot_y}
              sensors={sensorNames}
            />
          </div>
          <div>
            <SingleSensor
              sensor={currentSensor}
              dataPoints={plot_pred}
              sensors={sensorNames}
            />
          </div>
        </div>
      )}
      {!loading && (
        <div>
          <MySocket />
        </div>
      )}
    </div>
  );
};

export default CurrentProject;
