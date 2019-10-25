import "./TrainModel.css";
import * as tf from "@tensorflow/tfjs";

export function getFeatureTargetSplit(data, config) {
    const feats = config.input.concat(config.internal);
    const targs = config.output;
    console.log("feats", feats);
    console.log("targs", targs);
    let features = JSON.parse(JSON.stringify(data)); // deepcopy
    let targets = JSON.parse(JSON.stringify(data)); // deepcopy
    feats.forEach(feat => targets.forEach(x => delete x[feat]));
    targs.forEach(targ => features.forEach(x => delete x[targ]));
    return [features, targets];
  }

export function getTestTrainSplit(features, targets, test_train_split) {
    const numberOfRows = features.length;
    const numberOfTest = Math.round(numberOfRows * test_train_split);
    const numberOfTrain = numberOfRows - numberOfTest;

    const x_train = features.slice(0, numberOfTrain - 1);
    const x_test = features.slice(numberOfTrain - 1);
    const y_train = targets.slice(0, numberOfTrain - 1);
    const y_test = targets.slice(numberOfTrain - 1);
    return [x_train, x_test, y_train, y_test];
  }

export function convertToTensors(x_train, x_test, y_train, y_test) {
    const tensors = {};
    tensors.trainFeatures = tf.tensor2d(x_train);
    tensors.trainTargets = tf.tensor2d(y_train);
    tensors.testFeatures = tf.tensor2d(x_test);
    tensors.testTargets = tf.tensor2d(y_test);
    return tensors;
  }

export function getBasicModel(inputSize, outputSize, modelParams) {
    console.log("inputsize", inputSize, outputSize);
    const model = tf.sequential();
    model.add(
      tf.layers.dense({
        units: 10,
        activation: modelParams.activation,
        inputShape: [inputSize]
      })
    );
    model.add(
      tf.layers.dense({ units: outputSize, activation: modelParams.activation })
    );
    return model;
  }

export function getComplexModel(inputSize, outputSize, modelParams) {
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
      tf.layers.dense({ units: outputSize, activation: modelParams.activation })
    );
    return model;
  }

export default convertToTensors;