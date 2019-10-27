import React, { useState } from "react";

import { Checkbox } from "@material-ui/core";
import { saveSensorData } from "../../stores/sensors/sensorsActions";
import {
  addSensor,
  setMinValue,
  setMaxValue
} from "../../stores/sensors/sensorsActions";
import { useConfig } from "../../stores/sensors/sensorsStore";

const AddSensor = props => {
  const [inputSensor, setInputSensor] = useState(false);
  const [outputSensor, setOutputSensor] = useState(false);
  const [internalSensor, setInternalSensor] = useState(false);
  const [unit, setUnit] = useState("");
  const [min, setMin] = useState(null);
  const [max, setMax] = useState(null);

  const config = useConfig();

  const handleUnit = e => {
    if (e.target.value) {
      setUnit(e.target.value);
    }
    if (inputSensor) {
      addSensor(props.sensor, "input", unit, min, max);
    } else if (outputSensor) {
      addSensor(props.sensor, "output", unit, min, max);
    } else if (internalSensor) {
      addSensor(props.sensor, "internal", unit, min, max);
    } else {
      addSensor(props.sensor, "input", unit, min, max);
    }
  };

  const handleMinValue = e => {
    if (inputSensor) {
      addSensor(props.sensor, "input", unit, e.target.value, max); // might need to be converted to float
    } else if (outputSensor) {
      addSensor(props.sensor, "output", unit, e.target.value, max); // might need to be converted to float
    } else {
      addSensor(props.sensor, "internal", unit, e.target.value, max); // might need to be converted to float
    }
    setMin(e.target.value);
  };

  const handleMaxValue = e => {
    if (inputSensor) {
      addSensor(props.sensor, "input", unit, min, e.target.value); // might need to be converted to float
    } else if (outputSensor) {
      addSensor(props.sensor, "output", unit, min, e.target.value); // might need to be converted to float
    } else {
      addSensor(props.sensor, "internal", unit, min, e.target.value); // might need to be converted to float
    }
    setMax(e.target.value);
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
        <input className="inputClass" onChange={handleUnit} />
      </td>
      <td>
        <input className="inputClass" type="number" onChange={handleMinValue} />
      </td>
      <td>
        <input className="inputClass" type="number" onChange={handleMaxValue} />
      </td>
    </tr>
  );
};

export default AddSensor;
