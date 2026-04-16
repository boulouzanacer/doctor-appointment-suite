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

export const syncAllToFirebase = async (patients, appointments) => {
  try {
    console.log("Starting full Firebase sync...");
    
    // 1. Sync all patients
    for (const patient of patients) {
      await setDoc(doc(db, "patients", patient.id), {
        id: patient.id,
        firstName: patient.firstName,
        lastName: patient.lastName,
        lastUpdated: new Date().toISOString()
      }, { merge: true });
    }

    // 2. Sync all today's appointments to queue
    const today = new Date().toISOString().slice(0, 10);
    const todayAppts = appointments.filter(a => a.date === today);
    
    for (const appt of todayAppts) {
      const patient = patients.find(p => p.id === appt.patientId);
      if (patient) {
        await setDoc(doc(db, "queue", appt.id), {
          id: appt.id,
          patientId: patient.id,
          firstName: patient.firstName,
          lastName: patient.lastName,
          date: appt.date,
          time: appt.time,
          status: appt.status,
          lastUpdated: new Date().toISOString()
        });
        
        // Also update the status on the patient record
        await updateDoc(doc(db, "patients", patient.id), {
          status: appt.status
        });
      }
    }
    
    console.log("Firebase sync completed!");
    return true;
  } catch (e) {
    console.error("Full Sync Error: ", e);
    return false;
  }
};
