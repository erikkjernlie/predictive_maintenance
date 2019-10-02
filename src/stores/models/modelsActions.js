import modelsStore from "./modelsStore";
import * as tf from "@tensorflow/tfjs";

export function fetchModels() {
  console.log("MODELS");
  modelsStore.setState({ fetching: true });

  return tf.loadLayersModel("http://localhost:8000/model").then(model => {
    const models = modelsStore.getState().models;
    models.push(model);
    modelsStore.setState({
      ...models
    });
  });
}
