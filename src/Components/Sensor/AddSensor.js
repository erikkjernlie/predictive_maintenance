import React, { useState } from "react";

import { Checkbox } from "@material-ui/core";
import { saveSensorData } from "../../stores/sensors/sensorsActions";

const AddSensor = props => {
  const [inputSensor, setInputSensor] = useState(false);
  const [outputSensor, setOutputSensor] = useState(false);
  const [internalSensor, setInternalSensor] = useState(false);

  const changeSensor = number => {
    switch (number) {
      case 0:
        setInputSensor(true);
        setOutputSensor(false);
        setInternalSensor(false);
        saveSensorData(props.sensor, "input");
        // save something to store here?
        break;
      case 1:
        setOutputSensor(true);
        setInputSensor(false);
        setInternalSensor(false);
        saveSensorData(props.sensor, "output");

        // save something to store here?
        break;
      case 2:
        setInternalSensor(true);
        setOutputSensor(false);
        setInputSensor(false);
        saveSensorData(props.sensor, "internal");
        // save something to store here?

        break;
      default:
        break;
    }
  };

  return (
    <tr>
      <td>{props.sensor}</td>
      <td>
        <Checkbox
          color="default"
          onClick={() => changeSensor(0)}
          checked={inputSensor}
        />
      </td>
      <td>
        <Checkbox
          color="default"
          onClick={() => changeSensor(1)}
          checked={outputSensor}
        />
      </td>
      <td>
        <Checkbox
          color="default"
          onClick={() => changeSensor(2)}
          checked={internalSensor}
        />
      </td>
      <td>
        <input />
      </td>
    </tr>
  );
};

export default AddSensor;
