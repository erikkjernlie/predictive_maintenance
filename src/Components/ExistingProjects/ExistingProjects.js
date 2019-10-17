import React from "react";
import { Link } from "react-router-dom";
import "./ExistingProjects.css";
import { setProjectName } from "../../stores/sensors/sensorsActions";

const ExistingProjects = () => {
  const setName = project => {
    setProjectName(project);
  };
  const clearLocalStorage = () => {
    localStorage.clear();
  };

  return (
    <div className="ExistingProject__Container">
      <div className="ExistingProjects__Title">Load existing projects:</div>

      <div className="Flex">
        <div>Do you wish to delete existing projects?</div>
        <button onClick={() => clearLocalStorage()}>Yes</button>
      </div>
      {localStorage.getItem("projects") && (
        <div className="Content">
          <div className="ExistingProjects__Projects">
            {localStorage
              .getItem("projects")
              .split(" ")
              .map((project, index) => (
                <div className="Link" key={index}>
                  <Link to={project} onClick={() => setName(project)}>
                    {project}
                  </Link>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ExistingProjects;
