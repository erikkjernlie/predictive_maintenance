import React, { useEffect } from "react";
import { storage } from "../../firebase";
import { csv } from "d3";

const Project = ({ match }) => {
  const { projectName } = match.params;

  useEffect(() => {
    // load project here
    fetchProject();
  }, []);

  const fetchProject = () => {
    const uploadTask = storage.ref(`${projectName}/data.csv`);
    uploadTask.getDownloadURL().then(url => {
      console.log(url);
      csv(url).then(data => {
        console.log(data);
      });
    });
  };

  return (
    <div>
      Trying to load the data for: <b>{projectName}</b>
    </div>
  );
};

export default Project;
