import React, { useState, useEffect } from "react";
import { useModels } from "../../stores/models/modelsStore";
import { useSensorNames } from "../../stores/sensors/sensorsStore";
import "./Sensors.css";

import { csv } from "d3";

import * as tf from "@tensorflow/tfjs";
import * as tfvis from "@tensorflow/tfjs-vis";
import * as data from "./data";

const Sensors = props => {
  const [sensorNames, setSensorNames] = useState([]);
  const [dataPoints, setDatapoints] = useState([]);

  // TODO: NEXT STEP IS TO MAKE A LIST OF SENSORS: sensorName: { sensorName, unit, type },

  useEffect(() => {
    csv("/rig_good.csv").then(data => {
      let sensorNames = Object.keys(data[0]);
      console.log(sensorNames);
      let dataPoints = data.slice(1);
      setSensorNames(sensorNames);
      setDatapoints(dataPoints);
      console.log(dataPoints);
      train();
    });

    const dataset = tf.data.csv(
      "https://firebasestorage.googleapis.com/v0/b/tpk4450-project.appspot.com/o/rig_good.csv?alt=media&token=9792ce1c-7196-4a0d-80c2-f83ad35d7744"
    );
    const dataset2 = tf.data.csv("./rig_good.csv");
    console.log("TF DATA", dataset2);
  }, []);

  async function train() {
    console.log("train model");
    const [xTrain, yTrain, xTest, yTest] = data.getIrisData(0.15);
    console.log(xTrain, xTest);

    const model = await trainModel(xTrain, yTrain, xTest, yTest);
    console.log("PREDICT", model.predict(xTest));
  }

  async function trainModel(xTrain, yTrain, xTest, yTest) {
    console.log("Start training");
    // const params = ui.loadTrainParametersFromUI();

    // Define the topology of the model: two dense layers.
    const model = tf.sequential();
    model.add(
      tf.layers.dense({
        units: 10,
        activation: "sigmoid",
        inputShape: [xTrain.shape[1]]
      })
    );
    model.add(tf.layers.dense({ units: 3, activation: "softmax" }));
    model.summary();

    // learningrate
    const learningRate = 0.01;
    const epochs = 100;
    const optimizer = tf.train.adam(learningRate);
    model.compile({
      optimizer: optimizer,
      loss: "categoricalCrossentropy",
      metrics: ["accuracy"]
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
    // nconst secPerEpoch = (performance.now() - beginMs) / (1000 * epochs);
    return model;
  }

  return (
    <div className="Sensors">
      <div>
        <h4>Loss</h4>
        <div className="canvases" id="lossCanvas"></div>
      </div>
      <div>
        <h4>Accuracy</h4>
        <div className="canvases" id="accuracyCanvas"></div>
      </div>
    </div>
  );
};

export default Sensors;
