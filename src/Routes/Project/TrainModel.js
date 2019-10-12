import React, { useState, useEffect } from "react";
import { useModels } from "../../stores/models/modelsStore";
import {
  useSensorNames,
  useDataPoints
} from "../../stores/sensors/sensorsStore";
import "./TrainModel.css";
import Sensor from "../../Components/Sensor/Sensor";
import { Link } from "react-router-dom";

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

  function getRSquared(predict, data) {
    console.log("Inside getRSquared function")
    console.log(predict)
    console.log(data)
    var yAxis = data.map(x => Number(x));
    predict = predict.map(x => Number(x))
    var rPrediction = [];

    var meanValue = 0; // MEAN VALUE
    var SStot = 0; // THE TOTAL SUM OF THE SQUARES
    var SSres = 0; // RESIDUAL SUM OF SQUARES
    var rSquared = 0;

    // SUM ALL VALUES
    for (var n = 0; n < yAxis.length; n++) { 
      meanValue += yAxis[n];
    }
    // GET MEAN VALUE 
    meanValue = (meanValue / yAxis.length);
    
    for (var n = 0; n < yAxis.length; n++) {
      // CALCULATE THE SSTOTAL    
      SStot += Math.pow(yAxis[n] - meanValue, 2); 
      // REGRESSION PREDICTION
      rPrediction.push(predict[n]);
      // CALCULATE THE SSRES
      SSres += Math.pow(rPrediction[n] - yAxis[n], 2);
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

  function shuffle(array) {
    var currentIndex = array.length, temporaryValue, randomIndex;
  
    // While there remain elements to shuffle...
    while (0 !== currentIndex) {
  
      // Pick a remaining element...
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex -= 1;
  
      // And swap it with the current element.
      temporaryValue = array[currentIndex];
      array[currentIndex] = array[randomIndex];
      array[randomIndex] = temporaryValue;
    }
  
    return array;
  }

  async function train(data) {
    console.log(data);
    let dataset = data.map(x => Object.values(x).map(Number));
    dataset = shuffle(dataset)

    // const [xTrain, yTrain, xTest, yTest] = getProcessedData(dataset, 0.15);
    const numberOfColumns = Object.keys(data[0]).length;
    const numberOfRows = dataset.length;
    console.log(dataset);
    const features = dataset.map(x => x.slice(0, numberOfColumns - 1));
    const targets = dataset.map(x => x.slice(numberOfColumns - 1));

    const test_train_split = 0.2;

    const numberOfTest = Math.round(numberOfRows * test_train_split);
    const numberOfTrain = numberOfRows - numberOfTest;

    const x_train = features.slice(0, numberOfTrain - 1);
    const x_test = features.slice(numberOfTrain - 1);
    const y_train = targets.slice(0, numberOfTrain - 1);
    const y_test = targets.slice(numberOfTrain - 1);

    const tensors = {};

    tensors.trainFeatures = tf.tensor2d(x_train);
    tensors.trainTargets = tf.tensor2d(y_train);
    tensors.testFeatures = tf.tensor2d(x_test);
    tensors.testTargets = tf.tensor2d(y_test);

    // const [xTrain, yTrain, xTest, yTest] = data.getIrisData(0.15);
    // console.log(xTrain, xTest);
    console.log("X_TRAIN", x_train);
    console.log("TENSORS", tensors);

    const model = await trainModel(
      tensors.trainFeatures,
      tensors.trainTargets,
      tensors.testFeatures,
      tensors.testTargets
    );
    const predictions = model.predict(tensors.testFeatures)
    console.log("PREDICT", predictions);
    console.log("R2 score: ", getRSquared(predictions.arraySync(), y_test))
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
