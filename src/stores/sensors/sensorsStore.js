import createStore from "../createStore";
import useStoreState from "../useStoreState";

const store = createStore({
  dataPoints: [],
  dataPointsProcessed: [],
  config: {
    input: [],
    output: [],
    internal: [],
    sensors: [],
    sensorNames: [],
    projectName: "",
    URLtoLiveFeed: "",
    differentValueRanges: false, 
    reduceTrainingTime: false,
    isComplex: false,
    data: [],
  },
  configProcessed: {
    input: [],
    output: [],
    internal: [],
    sensors: [],
    sensorNames: [],
    projectName: "",
    URLtoLiveFeed: "",
    differentValueRanges: false, 
    reduceTrainingTime: false,
    isComplex: false,
    data: [],
  }
});

export function useDataPoints() {
  const { dataPoints } = useStoreState(store);
  return dataPoints;
}

export function useConfig() {
  const { config } = useStoreState(store);
  return config;
}

export function useDataPointsProcessed() {
  const { dataPointsProcessed } = useStoreState(store);
  return dataPointsProcessed;
}

export function useConfigProcessed() {
  const { configProcessed } = useStoreState(store);
  return configProcessed;
}

export default store;
