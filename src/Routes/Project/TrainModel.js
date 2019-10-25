import React, { useState, useEffect } from "react";
import { useModels } from "../../stores/models/modelsStore";
import {
  useConfigProcessed,
  useDataPointsProcessed
} from "../../stores/sensors/sensorsStore";
import "./TrainModel.css";
import { Link } from "react-router-dom";

import * as tf from "@tensorflow/tfjs";
import * as tfvis from "@tensorflow/tfjs-vis";
import {
  getR2Score,
  normalizeData,
  standardizeData,
  getCovarianceMatrix,
  getDatasetByColumns,
  getReducedDataset,
  shuffleData,
  fillConfig
} from "./statisticsLib.js";
import {
  setDataPointsProcessed,
  setConfigProcessed
} from "../../stores/sensors/sensorsActions";
import { loadConfig, loadData, uploadConfigMod } from "./transferLib.js";
import {
  getFeatureTargetSplit,
  getTestTrainSplit,
  convertToTensors,
  getBasicModel,
  getComplexModel
} from "./machineLearningLib.js";

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
  min_R2_score: 0.5,
  decent_R2_score: 0.75 // change this to a fair value
};

const TrainModel = ({ match }) => {
  const configProcessed = useConfigProcessed();
  const dataPointsProcessed = useDataPointsProcessed();

  const [R2, setR2] = useState(-1000);

  let config;
  let dataPoints;

  function setConf(val) {
    config = val;
  }

  function setDataP(val) {
    dataPoints = val;
  }

  const { projectName } = match.params;

  async function fetchData() {
    await loadConfig(projectName, setConf);
    await loadData(projectName, setDataP);
    console.log("dataP", dataPoints);
    console.log("conf", config);
  }

  useEffect(async () => {
    await fetchData();
    train(dataPoints, config);
  }, []);

  function preprocessData(data) {
    // TODO:
    // remove outliers
    // remove Null-values
    return data;
  }

  async function train(data, configuration) {
    console.log("data, inside train", data);
    data = preprocessData(data);
    fillConfig(data, configuration);
    data = shuffleData(data);
    console.log("data shuffled", data);
    let [features, targets] = getFeatureTargetSplit(data, configuration);
    features = features.map(x => Object.values(x).map(y => Number(y)));
    targets = targets.map(x => Object.values(x).map(y => Number(y)));
    console.log("features", features);
    console.log("targets", targets);
    console.log("Covariance matrix", getCovarianceMatrix(features));
    if (configuration.reduceTrainingTime) {
      //features = getReducedDataset(features)
    }
    /*
    if (!configuration.differentValueRanges) {
      features = standardizeData(features, configuration);
    } else {
      features = normalizeData(features, configuration);
    }
    */
    console.log("features, processed", features);
    console.log("targets, processed", targets);
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
    let model;
    let predictions;
    let tempR2 = -1000;
    while (tempR2 < modelParams.min_R2_score) {
      model = await trainModel(
        tensors.trainFeatures,
        tensors.trainTargets,
        tensors.testFeatures,
        tensors.testTargets,
        configuration
      );
      predictions = model.predict(tensors.testFeatures);
      //console.log("PREDICT", predictions);
      tempR2 = getR2Score(predictions.arraySync(), y_test).rSquared;
      console.log("R2 score", tempR2);
      setR2(tempR2);
    }
    uploadConfigMod(config, config.projectName);
    setDataPointsProcessed(dataPoints);
    setConfigProcessed(config);
  }

  async function trainModel(xTrain, yTrain, xTest, yTest, configuration) {
    // console.log("Start training");
    // const params = ui.loadTrainParametersFromUI();

    console.log("xtrain shape", xTrain.shape[1]);
    // Define the topology of the model: two dense layers.
    let model;
    if (configuration.isComplex) {
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
      <div>
        <div>Configuration</div>
        <div>Start training TrainModel</div>
        {R2 >= modelParams.decent_R2_score && (
          <div style={{ backgroundColor: "green", padding: "5px" }}>
            Your training turned out fine.
          </div>
        )}
        {R2 >= modelParams.min_R2_score && R2 < modelParams.decent_R2_score && (
          <div style={{ backgroundColor: "yellow", padding: "5px" }}>
            Your training is not very good - try to change some settings.
          </div>
        )}
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
    </div>
  );
};

export default TrainModel;
