import createStore from "../createStore";
import useStoreState from "../useStoreState";

const store = createStore({
  sensors: [],
  fetching: false,
  data: [],
  sensorNames: [],
  dataPoints: []
});

export function useSensors() {
  const { sensors } = useStoreState(store);
  return sensors;
}

export function useData() {
  const { data } = useStoreState(store);
  console.log(data);

  return data;
}

export function useSensorNames() {
  const { sensorNames } = useStoreState(store);
  return sensorNames;
}

export function useDataPoints() {
  const { dataPoints } = useStoreState(store);
  return dataPoints;
}

export default store;