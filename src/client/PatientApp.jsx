import { useEffect, useRef, useState } from "react";
import { Activity, Calendar, Camera, Clock, MapPin, Users, X } from "lucide-react";
import { Html5Qrcode } from 'html5-qrcode';

const API_BASE = "https://doctor-appointment-suite.onrender.com/api";

function getTodayDate() {
  return new Date().toISOString().slice(0, 10);
}

function StatusBadge({ status }) {
  const styles = {
    waiting: { bg: "#fef3c7", color: "#d97706", label: "En attente" },
    confirmed: { bg: "#dbeafe", color: "#2563eb", label: "Confirmé" },
    treated: { bg: "#dcfce7", color: "#16a34a", label: "Traité" },
    cancelled: { bg: "#fee2e2", color: "#dc2626", label: "Annulé" }
  };
  const s = styles[status] || { bg: "#f3f4f6", color: "#6b7280", label: status };
  return (
    <span style={{ background: s.bg, color: s.color, padding: "2px 8px", borderRadius: "12px", fontSize: "0.7rem", fontWeight: 600 }}>
      {s.label}
    </span>
  );
}

export function PatientApp() {
  const [inputId, setInputId] = useState("");
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [settings, setSettings] = useState(null);
  const [scanState, setScanState] = useState("idle");
  const scannerRef = useRef(null);
  const html5QrRef = useRef(null);

  const loadPatient = async (id) => {
    if (!id) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/patient/${id}`);
      if (!res.ok) throw new Error("Patient non trouvé");
      const data = await res.json();
      setPatient(data);
      setInputId("");
    } catch (err) {
      setError("ID invalide");
      setPatient(null);
    } finally {
      setLoading(false);
    }
  };

  const loadSettings = async () => {
    try {
      const res = await fetch(`${API_BASE}/bootstrap`);
      const data = await res.json();
      setSettings(data.settings);
    } catch (_err) {}
  };

  const startScanner = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setError("Camera non disponible sur cet appareil");
        return;
      }

      setScanState("active");

      html5QrRef.current = new Html5Qrcode("qr-reader");
      
      await html5QrRef.current.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 }
        },
        async (decodedText) => {
          try {
            await html5QrRef.current.stop();
            setScanState("idle");
            await loadPatient(decodedText.trim());
          } catch (_err) {}
        },
        () => {}
      );
      
    } catch (err) {
      console.error('Scanner error:', err);
      setError("Impossible d'activer le scanner. Verifiez les permissions.");
      setScanState("idle");
    }
  };

  const stopScanner = async () => {
    try {
      if (html5QrRef.current && html5QrRef.current.isScanning) {
        await html5QrRef.current.stop();
      }
    } catch (_err) {}
    setScanState("idle");
  };

  useEffect(() => {
    loadSettings();
    return () => {
      if (scanState === "active") {
        stopScanner();
      }
    };
  }, []);

  useEffect(() => {
    if (!patient) return;
    const interval = setInterval(() => loadPatient(patient.patient.id), 5000);
    return () => clearInterval(interval);
  }, [patient]);

  const today = getTodayDate();
  const todayAppt = patient?.appointments?.find(a => a.date === today);
  const myQueue = patient?.queue?.find(q => q.id === todayAppt?.id);
  const myPosition = myQueue?.position;

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <div style={{ background: "linear-gradient(135deg, #0d9488, #0f766e)", padding: "20px 16px 60px", borderRadius: "0 0 24px 24px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ width: "40px", height: "40px", background: "rgba(255,255,255,0.2)", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Activity size={20} color="white" />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: "1rem", fontWeight: 700, color: "white" }}>{settings?.clinicName || "Cabinet OULD MATARI"}</h1>
              <p style={{ margin: 0, fontSize: "0.7rem", color: "rgba(255,255,255,0.8)" }}>Suivi de votre passage</p>
            </div>
          </div>
          {patient && (
            <button onClick={() => setPatient(null)} style={{ background: "rgba(255,255,255,0.2)", border: "none", borderRadius: "8px", padding: "8px", cursor: "pointer" }}>
              <X size={18} color="white" />
            </button>
          )}
        </div>
      </div>

      <div style={{ marginTop: "-40px", padding: "0 12px" }}>
        {scanState === "active" ? (
          <div style={{ background: "white", borderRadius: "16px", padding: "16px", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}>
            <div id="qr-reader" ref={scannerRef} style={{ width: "100%", borderRadius: "12px", overflow: "hidden" }}></div>
            <button
              onClick={stopScanner}
              style={{ width: "100%", marginTop: "12px", padding: "12px", background: "#dc2626", color: "white", border: "none", borderRadius: "10px", fontSize: "0.85rem", fontWeight: 600, cursor: "pointer" }}
            >
              Annuler
            </button>
          </div>
        ) : !patient ? (
          <div style={{ background: "white", borderRadius: "16px", padding: "20px", boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px", color: "#374151" }}>
              <MapPin size={16} color="#0d9488" />
              <span style={{ fontSize: "0.8rem" }}>{settings?.address}</span>
            </div>

            <div style={{ marginBottom: "16px" }}>
              <input
                type="text"
                value={inputId}
                onChange={e => setInputId(e.target.value.toUpperCase())}
                placeholder="Entrez votre ID patient"
                style={{ width: "100%", padding: "12px 14px", border: "2px solid #e5e7eb", borderRadius: "12px", fontSize: "0.95rem", boxSizing: "border-box", outline: "none" }}
                onFocus={e => e.target.style.borderColor = "#0d9488"}
                onBlur={e => e.target.style.borderColor = "#e5e7eb"}
              />
            </div>

            <button
              onClick={() => loadPatient(inputId.trim())}
              disabled={!inputId.trim() || loading}
              style={{ width: "100%", padding: "14px", background: inputId.trim() && !loading ? "#0d9488" : "#d1d5db", color: "white", border: "none", borderRadius: "12px", fontSize: "0.9rem", fontWeight: 600, cursor: inputId.trim() && !loading ? "pointer" : "not-allowed", marginBottom: "12px" }}
            >
              {loading ? "Chargement..." : "Accéder à mon espace"}
            </button>

            <button
              onClick={startScanner}
              style={{ width: "100%", padding: "14px", background: "white", color: "#0d9488", border: "2px solid #0d9488", borderRadius: "12px", fontSize: "0.9rem", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
            >
              <Camera size={18} />
              Scanner QR code
            </button>

            {error && <p style={{ color: "#dc2626", fontSize: "0.85rem", textAlign: "center", margin: "12px 0 0" }}>{error}</p>}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={{ background: "white", borderRadius: "16px", padding: "16px", boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "14px" }}>
                <div style={{ width: "48px", height: "48px", background: "linear-gradient(135deg, #0d9488, #14b8a6)", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ color: "white", fontSize: "1.1rem", fontWeight: 700 }}>{patient.patient.firstName[0]}{patient.patient.lastName[0]}</span>
                </div>
                <div>
                  <h2 style={{ margin: 0, fontSize: "1.05rem", color: "#1f2937" }}>{patient.patient.firstName} {patient.patient.lastName}</h2>
                  <p style={{ margin: "2px 0 0", fontSize: "0.75rem", color: "#6b7280" }}>{patient.patient.id}</p>
                </div>
              </div>

              {todayAppt ? (
                <div style={{ background: "linear-gradient(135deg, #f0fdfa, #ecfdf5)", borderRadius: "12px", padding: "14px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <Calendar size={16} color="#0d9488" />
                    <span style={{ fontSize: "0.85rem", color: "#374151" }}>{todayAppt.time}</span>
                  </div>
                  <StatusBadge status={todayAppt.status} />
                </div>
              ) : (
                <p style={{ color: "#9ca3af", fontSize: "0.85rem", textAlign: "center" }}>Aucun RDV aujourd'hui</p>
              )}
            </div>

            {myPosition && (
              <div style={{ background: "linear-gradient(135deg, #0d9488, #0f766e)", borderRadius: "16px", padding: "20px", boxShadow: "0 4px 12px rgba(0,0,0,0.15)", textAlign: "center" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", marginBottom: "8px", color: "rgba(255,255,255,0.9)" }}>
                  <Users size={16} />
                  <span style={{ fontSize: "0.8rem" }}>Votre position</span>
                </div>
                <div style={{ fontSize: "3.5rem", fontWeight: 800, color: "white", lineHeight: 1 }}>
                  {myPosition}
                </div>
                <p style={{ color: "rgba(255,255,255,0.8)", fontSize: "0.8rem", margin: "8px 0 0" }}>
                  {myPosition === 1 ? "Prochain patient !" : `${myPosition - 1} avant vous`}
                </p>
              </div>
            )}

            {patient.queue && patient.queue.length > 0 && (
              <div style={{ background: "white", borderRadius: "16px", padding: "16px", boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "12px", color: "#374151" }}>
                  <Clock size={14} color="#0d9488" />
                  <span style={{ fontSize: "0.85rem", fontWeight: 600 }}>File d'attente</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {patient.queue.slice(0, 5).map((item, idx) => {
                    const isMe = item.patient.id === patient.patient.id;
                    return (
                      <div key={item.id} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px", background: isMe ? "#f0fdfa" : "#f9fafb", borderRadius: "10px", border: isMe ? "2px solid #0d9488" : "none" }}>
                        <div style={{ width: "26px", height: "26px", background: isMe ? "#0d9488" : "#e5e7eb", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: isMe ? "white" : "#6b7280", fontWeight: 700, fontSize: "0.75rem" }}>
                          {item.position || idx + 1}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 500, color: "#1f2937", fontSize: "0.85rem" }}>{isMe ? "Vous" : item.patient.firstName}</div>
                        </div>
                        <span style={{ fontSize: "0.75rem", color: "#6b7280" }}>{item.time}</span>
                        <StatusBadge status={item.status} />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {patient.appointments && patient.appointments.length > 0 && (
              <div style={{ background: "white", borderRadius: "16px", padding: "16px", boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "12px", color: "#374151" }}>
                  <Calendar size={14} color="#0d9488" />
                  <span style={{ fontSize: "0.85rem", fontWeight: 600 }}>Mes rendez-vous</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  {patient.appointments.map(apt => (
                    <div key={apt.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px", background: "#f9fafb", borderRadius: "8px" }}>
                      <span style={{ fontSize: "0.85rem", color: "#374151" }}>{apt.date}</span>
                      <span style={{ fontSize: "0.85rem", color: "#6b7280" }}>{apt.time}</span>
                      <StatusBadge status={apt.status} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <p style={{ textAlign: "center", marginTop: "24px", fontSize: "0.7rem", color: "#9ca3af", padding: "0 0 20px" }}>
        © {new Date().getFullYear()} {settings?.clinicName || "Cabinet OULD MATARI"}
      </p>
    </div>
  );
}