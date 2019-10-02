import React, { useState } from "react";
import ReactDOM from "react-dom";
import CSVReader from "react-csv-reader";
import AddSensor from "../../Components/Sensor/AddSensor";
import { setSensors, setDatapoints } from "../../stores/sensors/sensorsActions";
import { Link } from "react-router-dom";

import "./NewProject.css";

const NewProject = props => {
  const [step2, setStep2] = useState(false);
  const [step3, setStep3] = useState(false);
  const [sensorNames, setSensorNames] = useState([]);

  const uploadData = dataset => {
    // UPLOAD DATA TO STORE, SO WE DO NOT NEED TO RELOAD IT AT SENSORS
    // add list with sensors = ["Load", ...]
    // then datapoints in another array, so we can use datapoint[sensors.indexOf(sensor)]
    setStep2(true);

    let sensorNames = dataset[0];
    let dataPoints = dataset.slice(1);

    setSensorNames(sensorNames);
    setSensors(sensorNames);
    setDatapoints(dataPoints);
  };

  const handleChange = e => {
    setStep3(true);
  };

  return (
    <div className="NewProject__container">
      <div className="NewProject__title">Welcome</div>
      <div className="NewProject__step">
        <div className="NewProject__stepTitle">Step 1</div>
        <div className="NewProject__uploadFile">
          <CSVReader
            cssClass="react-csv-input"
            label=""
            onFileLoaded={uploadData}
          />
        </div>
      </div>
      <div className="NewProject__step">
        {step2 && <div className="NewProject__stepTitle">Step 2</div>}
        {step2 && (
          <div className="NewProject__description">
            Select URL for datastream
          </div>
        )}
        {step2 && <input onChange={handleChange} />}
      </div>
      <div className="NewProject__step">
        {step3 && (
          <React.Fragment>
            <div className="NewProject__stepTitle">Step 3</div>
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
                  sensorNames.map(sensor => <AddSensor sensor={sensor} />)}
              </tbody>
            </table>
          </React.Fragment>
        )}
      </div>
      {step3 && (
        <div className="NewProject__step">
          <Link to="sensors">
            <button>Finish setup</button>
          </Link>
        </div>
      )}
    </div>
  );
};

export default NewProject;
