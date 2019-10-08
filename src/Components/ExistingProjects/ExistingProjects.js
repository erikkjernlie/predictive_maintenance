import React from "react";
import { Link } from "react-router-dom";
import "./ExistingProjects.css";

const ExistingProjects = () => (
  <div className="ExistingProject__Container">
    {localStorage.getItem("projects") && (
      <div className="Content">
        <div className="ExistingProjects__Title">Load existing projects:</div>
        <div className="ExistingProjects__Projects">
          {localStorage
            .getItem("projects")
            .split(" ")
            .map(project => (
              <div className="Link">
                <Link to={project}>{project}</Link>
              </div>
            ))}
        </div>
      </div>
    )}
  </div>
);

export default ExistingProjects;
