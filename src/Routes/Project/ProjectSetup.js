import React, { useState } from "react";
import { storage } from "../../firebase";
import "./ProjectSetup.css";
import { setTimeout } from "timers";
import { csv } from "d3";
import AddSensor from "../../Components/Sensor/AddSensor";
import CSVReader from "react-csv-reader";
import {
  useSensorData,
  useProjectName
} from "../../stores/sensors/sensorsStore";
import {
  setDatapoints,
  setSensors,
  setLiveFeedURL,
  createProjectName,
  setConfig
} from "../../stores/sensors/sensorsActions";
import { min } from "simple-statistics";
import { Checkbox } from "@material-ui/core";

const ProjectSetup = props => {
  const [file, setFile] = useState(null);
  const [progress, setProgress] = useState(0);

  const [uploading, setUploading] = useState(false);
  const [sensorNames, setSensorNames] = useState([]);
  const [selectedDataset, setSelectedDataset] = useState(false);
  const [startingTraining, setStartingTraining] = useState(false);

  const [hasDifferentValueRanges, setHasDifferentValueRanges] = useState(false);
  const [isComplex, setIsComplex] = useState(false);
  const [reduceTrainingTime, setReduceTrainingTime] = useState(false);

  const [lastStep, setLastStep] = useState(false);
  const [step2, setStep2] = useState(false);

  const sensorData = useSensorData();

  const projectName = useProjectName();

  const handleProjectName = e => {
    if (e.target.value) {
      createProjectName(e.target.value);
    }
  };

  const handleURL = e => {
    if (e.target.value) {
      setLiveFeedURL(e.target.value);
      setStep2(true);
    }
  };

  const startTraining = () => {
    setStartingTraining(true);
    console.log("start training with sensor data", sensorData);
    handleUpload();
  };

  const selectDataset2 = data => {
    console.log(data);
    setSelectedDataset(true);
    let sensorNames = data[0];
    setDatapoints(data);
    console.log(sensorNames);
    setSensorNames(sensorNames);
    setSensors(sensorNames);
    createProjectName(projectName);
    let tryingStuff = data.map(x => x.join(","))
    let tryingStuff2 = tryingStuff.join("\n")
    console.log("trying stuff", tryingStuff)
    console.log(tryingStuff2)
    setFile(tryingStuff2)
  }

  const selectDataset = data => {
    if (file !== null) {
      console.log(file);
      csv(file.name).then(data => {
        setSelectedDataset(true);

        let sensorNames = Object.keys(data[0]);
        setDatapoints(data);
        console.log(sensorNames);
        setSensorNames(sensorNames);
        setSensors(sensorNames);
        createProjectName(projectName);
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
    /*if (file === null || projectName.length === 0) {
      return;
    }*/
    setUploading(true);
    const fileData = JSON.stringify(sensorData);
    console.log("HERE COMES THE FILEDATA", fileData);
    console.log(file)
    const csvblob = new Blob([file], {type: "application/vnd.ms-excel"})
    const uploadTask = storage.ref(`${projectName}/data.csv`).put(csvblob);
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

        const blob = new Blob([fileData], { type: "application/json" });

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
        <div className="Setup__Option">
          Step 1: Choose a name for the project and set an URL for livefeed data
        </div>
        <div className="ProjectName">Choose a name for the project</div>
        <input onChange={handleProjectName} />
        <div className="ProjectName">Set an URL for livefeed data</div>
        <input onChange={handleURL} />
        {step2 && (
          <div>
            <CSVReader
              cssClass="react-csv-input"
              label="Select CSV"
              onFileLoaded={selectDataset2}
            />
            <div className="Setup__Option">Step 2: Upload dataset (.csv)</div>
            <div className="ProjectName">Choose your file </div>
            <div className="UploadDataset">
              <input type="file" onChange={handleChange} />
              <button onClick={selectDataset}>Use dataset</button>
            </div>
            {false && uploading && file && (
              <progress value={progress} max="100" />
            )}
          </div>
        )}
        {selectedDataset && (
          <React.Fragment>
            <div className="Setup__Option">
              Step 3: Choose values for sensors
            </div>
            <table>
              <tbody>
                <tr>
                  <th className="TableField">Sensor </th>
                  <th className="TableField">Input</th>
                  <th className="TableField">output</th>
                  <th className="TableField">internal sensor</th>
                  <th className="TableField">Unit</th>
                </tr>
                {sensorNames &&
                  sensorNames.map(sensor => (
                    <AddSensor key={sensor} sensor={sensor} />
                  ))}
              </tbody>
            </table>
            <button onClick={() => setLastStep(true)}>Set sensors</button>
          </React.Fragment>
        )}
        {lastStep && (
          <div>
            <div className="Setup__Option">Step 4: Describe your dataset</div>
            <div className="Setup__ProjectName">
              <div>
                Do the columns in the dataset have very different value ranges?
              </div>
              <Checkbox
                color="default"
                checked={hasDifferentValueRanges}
                onClick={() => changeDatasetFact("hasDifferentValueRanges")}
              />
            </div>
            <div className="Setup__ProjectName">
              <div>Is the very dataset very complex?</div>
              <Checkbox
                color="default"
                checked={isComplex}
                onClick={() => changeDatasetFact("isComplex")}
              />
            </div>
            <div className="Setup__ProjectName">
              <div>
                Do you want to reduce the training time by discarding covariant
                features?
              </div>
              <Checkbox
                color="default"
                checked={reduceTrainingTime}
                onClick={() => changeDatasetFact("reduceTrainingTime")}
              />
            </div>
            <button onClick={startTraining}>Start training your model</button>
            {startingTraining && <div>Loading...</div>}
          </div>
        )}
      </div>
    </div>
  );
};
export default ProjectSetup;
// 1. "My dataset has columns with very different value ranges" --> true: standardization, false: normalzation
// 2. "My dataset is very complex" --> true: flere/bredere lag, false: standard modell
// 3. "I want to reduce training time by discarding covariant features" --> true: discardColumns, false: ikke
