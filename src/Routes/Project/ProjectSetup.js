import React, { useState } from "react";
import { storage } from "../../firebase";
import "./ProjectSetup.css";
import { setTimeout } from "timers";
import { csv } from "d3";
import AddSensor from "../../Components/Sensor/AddSensor";
import {
  useSensorData,
  useProjectName
} from "../../stores/sensors/sensorsStore";
import {
  setDatapoints,
  setSensors,
  setLiveFeedURL,
  setProjectName,
  setConfig
} from "../../stores/sensors/sensorsActions";
import { min } from "simple-statistics";
import { Checkbox } from "@material-ui/core";

const ProjectSetup = props => {
  const [file, setFile] = useState(null);
  const [progress, setProgress] = useState(0);

  const [uploading, setUploading] = useState(false);
  const [sensorNames, setSensorNames] = useState([]);

  const [hasDifferentValueRanges, setHasDifferentValueRanges] = useState(false);
  const [isComplex, setIsComplex] = useState(false);
  const [reduceTrainingTime, setReduceTrainingTime] = useState(false);

  const sensorData = useSensorData();

  const projectName = useProjectName();

  const handleProjectName = e => {
    if (e.target.value) {
      setProjectName(e.target.value);
    }
  };

  const handleURL = e => {
    if (e.target.value) {
      setLiveFeedURL(e.target.value);
    }
  };

  const startTraining = () => {
    console.log("start training with sensor data", sensorData);
    handleUpload();
  };

  const selectDataset = () => {
    console.log(file);
    if (file !== null) {
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
    const fileData = JSON.stringify(sensorData);
    console.log("HERE COMES THE FILEDATA", fileData);
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

  const changeDatasetFact = id => {
    switch (id) {
      case "reduceTrainingTime":
        setConfig("reduceTrainingTime", !reduceTrainingTime);
        setReduceTrainingTime(!reduceTrainingTime);
        break;
      case "isComplex":
        setConfig("isComplex", !isComplex);

        setIsComplex(!isComplex);

        break;
      case "hasDifferentValueRanges":
        setConfig("hasDifferentValueRanges", !hasDifferentValueRanges);
        setHasDifferentValueRanges(!hasDifferentValueRanges);

        break;
      default:
        break;
    }
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
        <div className="ProjectName">Set a URL for livefeedData</div>
        <input onChange={handleURL} />
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
        </React.Fragment>
        <div>
          <div>
            Do the columns in the dataset have very different value ranges?
          </div>
          <Checkbox
            checked={hasDifferentValueRanges}
            onClick={() => changeDatasetFact("hasDifferentValueRanges")}
          />
        </div>
        <div>
          <div>Is the very dataset very complex?</div>
          <Checkbox
            checked={isComplex}
            onClick={() => changeDatasetFact("isComplex")}
          />
        </div>
        <div>
          <div>
            Do you want to reduce the training time by discarding covariant
            features?
          </div>
          <Checkbox
            checked={reduceTrainingTime}
            onClick={() => changeDatasetFact("reduceTrainingTime")}
          />
        </div>
        <button onClick={startTraining}>Continue to train model</button>
      </div>
    </div>
  );
};
export default ProjectSetup;
// 1. "My dataset has columns with very different value ranges" --> true: standardization, false: normalzation
// 2. "My dataset is very complex" --> true: flere/bredere lag, false: standard modell
// 3. "I want to reduce training time by discarding covariant features" --> true: discardColumns, false: ikke
