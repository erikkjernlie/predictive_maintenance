import React from "react";
import ExistingProjects from "../../Components/ExistingProjects/ExistingProjects";
import "./Dashboard.css";

const Dashboard = props => {
  return (
    <div className="Dashboard__container">
      <ExistingProjects />
    </div>
  );
};

export default Dashboard;
