import createStore from "../createStore";
import useStoreState from "../useStoreState";

const store = createStore({
  models: [],
  fetching: false
});

export function useModels() {
  const { models } = useStoreState(store);
  return models;
}

export default store;
