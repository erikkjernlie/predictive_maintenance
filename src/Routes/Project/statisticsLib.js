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

export function getDatasetByColumns(dataset) {
    const numberOfColumns = dataset[0].length
    const columnsData = []
    for (var i = 0; i < numberOfColumns; i++) {
      const column = dataset.map(x => x[i])
      columnsData.push(column)
    }
    return columnsData
  }

export function getCovarianceMatrix(dataset) {
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

export function getReducedDataset(dataset) {
    const cov = getCovarianceMatrix(dataset)
    let clone = JSON.parse(JSON.stringify(dataset));
    for (var i = 0; i < dataset[0].length; i++) {
      for (var j = i+1; j < dataset[0].length; j++) {
        if (cov[i][j] > 0.90) {
          clone = clone.map(x => x.slice(0,i).concat(x.slice(i+1)));
        }
      }
    }
    return clone
  }

export function fillConfig(data, config) {
  Object.keys(data[0]).forEach(function (key) {
    let column = data.map(x => Number(x[key]));
    let mean_val = mean(column);
    let standardDeviation_val = standardDeviation(column);
    let max_val = max(column);
    let min_val = min(column);
    config.sensors[key]["mean"] = mean_val;
    config.sensors[key]["std"] = standardDeviation_val;
    config.sensors[key]["max"] = max_val;
    config.sensors[key]["min"] = min_val;
    config.sensors[key]["standardize"] = (x) => ((x - mean_val)/standardDeviation_val);
    config.sensors[key]["normalize"] = (x) => ((x - min_val)/(max_val - min_val));
  });
  console.log(config);
}

export function standardizeData(data) {
    const numberOfColumns = data[0].length
    const numberOfRows = data.length
    let meanvals = []
    let stdvals = []
    for (var k = 0; k < numberOfColumns; k++) {
      const col = data.map(x => x[k])
      meanvals.push(mean(col))
      stdvals.push(standardDeviation(col))
    }
    const standardized = []
    for (var i = 0; i < numberOfRows; i++) {
      const row = []
      for (var j = 0; j < numberOfColumns; j++) {
        row.push((data[i][j] - meanvals[j])/(stdvals[j]))
      }
      standardized.push(row)
    }
    return standardized
  }

export function normalizeData(data) {
    const numberOfColumns = data[0].length
    const numberOfRows = data.length
    let maxvals = []
    let minvals = []
    for (var k = 0; k < numberOfColumns; k++) {
      const col = data.map(x => x[k])
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

export function getR2Score(predict, data) {
    data = data.map(x => Number(x));
    predict = predict.map(x => Number(x))

    var meanValue = 0;
    var SStot = 0;
    var SSres = 0;
    var rSquared = 0;

    for (var n = 0; n < data.length; n++) { 
      meanValue += data[n];
    }
    meanValue = (meanValue / data.length);

    for (var m = 0; m < data.length; m++) {
      SStot += Math.pow(data[m] - meanValue, 2); 
      SSres += Math.pow(predict[m] - data[m], 2);
    }

    rSquared = 1 - (SSres / SStot);
    
    return {
        meanValue: meanValue,
        SStot: SStot,
        SSres: SSres,
        rSquared: rSquared
    };
  }

  export function shuffleData(data) {
    return shuffle(data)
  }

export default getR2Score