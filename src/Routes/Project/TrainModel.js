import React, { useState, useEffect } from "react";

import "./TrainModel.css";
import { Link } from "react-router-dom";

import * as tf from "@tensorflow/tfjs";
import * as tfvis from "@tensorflow/tfjs-vis";

import {
  getR2Score,
  normalizeData,
  standardizeData,
  getCovarianceMatrix,
  getReducedDataset,
  shuffleData,
  fillConfigWithDataValues,
  shouldStandardize
} from "./statisticsLib.js";
import {
  setDataPointsProcessed,
  setConfigProcessed
} from "../../stores/sensors/sensorsActions";

import { loadConfig, loadData, uploadProcessedConfig } from "./transferLib.js";

import {
  getFeatureTargetSplit,
  getTestTrainSplit,
  convertToTensors,
  getBasicModel,
  getComplexModel,
  getBasicModelWithRegularization,
  getComplexModelWithRegularization
} from "./machineLearningLib.js";

import DataInfo from "../../Components/Sensor/DataInfo";

// 1. "My dataset has columns with very different value ranges" --> true: standardization, false: normalzation
// 2. "My dataset is very complex" --> true: flere/bredere lag, false: standard modell
// 3. "I want to reduce training time by discarding covariant features" --> true: discardColumns, false: ikke

const modelParams = {
  test_train_split: 0.2,
  activation: "relu",
  learningRate: 0.01,
  epochs: 10,
  optimizer: tf.train.adam(0.01),
  loss: "meanSquaredError",
  min_R2_score: 0.5,
  decent_R2_score: 0.8,
  max_mean_diff: 100,
  max_std_diff: 10,
  cov_limit: 0.9,
  max_iterations: 4
};

const TrainModel = ({ match }) => {
  const [lastStep, setLastStep] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [dataInfo, setDataInfo] = useState({});
  const [hasTrained, setHasTrained] = useState(false);
  const [trainingFailed, setTrainingFailed] = useState(false);

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
  }

  useEffect(() => {
    async function startFetching() {
      await fetchData().then(function(val) {
        setHasLoaded(true);
        setDataInfo({
          input: configLocal.input.join(', '),
          output: configLocal.output,
          training: Math.floor(dataPointsLocal.length * (1 - modelParams.test_train_split)),
          testing: Math.ceil(dataPointsLocal.length * modelParams.test_train_split)
        });
        train(dataPointsLocal, configLocal);
      });
    }
    startFetching();
  }, []);

  // removes null-values
  function preprocessData(data) {
    data = data.filter(x => !Object.values(x).some(y => y === "" || y == null));
    return data;
  }

  async function train(data, configuration) {
    let useRegularization = false;
    data = preprocessData(data);
    fillConfigWithDataValues(data, configuration);
    data = shuffleData(data);
    let [features, targets] = getFeatureTargetSplit(data, configuration);
    if (configuration.reduceTrainingTime && configuration.input.length > 2) {
      features = getReducedDataset(features, modelParams.cov_limit);
    }

    let joinedData = [];
    for (var i = 0; i < features.length; i++) {
      joinedData.push(features[i].concat(targets[i]));
    }

    if (
      shouldStandardize(
        joinedData,
        modelParams.max_mean_diff,
        modelParams.max_std_diff
      )
    ) {
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

    console.log("train length", x_train.length)
    console.log("test length", x_test.length)
    

    const tensors = convertToTensors(x_train, x_test, y_train, y_test);

    let model;
    let predictions;
    let tempR2 = 0;
    let trainCounter = 0;
    while (tempR2 < modelParams.min_R2_score) {
      if (trainCounter > 1) {
        useRegularization = true;
      }
      model = await trainModel(
        tensors.trainFeatures,
        tensors.trainTargets,
        tensors.testFeatures,
        tensors.testTargets,
        configuration,
        useRegularization
      );
      predictions = model.predict(tensors.testFeatures);
      //console.log("PREDICT", predictions);
      tempR2 = getR2Score(predictions.arraySync(), y_test).rSquared;
      console.log("R2 score", tempR2);
      setR2(tempR2);
      if (!hasTrained) {
        setHasTrained(true);
      }
      trainCounter += 1;
      if (
        trainCounter > modelParams.max_iterations &&
        !(tempR2 >= modelParams.min_R2_score)
      ) {
        setTrainingFailed(true);
        break;
      }
    }

    if (tempR2 >= modelParams.min_R2_score) {
      await model.save("indexeddb://" + projectName + "/model").then(() => {
        console.log("Model saved to indexeddb");
      });
      uploadProcessedConfig(configLocal, projectName);
      setDataPointsProcessed(dataPointsLocal);
      setConfigProcessed(configLocal);
      setLastStep(true);
    }
  }

  async function trainModel(
    xTrain,
    yTrain,
    xTest,
    yTest,
    configuration,
    regularize
  ) {
    let model;
    if (configuration.isComplex) {
      if (regularize) {
        model = getComplexModel(xTrain.shape[1], yTrain.shape[1], modelParams);
      } else {
        model = getComplexModelWithRegularization(
          xTrain.shape[1],
          yTrain.shape[1],
          modelParams
        );
      }
    } else {
      if (regularize) {
        model = getBasicModel(xTrain.shape[1], yTrain.shape[1], modelParams);
      } else {
        model = getBasicModelWithRegularization(
          xTrain.shape[1],
          yTrain.shape[1],
          modelParams
        );
      }
    }
    model.summary();

    model.compile({
      optimizer: modelParams.optimizer,
      loss: modelParams.loss
    });

    const lossContainer = document.getElementById("lossCanvas");
    const callbacks = tfvis.show.fitCallbacks(lossContainer, ["loss"], {
      callbacks: ["onEpochEnd"]
    });
    await model.fit(xTrain, yTrain, {
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
        <h4>Training on the following data:</h4>
        {hasLoaded && dataInfo && <DataInfo info={dataInfo} />}
        <div>
          <h4>Loss</h4>
          <div className="canvases" id="lossCanvas"></div>
        </div>
        {hasTrained && (
          <div>
            <h4>R2 score: {R2}</h4>
            <p>
              The R2 score reflects the accuracy of the predictions on the test
              set. Perfect predictions will give an R2 score of 1, while always
              guessing the mean will give a score of 0. Anything lower than 0
              means the model performed worse than always guessing the mean.
            </p>
          </div>
        )}

        {R2 >= modelParams.decent_R2_score && (
          <div style={{ backgroundColor: "green", padding: "5px" }}>
            Training was successful
          </div>
        )}
        {R2 >= modelParams.min_R2_score && R2 < modelParams.decent_R2_score && (
          <div style={{ backgroundColor: "yellow", padding: "5px" }}>
            Training was successful, but with limited accuracy. Consider
            retraining your model by refreshing
          </div>
        )}
        {trainingFailed && (
          <div>
            <button
              className="buttonStyle"
              onClick={() => window.location.reload(false)}
            >
              Retry training
            </button>
          </div>
        )}
        {lastStep && (
          <div>
            <div>
              <button
                className="buttonStyle"
                onClick={() => window.location.reload(false)}
              >
                Retrain model
              </button>
            </div>
            <div>
              <Link to={"/" + projectName}>
                <button className="buttonStyle">
                  See data and visualization
                </button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TrainModel;
