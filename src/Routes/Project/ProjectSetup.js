import React, { useEffect, useState } from "react";

import { storage } from "../../firebase";
import { setSensors, setDatapoints } from "../../stores/sensors/sensorsActions";
import { Link } from "react-router-dom";

import { csv } from "d3";
import AddSensor from "../../Components/Sensor/AddSensor";

const ProjectSetup = ({ match }) => {
  const { projectName } = match.params;
  const [sensorNames, setSensorNames] = useState([]);

  useEffect(() => {
    // load project here
    fetchProject();
  }, []);

  const fetchProject = () => {
    const uploadTask = storage.ref(`${projectName}/data.csv`);
    uploadTask.getDownloadURL().then(url => {
      console.log(url);
      csv(url).then(data => {
        let sensorNames = Object.keys(data[0]);
        console.log(sensorNames);
        let dataPoints = data.slice(1);
        setSensorNames(sensorNames);
        setSensors(sensorNames);
        setDatapoints(dataPoints);
      });
    });
  };
  /*
      Trying to load the data for: <b>{projectName}</b>

     
  */

  return (
    <div>
      <div>
        {sensorNames &&
          sensorNames.length > 0 &&
          sensorNames.map(sensor => <AddSensor key={sensor} sensor={sensor} />)}
      </div>
      <div className="NewProject__step">
        <Link to={projectName + "/sensors"}>
          <button>Finish setup</button>
        </Link>
      </div>
    </div>
  );
};

export default ProjectSetup;
