import React, { useState } from "react";

const DataInfo = props => {
    console.log(props);
  return (
    <div>
        <p>Input columns: {props.info.input}</p>
        <p>Output columns: {props.info.output}</p>
        <p>Number of training points: {props.info.training}</p>
        <p>Number of testing points: {props.info.testing}</p>
        
    </div>
  );
};

export default DataInfo;
