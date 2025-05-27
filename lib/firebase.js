// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app"
import { getAuth } from "firebase/auth"
import { getFirestore } from "firebase/firestore"
import { getStorage } from "firebase/storage"
import { getAnalytics, isSupported } from "firebase/analytics"

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCYTa0XLxYzovxqMaOM5-vtVM-KtzE2LsI",
  authDomain: "minsuconnect.firebaseapp.com",
  databaseURL: "https://minsuconnect-default-rtdb.firebaseio.com",
  projectId: "minsuconnect",
  storageBucket: "minsuconnect.appspot.com",
  messagingSenderId: "81646025891",
  appId: "1:81646025891:web:ce28789ae5f9fbf58bd316",
  measurementId: "G-4G23R6T64S",
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)

// Initialize Firebase services
const auth = getAuth(app)
const db = getFirestore(app)
const storage = getStorage(app)

// Initialize Analytics conditionally (only in browser)
const initializeAnalytics = async () => {
  if (typeof window !== "undefined") {
    const analyticsSupported = await isSupported()
    if (analyticsSupported) {
      return getAnalytics(app)
    }
  }
  return null
}

const analytics = initializeAnalytics()

export { app, auth, db, storage, analytics }
