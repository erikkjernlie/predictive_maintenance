import React, { useState, useEffect } from "react";
import { useModels } from "../../stores/models/modelsStore";
import {
  useSensorNames,
  useDataPoints
} from "../../stores/sensors/sensorsStore";
import "./TrainModel.css";
import Sensor from "../../Components/Sensor/Sensor";
import { Link } from "react-router-dom";
import { shuffle } from "simple-statistics";

import { csv } from "d3";

import * as tf from "@tensorflow/tfjs";
import * as tfvis from "@tensorflow/tfjs-vis";
import * as data from "./data";
import getProcessedData from "./processData";
import {
  getR2Score,
  normalizeData,
  standardizeData,
  getCovarianceMatrix,
  getDatasetByColumns,
  discardCovariantColumns,
  shuffleData
} from "./statisticsLib.js";

import { storage } from "../../firebase";

const modelData = {
  name: "MyProject",
  url: "www.myProject.com",
  sensors: {
    inputs: ["sepal.length", "sepal.width", "petal.length"],
    outputs: ["petal.width"]
  },
  config: {
    standardization: true,
    complex: false,
    reduce: true
  }
};

// 1. "My dataset has columns with very different value ranges" --> true: standardization, false: normalzation
// 2. "My dataset is very complex" --> true: flere/bredere lag, false: standard modell
// 3. "I want to reduce training time by discarding covariant features" --> true: discardColumns, false: ikke

const modelParams = {
  test_train_split: 0.2,
  activation: "relu",
  learningRate: 0.01,
  epochs: 20,
  optimizer: tf.train.adam(0.01),
  loss: "meanSquaredError"
};

const TrainModel = ({ match }) => {
  const models = useModels();
  const sensors = useSensorNames();
  const { projectName } = match.params;

  // const dataPoints = useDataPoints();

  const [sensorNames, setSensorNames] = useState([]);
  const [dataPoints, setDatapoints] = useState([]);

  useEffect(() => {
    const uploadTask = storage.ref(`${projectName}/data.csv`);
    uploadTask.getDownloadURL().then(url => {
      csv(url).then(data => {
        setSensorNames(Object.keys(data[0]));
        setDatapoints(data);
        console.log("data", data);
        train(data);
      });
    });
  }, []);

  function getFeatureTargetSplit(data) {
    const feats = modelData.sensors.inputs.concat(modelData.sensors.internal);
    const targs = modelData.sensors.outputs;
    let features = JSON.parse(JSON.stringify(data));
    let targets = JSON.parse(JSON.stringify(data));
    feats.forEach(feat => targets.forEach(x => delete x[feat]));
    targs.forEach(targ => features.forEach(x => delete x[targ]));
    return [features, targets];
  }

  function getTestTrainSplit(features, targets, test_train_split) {
    const numberOfRows = features.length;
    const numberOfTest = Math.round(numberOfRows * test_train_split);
    const numberOfTrain = numberOfRows - numberOfTest;

    const x_train = features.slice(0, numberOfTrain - 1);
    const x_test = features.slice(numberOfTrain - 1);
    const y_train = targets.slice(0, numberOfTrain - 1);
    const y_test = targets.slice(numberOfTrain - 1);
    return [x_train, x_test, y_train, y_test];
  }

  function convertToTensors(x_train, x_test, y_train, y_test) {
    const tensors = {};
    tensors.trainFeatures = tf.tensor2d(x_train);
    tensors.trainTargets = tf.tensor2d(y_train);
    tensors.testFeatures = tf.tensor2d(x_test);
    tensors.testTargets = tf.tensor2d(y_test);
    return tensors;
  }

  async function train(data) {
    data = shuffleData(data);
    let [features, targets] = getFeatureTargetSplit(data);
    features = features.map(x => Object.values(x).map(y => Number(y)));
    targets = targets.map(x => Object.values(x).map(y => Number(y)));
    console.log("features", features);
    console.log("targets", targets);
    console.log("Covariance matrix", getCovarianceMatrix(features));
    if (modelData.config.reduce) {
      features = discardCovariantColumns(features);
    }
    if (modelData.config.standardization) {
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
    //console.log("x train", x_train);
    //console.log("x test", x_test);
    //console.log("y train", y_train);
    //console.log("y test", y_test);
    const model = await trainModel(
      tensors.trainFeatures,
      tensors.trainTargets,
      tensors.testFeatures,
      tensors.testTargets
    );
    const predictions = model.predict(tensors.testFeatures);
    //console.log("PREDICT", predictions);
    //console.log("R2 score: ", getR2Score(predictions.arraySync(), y_test));
  }

  function getBasicModel(inputSize) {
    const model = tf.sequential();
    model.add(
      tf.layers.dense({
        units: 10,
        activation: modelParams.activation,
        inputShape: [inputSize]
      })
    );
    model.add(
      tf.layers.dense({ units: 1, activation: modelParams.activation })
    );
    return model;
  }

  function getComplexModel(inputSize) {
    const model = tf.sequential();
    model.add(
      tf.layers.dense({
        units: 10,
        activation: modelParams.activation,
        inputShape: [inputSize]
      })
    );
    model.add(
      tf.layers.dense({
        units: 5,
        activation: modelParams.activation
      })
    );
    model.add(
      tf.layers.dense({ units: 1, activation: modelParams.activation })
    );
    return model;
  }

  async function trainModel(xTrain, yTrain, xTest, yTest) {
    // console.log("Start training");
    // const params = ui.loadTrainParametersFromUI();

    console.log("xtrain shape", xTrain.shape[1]);
    // Define the topology of the model: two dense layers.
    let model;
    if (modelData.config.complex) {
      model = getComplexModel(xTrain.shape[1]);
    } else {
      model = getBasicModel(xTrain.shape[1]);
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

    console.log("Loading model");
    const loadedModel = await tf.loadLayersModel(
      "indexeddb://" + projectName + "/model"
    );
    console.log("Saved model", model);
    console.log("Loaded model", loadedModel);
    console.log(
      "Saved prediction",
      model.predict(tf.tensor2d([[2.0, 2.0]], [1, xTrain.shape[1]])).print()
    );
    console.log(
      "Loaded prediction",
      loadedModel
        .predict(tf.tensor2d([[2.0, 2.0]], [1, xTrain.shape[1]]))
        .print()
    );

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
