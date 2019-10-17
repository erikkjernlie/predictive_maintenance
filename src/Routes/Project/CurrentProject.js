import React, { useEffect, useState } from "react";
import {
  useDataPoints,
  useSensorNames,
  useProjectName
} from "../../stores/sensors/sensorsStore";
import { storage } from "../../firebase";
import MySocket from "../../Components/Livestream/MySocket";

import { csv } from "d3";
import "./CurrentProject.css";
import {
  setDatapoints,
  setSensors,
  setProjectName
} from "../../stores/sensors/sensorsActions";
import Sensor from "../../Components/Sensor/Sensor";
import { Redirect } from "react-router-dom";

const CurrentProject = ({ match }) => {
  const dataPoints = useDataPoints();
  const sensorNames = useSensorNames();
  // PROJECTNAME const p = useSensorNames();
  const { projectName } = match.params;
  const [currentSensor, setCurrentSensor] = useState(sensorNames[0]);

  const [loading, setLoading] = useState(false);

  const lastLoadedProjectName = useProjectName();

  useEffect(() => {
    console.log("LAST LOADED", projectName, lastLoadedProjectName);
    if (
      (dataPoints.length === 0 && projectName) ||
      (projectName !== lastLoadedProjectName &&
        (projectName && lastLoadedProjectName))
    ) {
      setLoading(true);
      console.log("IN HERE");

      // fetching data if we de not have anything from before
      const downloadRef = storage.ref(`${projectName}/data.csv`);
      downloadRef.getDownloadURL().then(url => {
        csv(url).then(data => {
          let sensorNames = Object.keys(data[0]);
          setSensors(sensorNames);
          setDatapoints(data);
          setProjectName(projectName);
          setLoading(false);
        });
      });
    } else if (
      projectName === undefined &&
      lastLoadedProjectName.length === 0
    ) {
      console.log("THATS FUCKING TRUE");
    } else {
      console.log("We have already fetched data");
    }
  }, []);

  return (
    <div className="Container">
      <div className="CurrentProject__Title">
        Project: {lastLoadedProjectName}
      </div>
      {loading && <div>Loading data...</div>}
      {projectName === undefined && lastLoadedProjectName.length === 0 && (
        <div>You currently have no current project selected. </div>
      )}
      {!loading && (
        <div>
          <div className="Setup__Option">
            Your sensors (choose one if you have not selected any):
          </div>
          <div className="CurrentProject__SensorsList">
            {sensorNames.map(sensor => (
              <div
                className={currentSensor === sensor ? "SelectedSensor" : ""}
                onClick={() => {
                  setCurrentSensor(sensor);
                }}
                key={sensor}
              >
                {sensor}
              </div>
            ))}
          </div>
          {currentSensor && (
            <div>
              <Sensor
                sensor={currentSensor}
                dataPoints={dataPoints}
                sensors={sensorNames}
              />
            </div>
          )}
        </div>
      )}
      {!loading && (
        <div>
          <MySocket />
        </div>
      )}
    </div>
  );
};

export default CurrentProject;
