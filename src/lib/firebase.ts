import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import { getFunctions } from 'firebase/functions';

const firebaseConfig = {
  apiKey: "AIzaSyA3bsKOhHbKr7zHtz-xulEpip033AvMbbg",
  authDomain: "cattleyaresort-firestore.firebaseapp.com",
  projectId: "cattleyaresort-firestore",
  storageBucket: "cattleyaresort-firestore.appspot.com",
  messagingSenderId: "706703513289",
  appId: "1:706703513289:web:b524afe6fccc655a681f18",
  databaseURL: "https://cattleyaresort-firestore.firebaseio.com",
  measurementId: "G-NSQ252FR26",
};

const app = initializeApp(firebaseConfig);

export const firestore = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
export const functions = getFunctions(app);
export default app;
