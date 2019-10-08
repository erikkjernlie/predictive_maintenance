import React, { Component, useState } from "react";
import { storage } from "../../firebase";
import { Link, Redirect } from "react-router-dom";
import ExistingProjects from "../ExistingProjects/ExistingProjects";
import "./Upload.css";
import { setTimeout } from "timers";

class Upload extends Component {
  constructor(props) {
    super(props);
    this.state = {
      file: null,
      url: "",
      progress: 0,
      projectName: "",
      uploadTrainingData: false,
      uploadModel: false,
      uploadWeights: false,
      file1: null,
      file2: null,
      uploading: false
    };
  }

  handleProjectName = e => {
    if (e.target.value) {
      this.setState({
        projectName: e.target.value
      });
    }
  };

  handleChange = e => {
    if (e.target.files[0]) {
      const file = e.target.files[0];
      this.setState(() => ({ file }));
    }
  };

  handleChangeMultiple = e => {
    if (e.target.files[0]) {
      const file1 = e.target.files[0];
      this.setState(() => ({ file1 }));
    }
    if (e.target.files[1]) {
      const file2 = e.target.files[1];
      this.setState(() => ({ file2 }));
    }
  };

  redirect = () => {
    if (this.state.redirect) {
      return <Redirect to={this.state.projectName} />;
    }
  };

  handleUpload = () => {
    const { file } = this.state;
    if (file === null || this.state.projectName.length === 0) {
      return;
    }
    this.setState({
      uploading: true
    });
    const uploadTask = storage
      .ref(`${this.state.projectName}/data.csv`)
      .put(file);
    // observer for when the state changes, e.g. progress
    uploadTask.on(
      "state_changed",
      snapshot => {
        const progress = Math.round(
          (snapshot.bytesTransferred / snapshot.totalBytes) * 100
        );
        this.setState({ progress });
      },
      error => {
        console.log(error);
      },
      () => {
        // complete function ....
        storage
          .ref(this.state.projectName)
          .child(file.name)
          .getDownloadURL()
          .then(url => {
            console.log(url);
            this.setState({ url });
          });

        // done uploading
        this.setState({
          uploading: true
        });

        // add project
        if (this.state.projectName.length > 0) {
          if (localStorage.getItem("projects")) {
            localStorage.setItem(
              "projects",
              localStorage.getItem("projects") + " " + this.state.projectName
            );
          } else {
            localStorage.setItem("projects", this.state.projectName);
          }
        }
        setTimeout(() => {
          this.props.history.push(this.state.projectName);
        }, 500);
      }
    );
  };

  handleUploadMultiple = () => {
    const { file1, file2 } = this.state;
    if (
      file1 === null ||
      file2 === null ||
      this.state.projectName.length === 0
    ) {
      return;
    }
    this.setState({
      uploading: true
    });
    const uploadTask = storage
      .ref(`${this.state.projectName}/model/${file1.name}`)
      .put(file1);
    uploadTask.on(
      "state_changed",
      snapshot => {
        // progrss function ....
        const progress = Math.round(
          (snapshot.bytesTransferred / snapshot.totalBytes) * 100
        );
        this.setState({ progress });
      },
      error => {
        // error function ....
        console.log(error);
      },
      () => {
        // complete function ....
        const uploadTask = storage
          .ref(`${this.state.projectName}/model/${file2.name}`)
          .put(file2);
        uploadTask.on(
          "state_changed",
          snapshot => {
            // progrss function ....
            const progress = Math.round(
              (snapshot.bytesTransferred / snapshot.totalBytes) * 100
            );
            this.setState({ progress });
          },
          error => {
            // error function ....
            console.log(error);
          },
          () => {
            console.log("done uploading 2 files");
            this.setState({
              uploading: false
            });
            // create new project
            if (this.state.projectName.length > 0) {
              if (localStorage.getItem("projects")) {
                console.log("IT EXISTS");
                localStorage.setItem(
                  "projects",
                  localStorage.getItem("projects") +
                    " " +
                    this.state.projectName
                );
              } else {
                localStorage.setItem("projects", this.state.projectName);
              }
            }
            setTimeout(() => {
              this.props.history.push(this.state.projectName);
            }, 500);
          }
        );
      }
    );
  };
  render() {
    return (
      <div className="Container">
        <ExistingProjects />
        <div className="NewProject">or create new project</div>
        <div className="Project">
          <div className="Option">Option 1: Upload dataset (.csv)</div>
          <div className="ProjectName">
            Choose a name for the project and upload dataset (.csv)
          </div>
          <input onChange={this.handleProjectName} />
          {this.state.uploading && this.state.file && (
            <progress value={this.state.progress} max="100" />
          )}
          <br />
          <input type="file" onChange={this.handleChange} />
          <button onClick={this.handleUpload}>Upload</button>
        </div>
        <div className="Project">
          <div className="Option">
            Option 2: Upload predefined model with weigths (two files)
          </div>
          <div className="ProjectName">Choose name for the project</div>
          <input onChange={this.handleProjectName} />
          {this.state.uploading && this.state.file1 && this.state.file2 && (
            <progress value={this.state.progress} max="100" />
          )}
          <br />
          <input type="file" onChange={this.handleChangeMultiple} multiple />
          <button onClick={this.handleUploadMultiple}>Upload</button>
        </div>
      </div>
    );
  }
}

export default Upload;
