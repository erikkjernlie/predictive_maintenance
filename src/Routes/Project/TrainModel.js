import React, { useState, useEffect } from "react";
import { useModels } from "../../stores/models/modelsStore";
/*import {
  useSensorNames,
  useDataPoints
} from "../../stores/sensors/sensorsStore";*/
import "./TrainModel.css";
import { Link } from "react-router-dom";

import { csv } from "d3";

import * as tf from "@tensorflow/tfjs";
import * as tfvis from "@tensorflow/tfjs-vis";
import {
  getR2Score,
  normalizeData,
  standardizeData,
  getCovarianceMatrix,
  getDatasetByColumns,
  discardCovariantColumns,
  shuffleData
} from "./statisticsLib.js";
/*import {
  setDatapoints,
  setSensors,
  setProjectName,
  setSensorData
} from "../../stores/sensors/sensorsActions";*/
import { storage } from "../../firebase";
import { setConfig, setData } from "./transferLib.js";
import { getFeatureTargetSplit, getTestTrainSplit, convertToTensors, getBasicModel, getComplexModel } from "./machineLearningLib.js";

let dataPoints;
let sensors;
let sensorData;

function setDataPoints(p) {
  dataPoints = p;
}

  function setSensors(s) {
  sensors = s
}

function setSensorData(d) {
  sensorData = d
}

// 1. "My dataset has columns with very different value ranges" --> true: standardization, false: normalzation
// 2. "My dataset is very complex" --> true: flere/bredere lag, false: standard modell
// 3. "I want to reduce training time by discarding covariant features" --> true: discardColumns, false: ikke

const modelParams = {
  test_train_split: 0.2,
  activation: "relu",
  learningRate: 0.01,
  epochs: 20,
  optimizer: tf.train.adam(0.01),
  loss: "meanSquaredError",
  min_R2_score: 0.5
};

const TrainModel = ({ match }) => {
  const { projectName } = match.params;

  async function fetchData() {
    await setConfig(projectName, setSensorData);
    await setData(projectName, setDataPoints, setSensors)
    console.log("dataPoints", dataPoints)
    console.log("sensorData", sensorData)
    train(dataPoints)
  }

  useEffect(() => {
    fetchData();
  }, []);

  function preprocessData(data) {
    // TODO:
    // remove outliers
    // remove Null-values
    return data;
  }

  async function train(data) {
    data = preprocessData(data);
    data = shuffleData(data);
    let [features, targets] = getFeatureTargetSplit(data, sensorData);
    features = features.map(x => Object.values(x).map(y => Number(y)));
    targets = targets.map(x => Object.values(x).map(y => Number(y)));
    console.log("features", features);
    console.log("targets", targets);
    console.log("Covariance matrix", getCovarianceMatrix(features));
    if (sensorData.reduceTrainingTime) {
      //features = discardCovariantColumns(features)
    }
    if (sensorData.hasDifferentValueRanges) {
      features = standardizeData(features);
    } else {
      features = normalizeData(features);
    }
    const [x_train, x_test, y_train, y_test] = getTestTrainSplit(
      features,
      targets,
      modelParams.test_train_split
    );
    const tensors = convertToTensors(x_train, x_test, y_train, y_test);
    console.log("trainFeatures", tensors.trainFeatures);
    console.log("testFeatures", tensors.testFeatures);
    console.log("trainTargets", tensors.trainTargets);
    console.log("testTargets", tensors.testTargets);
    let r2 = -1000;
    let model;
    let predictions;
    while (r2 < modelParams.min_R2_score) {
      model = await trainModel(
        tensors.trainFeatures,
        tensors.trainTargets,
        tensors.testFeatures,
        tensors.testTargets
      );
      predictions = model.predict(tensors.testFeatures);
      //console.log("PREDICT", predictions);
      r2 = getR2Score(predictions.arraySync(), y_test).rSquared;
      console.log("R2 score: ", r2);
    }
  }

  async function trainModel(xTrain, yTrain, xTest, yTest) {
    // console.log("Start training");
    // const params = ui.loadTrainParametersFromUI();

    console.log("xtrain shape", xTrain.shape[1]);
    // Define the topology of the model: two dense layers.
    let model;
    if (sensorData.isComplex) {
      model = getComplexModel(xTrain.shape[1], yTrain.shape[1], modelParams);
    } else {
      model = getBasicModel(xTrain.shape[1], yTrain.shape[1], modelParams);
    }
    model.summary();

    model.compile({
      optimizer: modelParams.optimizer,
      loss: modelParams.loss
    });

    const trainLogs = [];
    const lossContainer = document.getElementById("lossCanvas");
    const accContainer = document.getElementById("accuracyCanvas");
    const callbacks = tfvis.show.fitCallbacks(lossContainer, ["loss", "acc"], {
      callbacks: ["onEpochEnd"]
    });
    const beginMs = performance.now();
    // Call `model.fit` to train the model.
    const history = await model.fit(xTrain, yTrain, {
      epochs: modelParams.epochs,
      validationData: [xTest, yTest],
      callbacks: callbacks
    });

    await model.save("indexeddb://" + projectName + "/model").then(() => {
      console.log("Model saved to indexeddb");
    });

    /*console.log("Loading model");
    const loadedModel = await tf.loadLayersModel(
      "indexeddb://" + projectName + "/model"
    );
    console.log("Saved model", model);
    console.log("Loaded model", loadedModel);
    console.log(
      "Saved prediction",
      model.predict(tf.tensor2d([[2.0, 2.0, 2.0]], [1, xTrain.shape[1]])).print()
    );
    console.log(
      "Loaded prediction",
      loadedModel
        .predict(tf.tensor2d([[2.0, 2.0, 2.0]], [1, xTrain.shape[1]]))
        .print()
    );*/

    return model;
  }

  return (
    <div className="Sensors">
      {/*<div>
        {models.map(model => (
          <div>
            {
              model
                .predict(tf.tensor2d([[7.207286, 1.844344]], [1, 2]))
                .dataSync()[0]
            }
            ;
          </div>
        ))}
        </div>*/}
      <div>
        <div>Configuration</div>
        <div>Start training TrainModel</div>
        <Link to={"/" + projectName}>
          <button>See data and visualization</button>
        </Link>
      </div>
      <div>
        <div>
          <h4>Loss</h4>
          <div className="canvases" id="lossCanvas"></div>
        </div>
        <div>
          <h4>Accuracy</h4>
          <div className="canvases" id="accuracyCanvas"></div>
        </div>
      </div>
      {/*<div className="SensorsList">
        {sensors.map(sensor => (
          <div
            className={currentSensor === sensor ? "SelectedSensor" : ""}
            onClick={() => {
              setCurrentSensor(sensor);
            }}
          >
            {sensor}
          </div>
        ))}
      </div>
      {currentSensor && (
        <div className="CurrentSensor">
          <Sensor
            sensor={currentSensor}
            dataPoints={dataPoints}
            sensors={sensors}
          />
        </div>
      )}
      */}
    </div>
  );
};

export default TrainModel;
