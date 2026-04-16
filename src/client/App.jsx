import { useEffect, useState } from "react";
import { LayoutDashboard, LockKeyhole, ShieldCheck, Smartphone } from "lucide-react";
import { Navigate, NavLink, Route, Routes } from "react-router-dom";
import { AdminDashboard } from "./components/AdminDashboard";
import { useClinicData } from "./hooks/useClinicData";
import { syncAppointmentToFirebase, updateFirebaseStatus, syncAllToFirebase } from "./firebase";

function LoginScreen({ onLogin, loginError }) {
  const [credentials, setCredentials] = useState({
    username: "",
    password: ""
  });

  return (
    <div className="login-shell">
      <section className="login-card">
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <div style={{ 
            width: "64px", 
            height: "64px", 
            background: "rgba(15, 118, 110, 0.1)", 
            borderRadius: "20px", 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "center",
            margin: "0 auto 16px",
            color: "var(--primary)"
          }}>
            <ShieldCheck size={32} />
          </div>
          <h1 style={{ fontSize: "1.75rem", margin: "0 0 8px" }}>Connexion</h1>
          <p className="hero-copy" style={{ fontSize: "0.9rem" }}>
            Veuillez vous identifier pour accéder au système.
          </p>
        </div>

        <form
          className="form-grid"
          onSubmit={(event) => {
            event.preventDefault();
            onLogin(credentials);
          }}
        >
          <div style={{ display: "grid", gap: "16px" }}>
            <div>
              <label className="field-label">Nom d&apos;utilisateur</label>
              <input
                className="input"
                value={credentials.username}
                onChange={(event) =>
                  setCredentials((current) => ({ ...current, username: event.target.value }))
                }
                placeholder="Identifiant"
                required
              />
            </div>
            <div>
              <label className="field-label">Mot de passe</label>
              <input
                className="input"
                type="password"
                value={credentials.password}
                onChange={(event) =>
                  setCredentials((current) => ({ ...current, password: event.target.value }))
                }
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <button className="button button-primary" type="submit" style={{ marginTop: "12px", width: "100%", height: "52px" }}>
            <LockKeyhole size={18} />
            Se connecter
          </button>
        </form>
        {loginError ? (
          <div className="notice-card notice-error" style={{ marginTop: "20px", justifyContent: "center" }}>
            {loginError}
          </div>
        ) : null}
      </section>
    </div>
  );
}

export default function App() {
  const {
    API_URL,
    settings,
    users,
    patients,
    appointments,
    queueToday,
    availableSlots,
    loading,
    error,
    reload,
    updateInterval,
    updateVisibility
  } = useClinicData();

  const [isCapacitor, setIsCapacitor] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && (window.Capacitor || window.capacitor)) {
      setIsCapacitor(true);
    }
  }, []);

  const selectedDateDefault = new Date().toISOString().slice(0, 10);
  const [selectedDate, setSelectedDate] = useState(selectedDateDefault);
  const [slotsForDate, setSlotsForDate] = useState(availableSlots);
  const [currentUser, setCurrentUser] = useState(() => {
    const raw = window.localStorage.getItem("ouldmatari-user");
    return raw ? JSON.parse(raw) : null;
  });
  const [loginError, setLoginError] = useState("");

  useEffect(() => {
    setSlotsForDate(availableSlots);
  }, [availableSlots]);

  const refreshSlots = async (date) => {
    const response = await fetch(`${API_URL}/slots?date=${date}`);
    const slots = await response.json();
    setSlotsForDate(slots);
  };

  const login = async (payload) => {
    setLoginError("");
    const response = await fetch(`${API_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      setLoginError("Utilisateur ou mot de passe invalide.");
      return;
    }

    const data = await response.json();
    setCurrentUser(data.user);
    window.localStorage.setItem("ouldmatari-user", JSON.stringify(data.user));
  };

  const logout = () => {
    setCurrentUser(null);
    window.localStorage.removeItem("ouldmatari-user");
  };

  const onUpdateInterval = async (interval) => {
    await updateInterval(interval);
    await refreshSlots(selectedDate);
    // Sync settings to Firebase
    await syncSettingsToFirebase({ ...settings, appointmentInterval: interval });
  };

  const onUpdateVisibility = async (showPatientNames) => {
    await updateVisibility(showPatientNames);
    // Sync settings to Firebase
    await syncSettingsToFirebase({ ...settings, showPatientNames });
  };

  const createPatient = async (payload) => {
    await fetch(`${API_URL}/patients`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    await reload();
  };

  const createAppointment = async (payload) => {
    const response = await fetch(`${API_URL}/appointments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      alert("Le creneau choisi est deja reserve.");
      return;
    }

    const data = await response.json();
    // Sync to Firebase for real-time Flutter updates
    if (data.appointment && data.patient) {
      await syncAppointmentToFirebase(data.appointment, data.patient);
    }

    await refreshSlots(selectedDate);
    await reload();
  };

  const createUser = async (payload) => {
    const response = await fetch(`${API_URL}/users`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-user-role": currentUser?.role || ""
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    if (!response.ok) {
      alert(data.message || "Impossible d'ajouter l'utilisateur.");
      return;
    }

    await reload();
  };

  const updateUser = async (id, payload) => {
    const response = await fetch(`${API_URL}/users/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "x-user-role": currentUser?.role || ""
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const data = await response.json();
      alert(data.message || "Impossible de modifier l'utilisateur.");
      return;
    }

    await reload();
  };

  const markStatus = async (appointmentId, status) => {
    // 1. Update backend (local JSON)
    await fetch(`${API_URL}/appointments/${appointmentId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status })
    });

    // 2. Find patientId to sync to Firebase
    const appt = appointments.find(a => a.id === appointmentId);
    if (appt) {
      await updateFirebaseStatus(appointmentId, appt.patientId, status);
    }

    await reload();
  };

  if (loading) {
    return <div className="app-shell loading-screen">Chargement de l&apos;application...</div>;
  }

  if (error) {
    return <div className="app-shell loading-screen">{error}</div>;
  }

  return (
    <div className="app-shell">
      <Routes>
        <Route
          path="/"
          element={
            currentUser ? (
              <AdminDashboard
                currentUser={currentUser}
                onLogout={logout}
                settings={settings}
                users={users}
                patients={patients}
                appointments={appointments}
                queueToday={queueToday}
                selectedDate={selectedDate}
                setSelectedDate={setSelectedDate}
                availableSlots={slotsForDate}
                onRefreshSlots={refreshSlots}
                onCreatePatient={createPatient}
                onCreateAppointment={createAppointment}
                onCreateUser={createUser}
                onUpdateUser={updateUser}
                onUpdateInterval={onUpdateInterval}
                onUpdateVisibility={onUpdateVisibility}
                onMarkStatus={markStatus}
                onSyncAll={() => syncAllToFirebase(patients, appointments, settings)}
              />
            ) : (
              <LoginScreen onLogin={login} loginError={loginError} />
            )
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}
