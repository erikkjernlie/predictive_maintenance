import React, { useState, useEffect } from "react";
import { useModels } from "../../stores/models/modelsStore";
import {
  useSensorNames,
  useDataPoints
} from "../../stores/sensors/sensorsStore";
import "./TrainModel.css";
import Sensor from "../../Components/Sensor/Sensor";
import { Link } from "react-router-dom";
import {
  shuffle,
  sampleCovariance,
  max,
  min,
  sum,
  mean,
  standardDeviation,
  sampleStandardDeviation,
  sampleCorrelation
} from 'simple-statistics'

import { csv } from "d3";

import * as tf from "@tensorflow/tfjs";
import * as tfvis from "@tensorflow/tfjs-vis";
import * as data from "./data";
import getProcessedData from "./processData";

const TrainModel = ({ match }) => {
  const models = useModels();
  const sensors = useSensorNames();
  const { projectName } = match.params;

  // const dataPoints = useDataPoints();

  const [sensorNames, setSensorNames] = useState([]);
  const [dataPoints, setDatapoints] = useState([]);

  useEffect(() => {
    csv("/iris_mod_extended.csv").then(data => {
      let sensorNames = Object.keys(data[0]);
      setSensorNames(sensorNames);
      setDatapoints(data);

      train(data);
    });

    /*
    const dataset = tf.data.csv(
      "https://firebasestorage.googleapis.com/v0/b/tpk4450-project.appspot.com/o/rig_good.csv?alt=media&token=9792ce1c-7196-4a0d-80c2-f83ad35d7744"
    );
    const dataset2 = tf.data.csv("./rig_good.csv");
    console.log("TF DATA", dataset2);
    */
  }, []);

  function getR2Score(predict, data) {
    console.log("Inside getRSquared function")
    console.log(predict)
    console.log(data)
    data = data.map(x => Number(x));
    predict = predict.map(x => Number(x))

    var meanValue = 0; // MEAN VALUE
    var SStot = 0; // THE TOTAL SUM OF THE SQUARES
    var SSres = 0; // RESIDUAL SUM OF SQUARES
    var rSquared = 0;

    // SUM ALL VALUES
    for (var n = 0; n < data.length; n++) { 
      meanValue += data[n];
    }
    // GET MEAN VALUE 
    meanValue = (meanValue / data.length);

    for (var n = 0; n < data.length; n++) {
      // CALCULATE THE SSTOTAL
      SStot += Math.pow(data[n] - meanValue, 2); 
      // CALCULATE THE SSRES
      SSres += Math.pow(predict[n] - data[n], 2);
    }

    // R SQUARED
    rSquared = 1 - (SSres / SStot);
    
    return {
        meanValue: meanValue,
        SStot: SStot,
        SSres: SSres,
        rSquared: rSquared
    };
  }

  function getFeatureTargetSplit(dataset) {
    const numberOfColumns = Object.keys(dataset[0]).length;
    
    const features = dataset.map(x => x.slice(0, numberOfColumns - 1));
    const targets = dataset.map(x => x.slice(numberOfColumns - 1));
    return [features, targets]
  }

  function getTestTrainSplit(features, targets, test_train_split) {
    const numberOfRows = features.length;
    const numberOfTest = Math.round(numberOfRows * test_train_split);
    const numberOfTrain = numberOfRows - numberOfTest;

    const x_train = features.slice(0, numberOfTrain - 1);
    const x_test = features.slice(numberOfTrain - 1);
    const y_train = targets.slice(0, numberOfTrain - 1);
    const y_test = targets.slice(numberOfTrain - 1);
    return [x_train, x_test, y_train, y_test]
  }

  function convertToTensors(x_train, x_test, y_train, y_test) {
    const tensors = {};
    tensors.trainFeatures = tf.tensor2d(x_train);
    tensors.trainTargets = tf.tensor2d(y_train);
    tensors.testFeatures = tf.tensor2d(x_test);
    tensors.testTargets = tf.tensor2d(y_test);
    return tensors
  }

  function normalizeData(data) {
    const numberOfColumns = data[0].length
    const numberOfRows = data.length
    let maxvals = []
    let minvals = []
    for (var i = 0; i < numberOfColumns; i++) {
      const col = data.map(x => x[i])
      maxvals.push(max(col))
      minvals.push(min(col))
    }
    const normalized = []
    for (var i = 0; i < numberOfRows; i++) {
      const row = []
      for (var j = 0; j < numberOfColumns; j++) {
        row.push((data[i][j] - minvals[j])/(maxvals[j]-minvals[j]))
      }
      normalized.push(row)
    }
    return normalized
  }

  function standardizeData(dataset) {
    const numberOfColumns = dataset[0].length
    const numberOfRows = dataset.length
    let meanvals = []
    let stdvals = []
    for (var i = 0; i < numberOfColumns; i++) {
      const col = dataset.map(x => x[i])
      meanvals.push(mean(col))
      stdvals.push(standardDeviation(col))
    }
    const standardized = []
    for (var i = 0; i < numberOfRows; i++) {
      const row = []
      for (var j = 0; j < numberOfColumns; j++) {
        row.push((dataset[i][j] - meanvals[j])/(stdvals[j]))
      }
      standardized.push(row)
    }
    return standardized
  }

  function getDatasetByColumns(dataset) {
    const numberOfColumns = dataset[0].length
    const numberOfRows = dataset.length
    const columnsData = []
    for (var i = 0; i < numberOfColumns; i++) {
      const column = dataset.map(x => x[i])
      columnsData.push(column)
    }
    return columnsData
  }

  function getCovarianceMatrix(dataset) {
    const columnData = getDatasetByColumns(dataset)
    const numberOfColumns = columnData.length
    const covariances = []
    for (var i = 0; i < numberOfColumns; i++) {
      const covariances_column_i = []
      for (var j = 0; j < numberOfColumns; j++) {
        covariances_column_i.push(sampleCorrelation(columnData[i], columnData[j]))
      }
      covariances.push(covariances_column_i)
    }
    return covariances
  }

  async function train(data) {
    console.log(data);
    let dataset = data.map(x => Object.values(x).map(Number));
    dataset = shuffle(dataset)
    const test_train_split = 0.2;
    console.log("Covariance matrix", getCovarianceMatrix(dataset))
    const [features, targets] = getFeatureTargetSplit(dataset)
    const normalizedFeatures = normalizeData(features)
    const standardizedFeatures = standardizeData(features)
    const [x_train, x_test, y_train, y_test] = getTestTrainSplit(standardizedFeatures, targets, test_train_split)
    const tensors = convertToTensors(x_train, x_test, y_train, y_test);
    console.log("x train", x_train)
    console.log("x test", x_test)
    console.log("y train", y_train)
    console.log("y test", y_test)
    
    const model = await trainModel(
      tensors.trainFeatures,
      tensors.trainTargets,
      tensors.testFeatures,
      tensors.testTargets
    );
    const predictions = model.predict(tensors.testFeatures)
    console.log("PREDICT", predictions);
    console.log("R2 score: ", getR2Score(predictions.arraySync(), y_test))
  }

  async function trainModel(xTrain, yTrain, xTest, yTest) {

    console.log("Start training");
    // const params = ui.loadTrainParametersFromUI();

    // Define the topology of the model: two dense layers.
    const model = tf.sequential();
    model.add(
      tf.layers.dense({
        units: 10,
        activation: "relu",
        inputShape: [xTrain.shape[1]]
      })
    );
    model.add(
      tf.layers.dense({
        units: 5,
        activation: "relu"
      })
    );
    model.add(tf.layers.dense({ units: 1, activation: "relu" }));
    model.summary();

    // learningrate
    const learningRate = 0.01;
    const epochs = 20;
    const optimizer = tf.train.adam(learningRate);
    model.compile({
      optimizer: optimizer,
      loss: "meanSquaredError"
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
      epochs: epochs,
      validationData: [xTest, yTest],
      callbacks: callbacks
    });
    console.log("PREDICTING");

    // 1261.0421142578125,27.090818405151367,4.955190658569336

    model
      .predict(tf.tensor2d([[1.0, 4.0, 2.0]], [1, 3]))
      .print();

    // SAVE MODEL TO FIRESTORE AND TO STORE IN APPLICATION SO IT CAN PREDICT ELSEWHERE

    // model.predict(tf.tensor2d([[5.1111, 3.50004, 1.4303]], [1, 3])).print();
    // nconst secPerEpoch = (performance.now() - beginMs) / (1000 * epochs);
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
