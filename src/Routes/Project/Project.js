import React from "react";
import { Route, Switch } from "react-router-dom";

import Sensors from "../Sensors/Sensors";
import MyProject from "./MyProject";
import TrainModel from "./TrainModel";

const Project = ({ match }) => {
  return (
    <div>
      {" "}
      <Switch>
        <Route
          exact
          path={`${match.path}`}
          render={props => <MyProject {...props} />}
        />
        <Route path={`${match.path}/configuration`} component={TrainModel} />

        <Route path={`${match.path}/sensors`} component={Sensors} />
      </Switch>
    </div>
  );
};

export default Project;
