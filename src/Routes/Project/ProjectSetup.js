import React, { useState } from "react";
import { storage } from "../../firebase";
import "./ProjectSetup.css";
import { setTimeout } from "timers";
import { csv } from "d3";
import AddSensor from "../../Components/Sensor/AddSensor";
import CSVReader from "react-csv-reader";
import { useConfig, useDataPoints } from "../../stores/sensors/sensorsStore";
import {
  setIsComplex,
  setReduceTrainingTime,
  setLiveFeedURL,
  setProjectName,
  setDataPoints,
  setSensorNames,
  setPredictedValueAbsoluteError,
  setPredictedValuePercentageError
} from "../../stores/sensors/sensorsActions";
import { min } from "simple-statistics";
import { Checkbox } from "@material-ui/core";
import { uploadData, uploadConfig } from "./transferLib.js";

const ProjectSetup = props => {
  const [progress, setProgress] = useState(0);

  const [uploading, setUploading] = useState(false);
  const [selectedDataset, setSelectedDataset] = useState(false);
  const [startingTraining, setStartingTraining] = useState(false);

  const [localIsComplex, setLocalIsComplex] = useState(false);
  const [localReduceTrainingTime, setLocalReduceTrainingTime] = useState(false);

  const [lastStep, setLastStep] = useState(false);
  const [step2, setStep2] = useState(false);
 
  const config = useConfig();
  const dataPoints = useDataPoints();

  const handleProjectName = e => {
    if (e.target.value) {
      setProjectName(e.target.value);
    }
  };

  const handleURL = e => {
    if (e.target.value) {
      setLiveFeedURL(e.target.value);
      setStep2(true);
    }
  };

  const startTraining = () => {
    if (config.output.length === 1) {
      setStartingTraining(true);
      handleUpload();
    } else {
      alert("Can only train with one output");
    }
  };

  const selectDataset = data => {
    setSelectedDataset(true);
    setDataPoints(data);
    setSensorNames(data[0]);
  };

  const handleUpload = () => {
    console.log(config);
    setUploading(true);
    uploadData(dataPoints, config["projectName"], setProgress);
    uploadConfig(config, config["projectName"], setProgress);
    setUploading(false);

    if (config.projectName.length > 0) {
      if (localStorage.getItem("projects")) {
        localStorage.setItem(
          "projects",
          localStorage.getItem("projects") + " " + config.projectName
        );
      } else {
        localStorage.setItem("projects", config.projectName);
      }
    }
    setTimeout(() => {
      props.history.push(config.projectName + "/configuration");
    }, 500);
  };

  const changeDatasetFact = id => {
    switch (id) {
      case "reduceTrainingTime":
        setReduceTrainingTime(!localReduceTrainingTime);
        setLocalReduceTrainingTime(!localReduceTrainingTime);
        break;
      case "isComplex":
        setIsComplex(!localIsComplex);
        setLocalIsComplex(!localIsComplex);
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
        <input onChange={handleURL} value="tvilling.digital" />
        {step2 && (
          <div>
            <div className="Setup__Option">Step 2: Upload dataset (.csv)</div>
            <div className="ProjectName">Choose your file </div>
            <CSVReader
              cssClass="react-csv-input"
              onFileLoaded={selectDataset}
            />
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
                  <th className="TableField">Min-value</th>
                  <th className="TableField">Max-value</th>
                </tr>
                {config.sensorNames &&
                  config.sensorNames.map(sensor => (
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
              <div>Is the very dataset very complex?</div>
              <Checkbox
                color="default"
                checked={localIsComplex}
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
                checked={localReduceTrainingTime}
                onClick={() => changeDatasetFact("reduceTrainingTime")}
              />
            </div>
            <div className="Setup__ProjectName">
              <div>
                On your predicted value, how much difference do you allow before
                you consider it a failure?
                <div className="sensorInput">
                  Percentage:{" "}
                  <input
                    type="number"
                    onChange={e =>
                      setPredictedValuePercentageError(e.target.value)
                    }
                  />
                </div>
                <div className="sensorInput">
                  Absolute:{" "}
                  <input
                    type="number"
                    onChange={e =>
                      setPredictedValueAbsoluteError(e.target.value)
                    }
                  />
                </div>
              </div>
            </div>
            <button className="buttonStyle" onClick={startTraining}>
              Start training your model
            </button>
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
