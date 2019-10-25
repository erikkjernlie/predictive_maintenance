import React, { useEffect } from "react";
import { Router, Route, Switch } from "react-router-dom";
import Navbar from "./shared/Navbar/Navbar";
import Dashboard from "./Routes/Dashboard/Dashboard";
import Sensors from "./Routes/Sensors/Sensors";
import ProjectSetup from "./Routes/Project/ProjectSetup";
import Project from "./Routes/Project/Project";
import { createBrowserHistory } from "history";
// import { fetchSensors } from "./stores/sensors/sensorsActions";

import "./App.css";

const App = () => {
  const history = createBrowserHistory({
    basename: ""
  });

  return (
    <div className="App">
      {/* DO WE NEED HISTORY IN ROUTER? */}

      <Router history={history}>
        <Navbar />

        <Switch>
          <Route
            exact
            path="/projects"
            render={props => <Dashboard {...props} />}
          />
          <Route exact path="/" render={props => <Project {...props} />} />
          <Route
            path="/newProject"
            render={props => <ProjectSetup {...props} />}
          />

          <Route path="/sensors" render={props => <Sensors {...props} />} />
          <Route
            path={`/:projectName`}
            render={props => <Project {...props} />}
          />
        </Switch>
      </Router>
    </div>
  );
};

export default App;
