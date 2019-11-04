import React, { Component, useState } from "react";
import PlotIt from "./PlotIt";
import struct from "@aksel/structjs";
import {
  fetchTopics,
  subscribeToSource,
  fetchAuthCookie
} from "../../stores/models/modelsActions";
import {
  standardizeData,
  normalizeData
} from "../../Routes/Project/statisticsLib";

import * as tf from "@tensorflow/tfjs";
import { useProjectName, useConfig } from "../../stores/sensors/sensorsStore";
import Plot from "react-plotly.js";
import moment from "moment";
import {
  fetchModel,
  fetchProcessedConfig,
  fetchConfig
} from "../../Routes/Project/transferLib";

const URL = "ws://tvilling.digital:1337";
let hasLiveFeed = false;

function setHasLiveFeed(bool) {
  hasLiveFeed = bool;
}

class MySocket extends Component {
  constructor(props) {
    super(props);
  }

  ws = new WebSocket(URL);

  state = {
    sourceBuffers: {},
    timeSinceLastError: null,
    packetCounter: 0,
    topics: [],
    pushDataIntervalID: undefined,
    data: [],
    time: [],
    predictions: [],
    outputNames: [],
    numberOfDatapoints: 0,
    numberOfErrorDatapoints: 0,
    model: null,
    outputIndex: 0,
    inputIndexes: [],
    selectedSources: [],
    horizontal_line: [],
    inputValuesForPrediction: {},
    manuallyPredictedOutput: null,
    subscribedSources: {
      "0001": {
        byteFormat: "<HHIdddddddddddd",
        name: "testrig",
        channels: [
          {
            id: 1,
            name: "Load [N]"
          }
        ]
      },
      "0000": {
        byteFormat: "<HHIdddddddddddd",
        name: "testrig",
        channels: [
          {
            id: 1,
            name: "Load [N]"
          }
        ]
      }
    }
  };

  predictManually = () => {
    if (this.state.model) {
      let inputToPredicting =this.state.config.input.map(key => {
        return Number(this.state.inputValuesForPrediction[key]);
      });
      if (inputToPredicting.length === this.state.config.input.length) {
        let val = this.predictValue(this.state.model, inputToPredicting);
        this.setState({
          manuallyPredictedOutput: val
        });
        return val;
      } else {
        return NaN;
      }
    } else {
      return NaN;
    }
  };

  onChange = sensorName => e => {
    console.log(sensorName, e.target.value);
    let obj = this.state.inputValuesForPrediction;
    if (this.state.config.differentValueRanges) {
      obj[sensorName] = this.standardize(
        e.target.value,
        this.state.config.sensors[sensorName].mean,
        this.state.config.sensors[sensorName].std
      );
    } else {
      obj[sensorName] = this.normalize(
        e.target.value,
        this.state.config.sensors[sensorName].min,
        this.state.config.sensors[sensorName].max
      );
    }
    this.setState({
      inputValuesForPrediction: obj
    });

    let prediction = this.predictManually();
    if (prediction !== null) {
      this.setState({
        manuallyPredictedOutput: prediction
      });
    } else {
      this.setState({
        manuallyPredictedOutput: "Error"
      });
    }
  };

  predictValue(model, dataPoint) {
    /* NEED TO BE FIXED
    if (true) {
      dataPoint = standardizeData([dataPoint]);
    } else {
      dataPoint = normalizeData(dataPoint);
    }
    */

    if (dataPoint) {
      const prediction = model
        .predict(tf.tensor2d([dataPoint], [1, dataPoint.length]))
        .dataSync();
      if (prediction.length === 1) {
        return prediction[0];
      } else {
        return prediction;
      }
    }
  }

  bundleMatrixOutput = (allOutputs, matrixOutputRefs) => {
    const matrixOutputs = Object.entries(matrixOutputRefs).map(matrixOutput => {
      const matrixOutputIndices = matrixOutput[1];
      let matrixChannels = [];
      // Fetch matrixchannels from scalaroutputs which holds all the output channels when entering this function
      matrixOutputIndices.forEach(index => {
        const matrixChannel = allOutputs[index];
        matrixChannels.push(matrixChannel);
      });
      return {
        channelName: matrixOutput[0] + "_matrix",
        outputChannels: matrixChannels
      };
    });
    // Filter out scalar outputs based on if the name does not contain '_mXY' where X and Y are integers
    const scalarOutputs = allOutputs.filter(
      channel => !/_m\d\d/.test(channel.channelName)
    );
    return scalarOutputs.concat(matrixOutputs);
  };

