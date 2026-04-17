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

export const syncSettingsToFirebase = async (settings) => {
  try {
    await setDoc(doc(db, "app_settings", "global"), {
      showPatientNames: settings.showPatientNames,
      lastUpdated: new Date().toISOString()
    }, { merge: true });
  } catch (e) {
    console.error("Firebase Settings Sync Error: ", e);
  }
};

export const syncAllToFirebase = async (patients, appointments, settings, users) => {
  try {
    console.log("Starting full Firebase sync...");
    
    if (!db) {
      console.error("Firebase DB is not initialized. Check firebaseConfig.");
      throw new Error("Base de données Firebase non initialisée.");
    }

    // 0. Sync Settings
    if (settings) {
      console.log("Syncing settings...");
      await setDoc(doc(db, "app_settings", "global"), {
        showPatientNames: settings.showPatientNames ?? true,
        lastUpdated: new Date().toISOString()
      }, { merge: true });
    }

    // 1. Sync all patients
    console.log(`Syncing ${patients.length} patients...`);
    const patientPromises = patients.map(patient => 
      setDoc(doc(db, "patients", patient.id), {
        id: patient.id,
        firstName: patient.firstName,
        lastName: patient.lastName,
        lastUpdated: new Date().toISOString()
      }, { merge: true })
    );
    await Promise.all(patientPromises);
    console.log("Patients synced!");

    // 2. Sync all users
    if (users && users.length > 0) {
      console.log(`Syncing ${users.length} users...`);
      const userPromises = users.map(user => 
        setDoc(doc(db, "users", user.id), {
          ...user,
          lastUpdated: new Date().toISOString()
        }, { merge: true })
      );
      await Promise.all(userPromises);
      console.log("Users synced!");
    }

    // 3. Sync today's appointments
    const today = new Date().toISOString().slice(0, 10);
    const todayAppts = appointments.filter(a => a.date === today);
    console.log(`Syncing ${todayAppts.length} today's appointments to queue...`);
    
    const queuePromises = todayAppts.map(async (appt) => {
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
        
        await setDoc(doc(db, "patients", patient.id), {
          status: appt.status
        }, { merge: true });
      }
    });
    
    await Promise.all(queuePromises);
    console.log("Queue sync completed successfully!");
    return true;
  } catch (e) {
    console.error("Firebase Full Sync Failed:", e);
    // Include the Firebase error code for easier diagnosis
    const errorWithCode = new Error(e.message || "Erreur de connexion Firebase.");
    errorWithCode.code = e.code;
    throw errorWithCode;
  }
};

export const syncUserToFirebase = async (user) => {
  try {
    await setDoc(doc(db, "users", user.id), {
      ...user,
      lastUpdated: new Date().toISOString()
    }, { merge: true });
  } catch (e) {
    console.error("Firebase User Sync Error: ", e);
  }
};

export const deletePatientFromFirebase = async (patientId) => {
  try {
    console.log(`Deleting patient ${patientId} and their data from Firebase...`);
    
    // 1. Delete patient document
    await deleteDoc(doc(db, "patients", patientId));

    // 2. Delete all queue items for this patient
    const q = query(collection(db, "queue"), where("patientId", "==", patientId));
    const querySnapshot = await getDocs(q);
    const deletePromises = querySnapshot.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(deletePromises);
    
    console.log(`Successfully deleted patient ${patientId} data from Firebase.`);
  } catch (e) {
    console.error("Firebase Delete Patient Error: ", e);
  }
};
