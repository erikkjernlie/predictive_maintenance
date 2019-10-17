import React, { Component } from "react";
import PlotIt from "./PlotIt";
import struct from "@aksel/structjs";
const URL = "ws://169.254.109.234:1337";

class MySocket extends Component {
  ws = new WebSocket(URL);

  state = {
    sourceBuffers: {},
    packetCounter: 0,
    pushDataIntervalID: undefined,
    data: [],
    subscribedSources: {
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

  componentDidMount() {
    this.ws.binaryType = "arraybuffer";

    this.ws.onopen = () => {
      // on connecting, do nothing but log it to the console
      console.log("connected");
      this.initParser();
    };

    this.ws.onmessage = evt => {
      // on receiving a message, add it to the list of messages
      if (evt.data.byteLength > 0) {
        const data = evt.data;
        let decoder = new TextDecoder("utf-8");

        const sourceID = decoder.decode(new Uint8Array(data, 0, 4));
        console.log("SOURCEID", sourceID);
        this.parseData(data.slice(4), sourceID);
      } else {
        console.log("pong"); // why pong?
      }
    };

    this.ws.onclose = () => {
      console.log("disconnected");
      // automatically try to reconnect on connection loss
    };
  }

  parseData = (data, sourceID) => {
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
    const unpackIterator = struct("<HHIdddddddddddd").iter_unpack(data);
    let unpacked = unpackIterator.next().value;
    while (unpacked) {
      sourceBuffer.x_buffer.push(new Date(unpacked[0] * 1000));
      const channelsIds = this.state.subscribedSources[sourceID].channels.map(
        it => it.id
      );
      channelsIds.forEach(channelID => {
        sourceBuffer.y_buffer[channelID].push(unpacked[channelID + 1]);
      });
      unpacked = unpackIterator.next().value;
      // console.log("UNPACKED", unpacked);
      if (unpacked && unpacked.length > 0) {
        const data = this.state.data.concat(unpacked[9]);
        this.setState({
          data: data
        });
      }
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

  render() {
    return (
      <div>
        <div>SOCKET HERE</div>
        <PlotIt dataPoints={[{ y: this.state.data }]} />
      </div>
    );
  }
}

export default MySocket;
