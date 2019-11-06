import * as tf from "@tensorflow/tfjs";

export function getProcessedData(dataset, testSplit) {
  // TODO: GENERALIZE FOR SEVERAL, SELECTED OUTPUTS
  return tf.tidy(() => {
    const dataByClass = [];

    const classes = Object.keys(dataset[0]); // ["Load", "Dis..."]
    const targetsByClass = [];
    // const data = [{"Load": "sdasd", "Displacement": "aasd", ....}]

    const newDataset = dataset.map(point => Object.values(point)); // [[0.1, 0.2, 0.4], [...]]

    for (let i = 0; i < classes.length; ++i) {
      dataByClass.push([]);
      targetsByClass.push([]);
    }
    for (const row of newDataset) {
      const target = row[row.length - 1];
      const data = row.slice(0, row.length - 1);
      dataByClass[target].push(data);
      targetsByClass[target].push(target);
    }

    const xTrains = [];
    const yTrains = [];
    const xTests = [];
    const yTests = [];
    for (let i = 0; i < classes.length; ++i) {
      const [xTrain, yTrain, xTest, yTest] = convertToTensors(
        dataByClass[i],
        targetsByClass[i],
        testSplit,
        classes.length
      );
      xTrains.push(xTrain);
      yTrains.push(yTrain);
      xTests.push(xTest);
      yTests.push(yTest);
    }

    const concatAxis = 0;
    return [
      tf.concat(xTrains, concatAxis),
      tf.concat(yTrains, concatAxis),
      tf.concat(xTests, concatAxis),
      tf.concat(yTests, concatAxis)
    ];
  });
}

function convertToTensors(data, targets, testSplit, numberOfClasses) {
  const numExamples = data.length;
  if (numExamples !== targets.length) {
    throw new Error("data and split have different numbers of examples");
  }

  // Randomly shuffle `data` and `targets`.
  const indices = [];
  for (let i = 0; i < numExamples; ++i) {
    indices.push(i);
  }
  tf.util.shuffle(indices);

  const shuffledData = [];
  const shuffledTargets = [];
  for (let i = 0; i < numExamples; ++i) {
    shuffledData.push(data[indices[i]]);
    shuffledTargets.push(targets[indices[i]]);
  }

  // Split the data into a training set and a tet set, based on `testSplit`.
  const numTestExamples = Math.round(numExamples * testSplit);
  const numTrainExamples = numExamples - numTestExamples;

  const xDims = shuffledData[0].length;

  // Create a 2D `tf.Tensor` to hold the feature data.
  const xs = tf.tensor2d(shuffledData, [numExamples, xDims]);

  // Create a 1D `tf.Tensor` to hold the labels, and convert the number label
  // from the set {0, 1, 2} into one-hot encoding (.e.g., 0 --> [1, 0, 0]).
  const ys = tf.oneHot(tf.tensor1d(shuffledTargets).toInt(), numberOfClasses);

  // Split the data into training and test sets, using `slice`.
  const xTrain = xs.slice([0, 0], [numTrainExamples, xDims]);
  const xTest = xs.slice([numTrainExamples, 0], [numTestExamples, xDims]);
  const yTrain = ys.slice([0, 0], [numTrainExamples, numberOfClasses]);
  const yTest = ys.slice([0, 0], [numTestExamples, numberOfClasses]);
  return [xTrain, yTrain, xTest, yTest];
}

export default getProcessedData;