  makeChannels = topicJSON => {
    if (topicJSON.output_names === undefined) {
      return [];
    }
    const matrixOutputRefs = topicJSON.matrix_outputs;
    let allOutputs = topicJSON.output_names.map((output_name, index) => ({
      id: index,
      channelName: output_name
    }));
    if (
      matrixOutputRefs === undefined ||
      Object.keys(matrixOutputRefs).length === 0
    ) {
      // There exists no matrixOutputs return all outputs as they are
      return allOutputs;
    }
    return this.bundleMatrixOutput(allOutputs, matrixOutputRefs);
  };

  componentDidMount() {
    (async () => {
      const project = this.props.project;
      // model = await tf.loadLayersModel("indexeddb://" + project + "/model");
      const model = await fetchModel(this.props.projectName);
      const config = await fetchProcessedConfig(this.props.projectName);
      const configFromProjectSetup = await fetchConfig(this.props.projectName);
      console.log("config, componentDidMount", config);
      console.log("liveFeedURL", config.liveFeedURL);
      this.setState({
        config: config,
        model: model,
        configFromProjectSetup: configFromProjectSetup
      });
      if (config.liveFeedURL === "ws://tvilling.digital:1337") {
        setHasLiveFeed(true);
  
        await fetchAuthCookie();
        const topicsJSON = await fetchTopics();
        let outputNames = topicsJSON["0000"].output_names;
        let inputIndexes = [];
        console.log(config.input, outputNames);
        for (let i = 0; i < config.input.length; i++) {
          let index = outputNames.indexOf(config.input[i]);
          inputIndexes.push({
            index: index,
            name: config.input[i]
          });
        }
        let outputIndex = outputNames.indexOf(config.output[0]);
        console.log(inputIndexes);
        this.setState({
          outputNames: topicsJSON["0000"].output_names,
          outputIndex: outputIndex,
          inputIndexes: inputIndexes
        }); // hard coded "0000"
        console.log("topicsJSON", topicsJSON); // HER ARE THE NAMES, INSIDE THIS ONE
        // console.log("FETCHING TOPICS", topicsJSON);
        if (!topicsJSON) return;
        this.setState({
          topics: Object.entries(topicsJSON).map(topic => ({
            id: topic[0],
            url: topic[1].url,
            byteFormat: topic[1].byte_format,
            channels: this.makeChannels(topic[1]) || []
          }))
        });
  
        const subscribe = subscribeToSource("0000");
  
        // ADD EVERYTHING TO SELECTED SOURCES
  
        const subscribeSources = this.state.selectedSources
          .filter(
            source =>
              source.selectedChannels !== undefined &&
              source.selectedChannels.length > 0
          )
          .map(source => ({
            id: source.id,
            name: source.url.split("/")[2],
            byteFormat: source.byteFormat,
            url: source.url,
            subscribedChannels: this.unBundleMatrixChannels(
              source.selectedChannels
            )
          }));
  
        /*
        await this.$store.dispatch(
          "channelModule/generateDataSources",
          subscribeSources
        );
        EventBus.$emit(EVENTS.subscribe, subscribeSources);
        */
      } else {
        setHasLiveFeed(false);
      }
      
    })();

    this.ws.binaryType = "arraybuffer";

    this.ws.onopen = () => {
      // on connecting, do nothing but log it to the console
      console.log("connected");
      this.initParser();
    };

    let counter = 0;
    this.ws.onmessage = evt => {
      // on receiving a message, add it to the list of messages
      if (counter === 0) {
        if (evt.data.byteLength > 0) {
          const data = evt.data;
          let decoder = new TextDecoder("utf-8");

          const sourceID = decoder.decode(new Uint8Array(data, 0, 4));
          this.parseData(data.slice(4), sourceID);
        } else {
          console.log("pong"); // why pong?
        }
      }
      // counter += 1;
      // counter = counter % 5;
    };

    this.ws.onclose = () => {
      console.log("disconnected");
      // automatically try to reconnect on connection loss
    };
  }

  unBundleMatrixChannels = channels => {
    // unbundling matrix channels
    const matrixChannels = channels
      .filter(channel => channel.channelName.includes("_matrix"))
      .flatMap(channel => channel.outputChannels);
    // putting scalar channels together with the matrix ones
    return channels
      .filter(channel => !channel.channelName.includes("_matrix"))
      .concat(matrixChannels);
  };

