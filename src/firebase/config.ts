import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'

const firebaseConfig = {
  apiKey: "AIzaSyCGMfMlLJk65tcQi1_IocJKI-KD11mfGpE",
  authDomain: "pnc-nikah.firebaseapp.com",
  projectId: "pnc-nikah",
  storageBucket: "pnc-nikah.appspot.com",
  messagingSenderId: "893917202752",
  appId: "1:893917202752:web:37d31a29adbf37bcd712a5"
}

// Initialize Firebase
export const app = initializeApp(firebaseConfig)

// Initialize Firebase Auth
export const auth = getAuth(app)

// Enable emulator in development if needed
// Uncomment below to use Firebase emulator for local development
// if (import.meta.env.VITE_NODE_ENV === 'development') {
//   connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true })
// }

export default app