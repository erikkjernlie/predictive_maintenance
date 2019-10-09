import React, { useEffect } from "react";
import { Router, Route, Switch } from "react-router-dom";
import Navbar from "./shared/Navbar/Navbar";
import Dashboard from "./Routes/Dashboard/Dashboard";
import Sensors from "./Routes/Sensors/Sensors";
import Upload from "./Components/Upload/Upload";
import NewProject from "./Routes/NewProject/NewProject";
import Project from "./Routes/Project/Project";
import { createBrowserHistory } from "history";
import { fetchModels } from "./stores/models/modelsActions";
// import { fetchSensors } from "./stores/sensors/sensorsActions";

import logo from "./logo.svg";
import "./App.css";

const App = () => {
  // PROPS IN HERE
  useEffect(() => {
    // fetch stuff here
    fetchModels();
    // fetchSensors();
  });

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
          <Route path="/newProject" render={props => <Upload {...props} />} />

          <Route
            path={`/dashboard`}
            render={props => <Dashboard {...props} />}
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
