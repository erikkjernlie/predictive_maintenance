import React, { useState } from "react";

import { Checkbox } from "@material-ui/core";

const AddSensor = props => {
  const [inputSensor, setInputSensor] = useState(false);
  const [outputSensor, setOutputSensor] = useState(false);
  const [internalSensor, setInternalSensor] = useState(false);

  const changeSensor = number => {
    switch (number) {
      case 0:
        setInputSensor(!inputSensor);
        // save something to store here?
        break;
      case 1:
        setOutputSensor(!outputSensor);
        // save something to store here?
        break;
      case 2:
        setInternalSensor(!internalSensor);
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
        <Checkbox color="default" onClick={() => changeSensor(0)} />
      </td>
      <td>
        <Checkbox color="default" onClick={() => changeSensor(1)} />
      </td>
      <td>
        <Checkbox color="default" onClick={() => changeSensor(2)} />
      </td>
      <td>
        <input />
      </td>
    </tr>
  );
};

export default AddSensor;
