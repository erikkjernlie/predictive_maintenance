import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  useDataPoints,
  useSensorNames,
  useProjectName
} from "../../stores/sensors/sensorsStore";
import { storage } from "../../firebase";

import { csv } from "d3";
import {
  setDatapoints,
  setSensors,
  setProjectName
} from "../../stores/sensors/sensorsActions";
import Sensor from "../../Components/Sensor/Sensor";

const MyProject = ({ match }) => {
  const dataPoints = useDataPoints();
  const sensorNames = useSensorNames();
  // PROJECTNAME const p = useSensorNames();
  const { projectName } = match.params;
  const [currentSensor, setCurrentSensor] = useState(sensorNames[0]);

  const [loading, setLoading] = useState(false);

  const lastLoadedProjectName = useProjectName();

  useEffect(() => {
    console.log("data", dataPoints);
    if (dataPoints.length === 0 || projectName !== lastLoadedProjectName) {
      setLoading(true);

      // WE NEED TO FETCH DATA IF WE DO NOT HAVE ANYTHING OR IF WE HAVE THE WRONG DATA
      const uploadTask = storage.ref(`${projectName}/data.csv`);
      uploadTask.getDownloadURL().then(url => {
        csv(url).then(data => {
          let sensorNames = Object.keys(data[0]);
          setSensors(sensorNames);
          setDatapoints(data);
          setProjectName(projectName);
          setLoading(false);
        });
      });
    } else {
      console.log("WE HAVE ALREADY FETCHED DATA");
    }
  }, []);

  return (
    <div>
      <div>Configuration</div>
      {!loading && (
        <div>
          <div>{lastLoadedProjectName}</div>

          <div className="SensorsList">
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
            <div className="CurrentSensor">
              <Sensor
                sensor={currentSensor}
                dataPoints={dataPoints}
                sensors={sensorNames}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MyProject;
