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
  fillConfig,
  shouldStandardize
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
import DataInfo from "../../Components/Sensor/DataInfo";

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
  decent_R2_score: 0.8 // change this to a fair value
};

const TrainModel = ({ match }) => {
  const configProcessed = useConfigProcessed();
  const dataPointsProcessed = useDataPointsProcessed();
  const [lastStep, setLastStep] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [dataInfo, setDataInfo] = useState({});

  const [R2, setR2] = useState(-1000);

  let configLocal;
  let dataPointsLocal;

  function setConfigLocal(val) {
    configLocal = val;
  }

  function setDataPointsLocal(val) {
    dataPointsLocal = val;
  }

  const { projectName } = match.params;

  async function fetchData() {
    await loadConfig(projectName, setConfigLocal);
    await loadData(projectName, setDataPointsLocal);
    console.log("dataP", dataPointsLocal);
    console.log("conf", configLocal);
  }

  useEffect(async () => {
    await fetchData();
    console.log("Done fetching", configLocal)
    setHasLoaded(true);
    setDataInfo({
      input: configLocal.input.concat(configLocal.internal),
      output: configLocal.output,
      training: dataPointsLocal.length*(1-modelParams.test_train_split),
      testing: dataPointsLocal.length*(modelParams.test_train_split)
    })
    train(dataPointsLocal, configLocal);
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
      features = getReducedDataset(features)
    }
    console.log(shouldStandardize(features))
    if (shouldStandardize(features)) {
      console.log("features were standardized");
      features = standardizeData(features, configuration);
      configuration.differentValueRanges = true;
    } else {
      console.log("features were normalized");
      features = normalizeData(features, configuration);
      configuration.differentValueRanges = false;
    }
    
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
    await model.save("indexeddb://" + projectName + "/model").then(() => {
      console.log("Model saved to indexeddb");
    });
    uploadConfigMod(configLocal, projectName);
    setDataPointsProcessed(dataPointsLocal);
    setConfigProcessed(configLocal);
    setLastStep(true);
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

    const lossContainer = document.getElementById("lossCanvas");
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
    return model;
  }

  return (
    <div className="Sensors">
      <div>
        <div className="Configuration">Configuration</div>
        <div>Training on the following data:</div>
        {hasLoaded && dataInfo && (
          <DataInfo info={dataInfo}/>
        )}
        <div>
          <h4>Loss</h4>
          <div className="canvases" id="lossCanvas"></div>
        </div>
        {R2 >= modelParams.decent_R2_score && (
          <div style={{ backgroundColor: "green", padding: "5px" }}>
            Training was successful
          </div>
        )}
        {R2 >= modelParams.min_R2_score && R2 < modelParams.decent_R2_score && (
          <div style={{ backgroundColor: "yellow", padding: "5px" }}>
            Training was unsuccessful, but with limited accuracy. Consider retraining your model by refreshing
          </div>
        )}
        {lastStep && (
          <Link to={"/" + projectName}>
            <button className="buttonStyle">See data and visualization</button>
          </Link>
        )}
      </div>
    </div>
  );
};

export default TrainModel;
