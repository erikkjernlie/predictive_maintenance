import { storage } from "../../firebase";
import "./ProjectSetup.css";
import { csv } from "d3";

export function uploadData(data, project, progressMethod) {
    const csvblob = new Blob([data], {type: "application/vnd.ms-excel"})
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
    const configblob = new Blob([config], { type: "application/json" });
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

export async function setConfig(project, configMethod) {
    const downloadRefConfig = storage.ref(`${project}/sensorData.json`);
    await downloadRefConfig.getDownloadURL().then(async url => {
      await fetch(url)
        .then(response => response.json())
        .then(async jsonData => {
          await configMethod(jsonData)
          console.log("config", jsonData);
        });
    });
  }

export async function setData(project, dataMethod, sensorsMethod) {
    const downloadRefData = storage.ref(`${project}/data.csv`);
    await downloadRefData.getDownloadURL().then(async url => {
      await csv(url).then(async data => {
        await sensorsMethod(Object.keys(data[0]));
        await dataMethod(data);
        console.log("data", data);
        console.log("sensors", Object.keys(data[0]));
      });
    });
  }

export default uploadConfig