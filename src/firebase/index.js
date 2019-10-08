import firebase from "firebase/app";
import "firebase/storage";

var firebaseConfig = {
  apiKey: "AIzaSyAdr81xGgKzcD19-2u7TUQ59aPQ5ZT6Mkw",
  authDomain: "tpk4450-project.firebaseapp.com",
  databaseURL: "https://tpk4450-project.firebaseio.com",
  projectId: "tpk4450-project",
  storageBucket: "tpk4450-project.appspot.com",
  messagingSenderId: "672265109486",
  appId: "1:672265109486:web:84ad782c92bc7c5ff218ff",
  measurementId: "G-ZJQB5L0305"
};
// Initialize Firebase
firebase.initializeApp(firebaseConfig);

const storage = firebase.storage();

export { storage, firebase as default };
