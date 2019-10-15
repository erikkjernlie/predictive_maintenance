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
import { storage } from "../../firebase";

const TrainModel = ({ match }) => {
  const models = useModels();
  const sensors = useSensorNames();
  const { projectName } = match.params;

  // const dataPoints = useDataPoints();

  const [sensorNames, setSensorNames] = useState([]);
  const [dataPoints, setDatapoints] = useState([]);

  useEffect(() => {
    csv("/rig_good.csv").then(data => {
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

  async function train(data) {
    console.log(data);
    const dataset = data.map(x => Object.values(x).map(Number));

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
    console.log("PREDICT", model.predict(tensors.trainFeatures));
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
    const epochs = 2;
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

    /*model
      .predict(tf.tensor2d([[1261.0421142578125, 27.090818405151367]], [1, 2]))
      .print();*/

    const blob = new Blob([model], { type: "multipart/form-data" });

    const uploadTask2 = storage.ref(`${projectName}/`).put(blob);

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
