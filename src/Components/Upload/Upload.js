import React, { Component, useState } from "react";
import { storage } from "../../firebase";
import { Link, Redirect } from "react-router-dom";
import ExistingProjects from "../ExistingProjects/ExistingProjects";
import "./Upload.css";
import { setTimeout } from "timers";
import { csv } from "d3";
import CSVReader from "react-csv-reader";
import AddSensor from "../Sensor/AddSensor";
import { useSensorData } from "../../stores/sensors/sensorsStore";
import { setDatapoints, setSensors } from "../../stores/sensors/sensorsActions";
import { min } from "simple-statistics";

const Upload = props => {
  const [file, setFile] = useState(null);
  const [url, setUrl] = useState("");
  const [progress, setProgress] = useState(0);
  const [projectName, setProjectName] = useState("");
  const [file1, setFile1] = useState(null);

  const [file2, setFile2] = useState(null);

  const [uploading, setUploading] = useState(false);
  const [selectedDataset, setSelectedDataset] = useState(false);
  const [sensorNames, setSensorNames] = useState([]);

  const sensorData = useSensorData();

  const handleProjectName = e => {
    if (e.target.value) {
      setProjectName(e.target.value);
    }
  };

  const loadData = data => {
    console.log(data);
  };

  const startTraining = () => {
    console.log("start training with sensor data", sensorData);
    handleUpload();
  };

  const selectDataset = () => {
    console.log(file);
    if (file !== null) {
      setSelectedDataset(true);
      console.log(file);
      csv(file.name).then(data => {
        let sensorNames = Object.keys(data[0]);
        setDatapoints(data);
        console.log(sensorNames);
        setSensorNames(sensorNames);
        setSensors(sensorNames);
        setProjectName(projectName);
        console.log("MIN", min(data.map(point => point["Load"])));
      });
    }
  };

  const handleChange = e => {
    if (e.target.files[0]) {
      const file = e.target.files[0];
      // setFile(file) ??
      setFile(file);
    }
  };

  const handleChangeMultiple = e => {
    if (e.target.files[0]) {
      const file1 = e.target.files[0];
      setFile(file1);
    }
    if (e.target.files[1]) {
      const file2 = e.target.files[1];
      setFile(file2);
    }
  };

  const handleUpload = () => {
    if (file === null || projectName.length === 0) {
      return;
    }
    setUploading(true);
    const uploadTask = storage.ref(`${projectName}/data.csv`).put(file);
    // observer for when the state changes, e.g. progress
    uploadTask.on(
      "state_changed",
      snapshot => {
        const progress = Math.round(
          (snapshot.bytesTransferred / snapshot.totalBytes) * 100
        );
        setProgress(progress);
      },
      error => {
        console.log(error);
      },
      () => {
        // complete function ....

        const fileData = JSON.stringify(sensorData);
        const blob = new Blob([fileData], { type: "text/plain" });

        const uploadTask2 = storage
          .ref(`${projectName}/sensorData.json`)
          .put(blob);
        // observer for when the state changes, e.g. progress
        uploadTask2.on(
          "state_changed",
          snapshot => {
            const progress = Math.round(
              (snapshot.bytesTransferred / snapshot.totalBytes) * 100
            );
            setProgress(progress);
          },
          error => {
            console.log(error);
          },
          () => {
            // complete function ....
            setUploading(true); // false???

            // add project
            if (projectName.length > 0) {
              if (localStorage.getItem("projects")) {
                localStorage.setItem(
                  "projects",
                  localStorage.getItem("projects") + " " + projectName
                );
              } else {
                localStorage.setItem("projects", projectName);
              }
            }
            setTimeout(() => {
              props.history.push(projectName + "/configuration");
            }, 500);
          }
        );
        // done uploading
      }
    );
  };

  return (
    <div className="Container">
      <div className="NewProject">Create new project</div>
      <div className="Project">
        <div className="Option">Option 1: Upload dataset (.csv)</div>
        <div className="ProjectName">
          Choose a name for the project and upload dataset (.csv)
        </div>
        <input onChange={handleProjectName} />
        {uploading && file && <progress value={progress} max="100" />}
        <br />
        <input type="file" onChange={handleChange} />
        <button onClick={selectDataset}>Load dataset</button>
        <React.Fragment>
          <div className="NewProject__description">
            Choose values for sensors
          </div>
          <table>
            <tbody>
              <tr>
                <th>Sensor </th>
                <th>Input</th>
                <th>output</th>
                <th>internal sensor</th>
                <th>Unit</th>
              </tr>
              {sensorNames &&
                sensorNames.map(sensor => (
                  <AddSensor key={sensor} sensor={sensor} />
                ))}
            </tbody>
          </table>
          <button onClick={startTraining}>Continue to train model</button>
        </React.Fragment>
      </div>
    </div>
  );
};
export default Upload;
