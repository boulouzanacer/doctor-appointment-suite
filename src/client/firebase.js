import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, updateDoc, collection, query, where, getDocs, deleteDoc } from "firebase/firestore";

// IMPORTANT: Replace with your Firebase project configuration
const firebaseConfig = {
  apiKey: "AIzaSyCTvGSJwG06gnKK-d9sgtYX8oGgxCWhfqc",
  authDomain: "doctor-appointment-suite.firebaseapp.com",
  projectId: "doctor-appointment-suite",
  storageBucket: "doctor-appointment-suite.firebasestorage.app",
  messagingSenderId: "342025821668",
  appId: "1:342025821668:web:e2efc42bc75137842b7bf1"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

// Helper to sync an appointment/patient to Firebase
export const syncAppointmentToFirebase = async (appointment, patient) => {
  try {
    // 1. Sync Patient Info
    await setDoc(doc(db, "patients", patient.id), {
      id: patient.id,
      firstName: patient.firstName,
      lastName: patient.lastName,
      status: appointment.status,
      lastUpdated: new Date().toISOString()
    }, { merge: true });

    // 2. Sync to Daily Queue
    await setDoc(doc(db, "queue", appointment.id), {
      id: appointment.id,
      patientId: patient.id,
      firstName: patient.firstName,
      lastName: patient.lastName,
      date: appointment.date,
      time: appointment.time,
      status: appointment.status,
      lastUpdated: new Date().toISOString()
    });
  } catch (e) {
    console.error("Firebase Sync Error: ", e);
  }
};

export const updateFirebaseStatus = async (appointmentId, patientId, status) => {
  try {
    await updateDoc(doc(db, "queue", appointmentId), {
      status: status,
      lastUpdated: new Date().toISOString()
    });
    
    if (patientId) {
      await updateDoc(doc(db, "patients", patientId), {
        status: status,
        lastUpdated: new Date().toISOString()
      });
    }
  } catch (e) {
    console.error("Firebase Update Error: ", e);
  }
};
