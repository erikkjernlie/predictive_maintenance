import React from "react";
import { Route, Switch } from "react-router-dom";

import Sensors from "../Sensors/Sensors";
import ProjectSetup from "./ProjectSetup";

const Project = ({ match }) => {
  return (
    <div>
      {" "}
      <Switch>
        <Route
          exact
          path={`${match.path}`}
          render={props => <ProjectSetup {...props} />}
        />
        <Route path={`${match.path}/sensors`} component={Sensors} />
      </Switch>
    </div>
  );
};

export default Project;
