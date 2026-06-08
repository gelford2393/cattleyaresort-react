import * as firebase from "firebase";
import "firebase/messaging";

const config = {
  apiKey: "AIzaSyAHgl4Yp5BqZ20iz9mL8c60lWJowYZ3eRo",
  authDomain: "cattleyaresort-firestore.firebaseapp.com",
  databaseURL: "https://cattleyaresort-firestore.firebaseio.com",
  projectId: "cattleyaresort-firestore",
  storageBucket: "cattleyaresort-firestore.appspot.com",
  messagingSenderId: "706703513289"
};
firebase.initializeApp(config);
firebase.messaging();
