import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'

const firebaseConfig = {
  apiKey: "AIzaSyCRBfeoG6KCVi2SfaOjv4Q8yUiJePcYFmc",
  authDomain: "pnc-nikah.firebaseapp.com",
  projectId: "pnc-nikah",
  storageBucket: "pnc-nikah.firebasestorage.app",
  messagingSenderId: "893917202752",
  appId: "1:893917202752:web:21efcfcf85b0b1e4ff2a6b"
}

// Initialize Firebase
export const app = initializeApp(firebaseConfig)

// Initialize Firebase Auth
export const auth = getAuth(app)

export default app