  standardize = (x, mean, std) => {
    return (x - mean) / std;
  };

  normalize = (x, min, max) => {
    return (x - min) / (max - min);
  };

  parseData = (data, sourceID) => {
    let counter = 0;
    // console.log(data);
    const sourceBuffer = this.state.sourceBuffers[sourceID];
    if (sourceBuffer === undefined) {
      return;
    }

    /*
    this.setState({
      packetCounter: this.state.packetCounter + 1
    });
    */
    // let byteFormat = this.state.subscribedSources[sourceId].byteFormat;
    // CAN WE ONLY USE d's here? instead of hhidd.. <ddddddddddddd -> en d = HHI mtp antall bytes
    const unpackIterator = struct("<HHIdddddddddddd").iter_unpack(data);
    let unpacked = unpackIterator.next().value;
    while (unpacked) {
      // NEED TO SYNCRONIZE TO GET CORRECT DATE
      // FIX THIS STUFF BELOW
      sourceBuffer.x_buffer.push(new Date(unpacked[0] * 1000));
      const channelsIds = this.state.subscribedSources[sourceID].channels.map(
        it => it.id
      );
      channelsIds.forEach(channelID => {
        sourceBuffer.y_buffer[channelID].push(unpacked[channelID + 1]);
      });

      unpacked = unpackIterator.next().value; // Do we skip a value here?
      if (
        this.state.model &&
        this.state.config &&
        unpacked &&
        unpacked.length > 0
      ) {
        let x = []; // input values
        let x_names = [];

        // have to add 3 because CATMAN adds a header for the first 3 values
        this.state.inputIndexes.forEach(function(elem) {
          x.push(unpacked[elem.index + 3]);
          x_names.push(elem.name);
        });
        let output = unpacked[this.state.outputIndex + 3];

        let predictions = this.state.predictions;
        let numberOfDatapoints = this.state.numberOfDatapoints;
        let numberOfErrorDatapoints = this.state.numberOfErrorDatapoints;

        let data = this.state.data.concat(output);
        numberOfDatapoints = numberOfDatapoints + 1;

        let time = this.state.time.concat(
          new Date(unpacked[unpacked.length - 1] * 1000)
        );

        if (this.state.model && x.length === this.state.inputIndexes.length) {
          let modifiedX = [];
          for (var i = 0; i < x.length; i++) {
            let obj = this.state.config.sensors[x_names[i]];
            if (this.state.config.differentValueRanges) {
              modifiedX.push(this.standardize(x[i], obj.mean, obj.std));
            } else {
              modifiedX.push(this.normalize(x[i], obj.min, obj.max));
            }
          }
          let errorPoint = false;
          let errorMessage = "";
          // point is predicted wrongly
          if (
            this.state.config &&
            this.state.config.input &&
            modifiedX.length === this.state.config.input.length
          ) {
            let predictedVal = this.predictValue(this.state.model, modifiedX);
            predictions.push(predictedVal);
            if (this.state.configFromProjectSetup.predictedValueAbsoluteError) {
              let predictedValueAbsoluteError = this.state
                .configFromProjectSetup.predictedValueAbsoluteError;
              if (
                Math.abs(predictedVal - output) > predictedValueAbsoluteError
              ) {
                errorPoint = true;
                errorMessage =
                  "The predicted value differed from the real value too much.";
              }
            }
          }
          // point is below minimum
          if (
            this.state.config.output &&
            this.state.configFromProjectSetup.sensors[
              this.state.config.output[0]
            ].min > output
          ) {
            errorPoint = true;
            errorMessage =
              "The real value was below the chosen min-value for the sensor.";
          }
          // point is above maxomum
          if (
            this.state.config.output &&
            this.state.configFromProjectSetup.sensors[
              this.state.config.output[0]
            ].max < output
          ) {
            errorMessage =
              "The real value was over the chosen max-value for the sensor.";
            errorPoint = true;
          }
          if (errorPoint) {
            numberOfErrorDatapoints = numberOfErrorDatapoints += 1;

            this.setState({
              timeSinceLastError: new Date(),
              errorMessage: errorMessage
            });
          }
        } else {
          console.log("no model");
        }

        if (this.state.data.length === 400) {
          predictions.shift();
          data.shift();
          time.shift();
        }
        if (predictions.length === data.length) {
          this.setState({
            predictions: predictions,
            data: data,
            time: time,
            numberOfDatapoints: numberOfDatapoints,
            numberOfErrorDatapoints: numberOfErrorDatapoints
          });
        }
        // if (Math.abs(predictedVal - this.state.configFromProjectSetup[])
      }
      break;
    }
  };

