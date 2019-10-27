import React, { Component } from "react";
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
import { fetchModel, fetchConfig } from "../../stores/sensors/sensorsActions";

// const URL = "ws://169.254.109.234:1337";
const URL = "ws://tvilling.digital:1337";

class MySocket extends Component {
  ws = new WebSocket(URL);

  constructor(props) {
    super(props);
  }

  state = {
    sourceBuffers: {},
    packetCounter: 0,
    topics: [],
    pushDataIntervalID: undefined,
    data: [],
    time: [],
    predictions: [],
    outputNames: [],
    model: null,
    outputIndex: 0,
    inputIndexes: [],
    selectedSources: [],
    horizontal_line: [],
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

  predictValue(dataPoint) {
    /* NEED TO BE FIXED
    if (true) {
      dataPoint = standardizeData([dataPoint]);
    } else {
      dataPoint = normalizeData(dataPoint);
    }
    */

    if (this.state.model) {
      // model is a promise
      // console.log(this.props.model); MODLE IS A PROMISE
      const prediction = this.state.model
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
      const model = await fetchModel();
      const config = await fetchConfig();

      this.setState({
        config: config,
        model: model
      });

      await fetchAuthCookie();
      const topicsJSON = await fetchTopics();
      let outputNames = topicsJSON["0000"].output_names;
      let inputIndexes = [];
      for (let i = 0; i < config.input.length; i++) {
        let index = outputNames.indexOf(config.input[i]);
        inputIndexes.push(index);
      }
      let outputIndex = outputNames.indexOf(config.output[0]);

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
          console.log(data);

          const sourceID = decoder.decode(new Uint8Array(data, 0, 4));
          this.parseData(data.slice(4), sourceID);
        } else {
          console.log("pong"); // why pong?
        }
      }
      // counter += 1;
      // counter = counter % 0;
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
      console.log("datapoibt");
      sourceBuffer.x_buffer.push(new Date(unpacked[0] * 1000));
      const channelsIds = this.state.subscribedSources[sourceID].channels.map(
        it => it.id
      );
      channelsIds.forEach(channelID => {
        sourceBuffer.y_buffer[channelID].push(unpacked[channelID + 1]);
      });

      unpacked = unpackIterator.next().value;
      if (this.state.model && unpacked && unpacked.length > 0) {
        let x = []; // input values

        // have to add 3 because CATMAN adds a header for the first 3 values
        this.state.inputIndexes.forEach(index => x.push(unpacked[index + 3]));
        let output = unpacked[this.state.outputIndex + 3];
        console.log(output);
        // const timestamp = unpacked[LASTONE]
        // const otherSelectedSources må også være med
        // data has 3 values, then the names start
        // const time = this.state.time.concat(new Date(unpacked[11 + 3] * 1000));
        if (this.state.data.length >= 400) {
          let d = this.state.data;
          let e = this.state.time;
          d.shift();
          d.concat(output);
          e.shift();
          e.concat(new Date(unpacked[14] * 1000));

          this.setState({
            data: d,
            time: e
          });
          if (this.state.model && x.length === this.state.inputIndexes.length) {
            let p = this.state.predictions;
            let predictedVal = this.predictValue(x);
            p.shift();
            p.concat(predictedVal);
            this.setState({
              predictions: p
            });
          } else {
            console.log("no model");
          }
        } else {
          const data = this.state.data.concat(output);
          const time = this.state.time.concat(new Date(unpacked[14] * 1000));
          if (this.state.model) {
            let predictedVal = this.predictValue(x);
            const predictions = this.state.predictions.concat(predictedVal);
            this.setState({
              predictions
            });
          } else {
            console.log("no model");
          }
          // const horizontal_line = this.state.horizontal_line.concat(200);
          this.setState({
            data: data,
            time: time
          });
        }
        // console.log("ARRAY", array2);
        // console  .log(data);
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

  render() {
    return (
      <div>
        <h4>Livestream data:</h4>
        <PlotIt
          dataPoints={[
            { y: this.state.data, x: this.state.time },
            {
              y: this.state.predictions,
              x: this.state.time,
              marker: { color: "red" }
            }
          ]}
        />
      </div>
    );
  }
}

export default MySocket;
