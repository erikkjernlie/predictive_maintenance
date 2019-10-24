import { storage } from "../../firebase";
import "./ProjectSetup.css";
import { csv } from "d3";
import * as tf from "@tensorflow/tfjs";

export function uploadData(data, project, progressMethod) {
    let rows_joined = data.map(x => x.join(","))
    let csvstr = rows_joined.join("\n")
    const csvblob = new Blob([csvstr], {type: "application/vnd.ms-excel"})
    const uploadTaskData = storage.ref(`${project}/data.csv`).put(csvblob);
    uploadTaskData.on(
      "state_changed",
      snapshot => {
        const progress = Math.round(
          (snapshot.bytesTransferred / snapshot.totalBytes) * 100
        );
        progressMethod(progress);
      },
      error => {
        console.log(error);
      });
  }

export function uploadConfig(config, project, progressMethod) {
    const configblob = new Blob([JSON.stringify(config)], { type: "application/json" });
    const uploadTaskConfig = storage.ref(`${project}/sensorData.json`).put(configblob);
    // observer for when the state changes, e.g. progress
    uploadTaskConfig.on(
      "state_changed",
      snapshot => {
        const progress = Math.round(
          (snapshot.bytesTransferred / snapshot.totalBytes) * 100
        );
        progressMethod(progress);
      },
      error => {
        console.log(error);
      });
  }

export function uploadConfigMod(config, project) {
    const configblob = new Blob([JSON.stringify(config)], { type: "application/json" });
    const uploadTaskConfig = storage.ref(`${project}/config_mod.json`).put(configblob);
    // observer for when the state changes, e.g. progress
    uploadTaskConfig.on(
      "state_changed",
      snapshot => {
        const progress = Math.round(
          (snapshot.bytesTransferred / snapshot.totalBytes) * 100
        );
      },
      error => {
        console.log(error);
      });
  }

export async function loadConfig(project, func) {
    const downloadRefConfig = storage.ref(`${project}/sensorData.json`);
    await downloadRefConfig.getDownloadURL().then(async url => {
      await fetch(url)
        .then(response => response.json())
        .then(jsonData => {
          console.log("loadConfig", jsonData);
          func(jsonData);
        });
    });
  }

export async function loadConfigMod(project, func) {
    const downloadRefConfig = storage.ref(`${project}/config_mod.json`);
    await downloadRefConfig.getDownloadURL().then(async url => {
      await fetch(url)
        .then(response => response.json())
        .then(jsonData => {
          console.log("loadConfig", jsonData);
          func(jsonData);
        });
    });
  }

export async function loadData(project, func) {
    const downloadRefData = storage.ref(`${project}/data.csv`);
    await downloadRefData.getDownloadURL().then(async url => {
      await csv(url).then(data => {
        console.log("loadData", data)
        func(data);
      });
    });
  }

export async function getTensorflowModel(project, setModel) {
    let model = await tf.loadLayersModel("indexeddb://" + project + "/model");
    setModel(model);
  }

export default uploadConfig