  pushData = () => {
    if (this.state.packetCounter > 0) {
      //EventBus.$emit(EVENTS.newData, deepCopy(this.sourceBuffers))
      //this.resetBuffers()
      //this.packetCounter = 0
    }
  };

  initParser = () => {
    this.initBuffers();
    /*
    this.setState({
      pushDataIntervalID: setInterval(this.pushData, 100)
    });
    */
  };

  initBuffers = () => {
    for (const sourceId in this.state.subscribedSources) {
      let sourceBuffer = {};

      let byteFormat = this.state.subscribedSources[sourceId].byteFormat;
      // sourceBuffer.unpacker = struct(byteFormat);
      const channels = this.state.subscribedSources[sourceId].channels;
      sourceBuffer.x_buffer = [];
      sourceBuffer.y_buffer = {};
      channels.forEach(channel => {
        sourceBuffer.y_buffer[channel.id] = [];
      });

      let b = this.state.sourceBuffers;
      b[sourceId] = sourceBuffer;
      /*
      this.setState({
        sourceBuffers: b
      });
      */
    }
  };

  loadSources = () => {};

  closeConnection = () => {
    this.ws.close();
  };

  openConnection = () => {
    this.ws = new WebSocket(URL);
    this.ws.binaryType = "arraybuffer";

    this.ws.onopen = () => {
      // on connecting, do nothing but log it to the console
      console.log("connected");
      this.initParser();
    };

    let counter = 0;
    this.ws.onmessage = evt => {
      // on receiving a message, add it to the list of messages
      if (counter === 0) {
        if (evt.data.byteLength > 0) {
          const data = evt.data;
          let decoder = new TextDecoder("utf-8");

          const sourceID = decoder.decode(new Uint8Array(data, 0, 4));
          this.parseData(data.slice(4), sourceID);
        } else {
          console.log("pong"); // why pong?
        }
      }
      // counter += 1;
      // counter = counter % 5;
    };

    this.ws.onclose = () => {
      console.log("disconnected");
      // automatically try to reconnect on connection loss
    };
  };

  render() {
    return (
      <div>
        <h4>Make manual predictions</h4>
        <div>
          {this.state.config &&
            this.state.config.input.map(inputValue => (
              <div key={inputValue}>
                {inputValue}:{" "}
                <input onChange={this.onChange(inputValue)} type="number" />
              </div>
            ))}
          {this.state.manuallyPredictedOutput !== null && (
            <div>Predicted value: {this.state.manuallyPredictedOutput}</div>
          )}
        </div>
        {hasLiveFeed && (
          <div>
          {this.state.config && this.state.config.output && (
            <div>
              <h4>Plot of livestream data</h4>
              <h5>Showing data for: {this.state.config.output[0]}</h5>
            </div>
          )}
          <button onClick={this.closeConnection}>Close connection</button>
          <button onClick={this.openConnection}>Open connection</button>
          <PlotIt
            dataPoints={[
              {
                y: this.state.data,
                x: this.state.time,
                name: "Real value",
                type: "scattergl"
              },
              {
                y: this.state.predictions,
                type: "scattergl",
                name: "Predicted",
                x: this.state.time,
                marker: { color: "red" }
              }
            ]}
          />
  
          <h4>Plot of operational status</h4>
          {this.state.config && this.state.config.output && (
            <h5>Showing data for: {this.state.config.output[0]}</h5>
          )}
          {this.state.timeSinceLastError && (
            <div>
              The last error happened at{" "}
              {moment(this.state.timeSinceLastError.toString()).format(
                "MMMM Do YYYY, h:mm:ss a"
              )}{" "}
              and had the following error message: {this.state.errorMessage}.
            </div>
          )}
          {this.state.numberOfDatapoints && (
            <Plot
              data={[
                {
                  values: [
                    Number(
                      this.state.numberOfDatapoints -
                        this.state.numberOfErrorDatapoints
                    ),
                    Number(this.state.numberOfErrorDatapoints)
                  ],
                  labels: ["OK", "NOT OK"],
                  type: "pie",
                  marker: {
                    colors: ["green", "red"]
                  }
                }
              ]}
            />
          )}
          </div>
        )}
      </div>
    );
  }
}

export default MySocket;
