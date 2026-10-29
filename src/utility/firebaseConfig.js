// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBSMpSIRLAze-qMq50xlLmAOyOt2lS_PcM",
  authDomain: "shopopedia-f5651.firebaseapp.com",
  projectId: "shopopedia-f5651",
  storageBucket: "shopopedia-f5651.firebasestorage.app",
  messagingSenderId: "438845988694",
  appId: "1:438845988694:web:e83566357f1912f5bc80f7",
  measurementId: "G-4QT4ZFMD99"
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)
const auth = getAuth(app)
const db = getFirestore(app)
export { app as firebaseApp, auth, db }