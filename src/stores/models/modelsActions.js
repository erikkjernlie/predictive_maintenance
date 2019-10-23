import modelsStore from "./modelsStore";
import * as tf from "@tensorflow/tfjs";

export const rootAPI = "http://tvilling.digital:1337";

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

export async function fetchTopics() {
  let topics = getJSONResponse(rootAPI + "/topics/");
  console.log("TOPICS", topics);
  return topics;
}

export function deepCopy(object) {
  return JSON.parse(JSON.stringify(object));
}

export async function getJSONResponse(link) {
  let jsonResponse;
  try {
    const response = await fetch(link);
    jsonResponse = await response.json();
  } catch (error) {
    console.log(error);
    return false;
  }
  return jsonResponse;
}

export async function subscribeToSource(sourceId) {
  await fetch(rootAPI + "/topics/" + sourceId + "/subscribe", {
    credentials: "include"
  });
}

export async function fetchAuthCookie() {
  await fetch("http://tvilling.digital:1337" + "/session", {
    credentials: "include"
  });
}
