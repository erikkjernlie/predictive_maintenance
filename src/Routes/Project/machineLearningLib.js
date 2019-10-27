import "./TrainModel.css";
import * as tf from "@tensorflow/tfjs";

/*
export function getFeatureTargetSplit(data, config) {
  const feats = config.input.concat(config.internal);
  const targs = config.output;
  console.log("feats", feats);
  console.log("targs", targs);
  let features = JSON.parse(JSON.stringify(data)); // deepcopy
  let targets = JSON.parse(JSON.stringify(data)); // deepcopy
  console.log("FEATURES", features);
  feats.forEach(feat => targets.forEach(x => delete x[feat]));
  targs.forEach(targ => features.forEach(x => delete x[targ]));
  return [features, targets];
}
*/

export function getFeatureTargetSplit(dataset, config) {
  const inputs = config.input.concat(config.internal);
  const targets = dataset.map(x => [Number(x[config.output[0]])]);
  let features = [];
  dataset.forEach(function(dataRow) {
    let row = [];
    inputs.forEach(function(inputName) {
      row.push(Number(dataRow[inputName]));
    });
    transferedData.push(row);
  });
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

export function getModelWithRegularization(inputSize, outputSize, modelParams) {
  const model = tf.sequential();
  model.add(
    tf.layers.dense({
      kernelRegularizer: tf.regularizers.L1L2,
      units: 10,
      activation: modelParams.activation,
      inputShape: [inputSize]
    })
  );
  model.add(
    tf.layers.dense({ kernelRegularizer: tf.regularizers.L1L2, units: outputSize, activation: modelParams.activation })
  );
  return model;
}

export function getComplexModelWithRegularization(inputSize, outputSize, modelParams) {
  const model = tf.sequential();
  model.add(
    tf.layers.dense({
      kernelRegularizer: tf.regularizers.L1L2,
      units: 10,
      activation: modelParams.activation,
      inputShape: [inputSize]
    })
  );
  model.add(
    tf.layers.dense({
      kernelRegularizer: tf.regularizers.L1L2,
      units: 5,
      activation: modelParams.activation
    })
  );
  model.add(
    tf.layers.dense({ kernelRegularizer: tf.regularizers.L1L2, units: outputSize, activation: modelParams.activation })
  );
  return model;
}

export default convertToTensors;
