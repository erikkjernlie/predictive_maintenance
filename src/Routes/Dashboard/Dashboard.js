import React, { useEffect } from "react";
import ExistingProjects from "../../Components/ExistingProjects/ExistingProjects";
import { csv } from "d3";
import { DataProvider, Series } from "@cognite/griff-react";
import ApexCharts from "apexcharts";

const Dashboard = props => {
  useEffect(() => {
    csv("rig_good.csv").then(data => {
      console.log(data.map(s => parseFloat(s["Load"])));
    });
  }, []);

  return (
    <div>
      here it comes
      <ExistingProjects />
      <div style={{ marginLeft: "auto", marginRight: "auto", width: "80%" }}>
        <DataProvider timeDomain={[1570521842970, 1571126642971]}>
          <Series id="1" color="steelblue" />
          <Series id="2" color="maroon" />
        </DataProvider>
      </div>
    </div>
  );
};

export default Dashboard;
