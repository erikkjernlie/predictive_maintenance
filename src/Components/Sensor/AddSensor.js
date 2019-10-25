import React, { useState } from "react";

import { Checkbox } from "@material-ui/core";
import { saveSensorData } from "../../stores/sensors/sensorsActions";
import {
  addSensor,
  setMinValue,
  setMaxValue
} from "../../stores/sensors/sensorsActions";

const AddSensor = props => {
  const [inputSensor, setInputSensor] = useState(false);
  const [outputSensor, setOutputSensor] = useState(false);
  const [internalSensor, setInternalSensor] = useState(false);
  const [unit, setUnit] = useState("");

  const handleUnit = e => {
    if (e.target.value) {
      setUnit(e.target.value);
    }
    if (inputSensor) {
      addSensor(props.sensor, "input", unit);
    } else if (outputSensor) {
      addSensor(props.sensor, "output", unit);
    } else if (internalSensor) {
      addSensor(props.sensor, "internal", unit);
    } else {
      addSensor(props.sensor, "input", unit);
    }
  };

  const handleMinValue = e => {
    setMinValue(props.sensor, e.target.value); // might need to be converted to float
  };

  const handleMaxValue = e => {
    setMaxValue(props.sensor, e.target.value); // might need to be converted to float
  };

  const changeSensor = number => {
    switch (number) {
      case 0:
        setInputSensor(true);
        setOutputSensor(false);
        setInternalSensor(false);
        addSensor(props.sensor, "input", unit);
        // save something to store here?
        break;
      case 1:
        setOutputSensor(true);
        setInputSensor(false);
        setInternalSensor(false);
        addSensor(props.sensor, "output", unit);
        // save something to store here?
        break;
      case 2:
        setInternalSensor(true);
        setOutputSensor(false);
        setInputSensor(false);
        addSensor(props.sensor, "internal", unit);
        // save something to store here?
        break;
      default:
        break;
    }
  };

  const onChange = e => {
    return;
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
        <input onChange={handleUnit} />
      </td>
      <td>
        <input onChange={handleMinValue} />
      </td>
      <td>
        <input onChange={handleMaxValue} />
      </td>
    </tr>
  );
};

export default AddSensor;
