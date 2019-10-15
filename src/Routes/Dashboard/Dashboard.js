import React, { useEffect } from "react";
import ExistingProjects from "../../Components/ExistingProjects/ExistingProjects";
import { csv } from "d3";
import { DataProvider, Series } from "@cognite/griff-react";
import ApexCharts from "apexcharts";
import MySocket from "./MySocket.js";
import Socket2 from "./Socket2";

const Dashboard = props => {
  useEffect(() => {
    /*
    csv("rig_good.csv").then(data => {
      console.log(data.map(s => parseFloat(s["Load"])));
    });
    */
  }, []);

  return (
    <div>
      here it comes
      <ExistingProjects />
      <MySocket />
      <Socket2 />
    </div>
  );
};

export default Dashboard;
