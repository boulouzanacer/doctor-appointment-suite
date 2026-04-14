import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Activity, Calendar, Clock, MapPin, Phone, QrCode, ShieldCheck, Users } from "lucide-react";

const API_BASE = "https://doctor-appointment-suite.onrender.com/api";

function getTodayDate() {
  return new Date().toISOString().slice(0, 10);
}

function StatusBadge({ status }) {
  const styles = {
    waiting: { bg: "rgba(234, 179, 8, 0.15)", color: "#ca8a04", label: "En attente" },
    confirmed: { bg: "rgba(59, 130, 246, 0.15)", color: "#2563eb", label: "Confirmé" },
    treated: { bg: "rgba(34, 197, 94, 0.15)", color: "#16a34a", label: "Traité" },
    cancelled: { bg: "rgba(239, 68, 68, 0.15)", color: "#dc2626", label: "Annulé" }
  };
  const s = styles[status] || { bg: "rgba(107, 114, 128, 0.15)", color: "#6b7280", label: status };
  return (
    <span style={{ background: s.bg, color: s.color, padding: "4px 12px", borderRadius: "20px", fontSize: "0.8rem", fontWeight: 600 }}>
      {s.label}
    </span>
  );
}

export function PatientApp() {
  const [searchParams] = useSearchParams();
  const patientIdFromQR = searchParams.get("id") || "";

  const [inputId, setInputId] = useState("");
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [settings, setSettings] = useState(null);

  const loadPatient = async (id) => {
    if (!id) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/patient/${id}`);
      if (!res.ok) throw new Error("Patient non trouvé");
      const data = await res.json();
      setPatient(data);
    } catch (err) {
      setError("Identifiant invalide. Vérifiez votre ID patient.");
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

  useEffect(() => {
    loadSettings();
    if (patientIdFromQR) {
      setInputId(patientIdFromQR);
      loadPatient(patientIdFromQR);
    }
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
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #0f766e 0%, #115e59 50%, #134e4a 100%)", padding: "20px", fontFamily: "'Manrope', sans-serif" }}>
      <div style={{ maxWidth: "480px", margin: "0 auto" }}>
        {!patient ? (
          <div style={{ background: "white", borderRadius: "24px", padding: "32px 24px", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)" }}>
            <div style={{ textAlign: "center", marginBottom: "28px" }}>
              <div style={{ width: "72px", height: "72px", background: "rgba(15, 118, 110, 0.1)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                <Activity size={36} style={{ color: "#0f766e" }} />
              </div>
              <h1 style={{ fontSize: "1.6rem", fontWeight: 700, margin: "0 0 8px", color: "#1f2937" }}>
                {settings?.clinicName || "Cabinet OULD MATARI"}
              </h1>
              <p style={{ color: "#6b7280", fontSize: "0.9rem", margin: 0 }}>
                Espace patient - Suivi de votre passage
              </p>
            </div>

            {settings && (
              <div style={{ background: "#f9fafb", borderRadius: "12px", padding: "16px", marginBottom: "24px", fontSize: "0.85rem", color: "#4b5563" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                  <MapPin size={16} style={{ color: "#0f766e" }} />
                  <span>{settings.address}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <Phone size={16} style={{ color: "#0f766e" }} />
                  <span>{settings.phone}</span>
                </div>
              </div>
            )}

            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#374151", marginBottom: "8px" }}>
                Entrez votre ID patient
              </label>
              <input
                type="text"
                value={inputId}
                onChange={e => setInputId(e.target.value.toUpperCase())}
                placeholder="Ex: PAT-1001"
                style={{ width: "100%", padding: "14px 16px", border: "2px solid #e5e7eb", borderRadius: "12px", fontSize: "1rem", fontFamily: "inherit", boxSizing: "border-box", outline: "none", transition: "border-color 0.2s" }}
                onFocus={e => e.target.style.borderColor = "#0f766e"}
                onBlur={e => e.target.style.borderColor = "#e5e7eb"}
              />
            </div>

            <button
              onClick={() => loadPatient(inputId.trim())}
              disabled={!inputId.trim() || loading}
              style={{ width: "100%", padding: "16px", background: inputId.trim() && !loading ? "#0f766e" : "#9ca3af", color: "white", border: "none", borderRadius: "12px", fontSize: "1rem", fontWeight: 600, cursor: inputId.trim() && !loading ? "pointer" : "not-allowed", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", transition: "all 0.2s" }}
            >
              {loading ? (
                <span>Chargement...</span>
              ) : (
                <>
                  <ShieldCheck size={20} />
                  Accéder à mon espace
                </>
              )}
            </button>

            {error && (
              <div style={{ marginTop: "16px", padding: "12px 16px", background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.3)", borderRadius: "12px", color: "#dc2626", fontSize: "0.9rem", textAlign: "center" }}>
                {error}
              </div>
            )}

            <p style={{ textAlign: "center", marginTop: "20px", fontSize: "0.8rem", color: "#9ca3af" }}>
              Votre ID patient est disponible sur votre fiche ou QR code
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ background: "white", borderRadius: "24px", padding: "24px", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "20px" }}>
                <div style={{ width: "56px", height: "56px", background: "linear-gradient(135deg, #0f766e, #14b8a6)", borderRadius: "16px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ color: "white", fontSize: "1.4rem", fontWeight: 700 }}>
                    {patient.patient.firstName[0]}{patient.patient.lastName[0]}
                  </span>
                </div>
                <div>
                  <h2 style={{ margin: 0, fontSize: "1.2rem", color: "#1f2937" }}>
                    {patient.patient.firstName} {patient.patient.lastName}
                  </h2>
                  <p style={{ margin: "4px 0 0", fontSize: "0.85rem", color: "#6b7280" }}>
                    ID: {patient.patient.id}
                  </p>
                </div>
              </div>

              {todayAppt ? (
                <div style={{ background: "linear-gradient(135deg, rgba(15, 118, 110, 0.1), rgba(20, 184, 166, 0.1))", borderRadius: "16px", padding: "20px", textAlign: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", marginBottom: "12px", color: "#0f766e" }}>
                    <Calendar size={20} />
                    <span style={{ fontWeight: 600 }}>Rendez-vous d'aujourd'hui</span>
                  </div>
                  <div style={{ fontSize: "2rem", fontWeight: 800, color: "#1f2937", marginBottom: "8px" }}>
                    {todayAppt.time}
                  </div>
                  <StatusBadge status={todayAppt.status} />
                </div>
              ) : (
                <div style={{ background: "#f9fafb", borderRadius: "16px", padding: "20px", textAlign: "center", color: "#6b7280" }}>
                  Aucun rendez-vous prévu aujourd'hui
                </div>
              )}
            </div>

            {myPosition && (
              <div style={{ background: "white", borderRadius: "24px", padding: "28px 24px", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)", textAlign: "center" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", marginBottom: "12px", color: "#0f766e" }}>
                  <Users size={24} />
                  <span style={{ fontWeight: 600, fontSize: "1.1rem" }}>Votre position dans la file</span>
                </div>
                <div style={{ fontSize: "5rem", fontWeight: 800, color: "#0f766e", lineHeight: 1, marginBottom: "8px" }}>
                  {myPosition}
                </div>
                <p style={{ color: "#6b7280", fontSize: "0.9rem", margin: 0 }}>
                  {myPosition === 1 ? "Vous êtes le prochain !" : `Il y a ${myPosition - 1} patient(s) avant vous`}
                </p>
                <div style={{ marginTop: "16px", padding: "12px", background: "#f0fdfa", borderRadius: "12px", fontSize: "0.85rem", color: "#0f766e" }}>
                  ⏱️ Mise à jour automatique toutes les 5 secondes
                </div>
              </div>
            )}

            {patient.queue && patient.queue.length > 0 && (
              <div style={{ background: "white", borderRadius: "24px", padding: "24px", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px", color: "#1f2937" }}>
                  <Clock size={20} />
                  <span style={{ fontWeight: 600 }}>Classement du jour</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {patient.queue.map((item, idx) => {
                    const isMe = item.patient.id === patient.patient.id;
                    return (
                      <div key={item.id} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px", background: isMe ? "#f0fdfa" : "#f9fafb", borderRadius: "12px", border: isMe ? "2px solid #0f766e" : "none" }}>
                        <div style={{ width: "32px", height: "32px", background: isMe ? "#0f766e" : "#e5e7eb", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: isMe ? "white" : "#6b7280", fontWeight: 700, fontSize: "0.85rem" }}>
                          {item.position || idx + 1}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600, color: "#1f2937", fontSize: "0.95rem" }}>
                            {isMe ? "Vous" : `${item.patient.firstName} ${item.patient.lastName}`}
                          </div>
                          <div style={{ fontSize: "0.8rem", color: "#6b7280" }}>{item.time}</div>
                        </div>
                        <StatusBadge status={item.status} />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {patient.appointments && patient.appointments.length > 0 && (
              <div style={{ background: "white", borderRadius: "24px", padding: "24px", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px", color: "#1f2937" }}>
                  <Calendar size={20} />
                  <span style={{ fontWeight: 600 }}>Mes rendez-vous</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {patient.appointments.map(apt => (
                    <div key={apt.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px", background: "#f9fafb", borderRadius: "12px" }}>
                      <div>
                        <div style={{ fontWeight: 600, color: "#1f2937" }}>{apt.date}</div>
                        <div style={{ fontSize: "0.85rem", color: "#6b7280" }}>{apt.time}</div>
                      </div>
                      <StatusBadge status={apt.status} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={() => { setPatient(null); setInputId(""); }}
              style={{ padding: "14px", background: "rgba(255,255,255,0.2)", color: "white", border: "2px solid rgba(255,255,255,0.3)", borderRadius: "12px", fontSize: "0.95rem", fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}
            >
              Se déconnecter
            </button>
          </div>
        )}

        <p style={{ textAlign: "center", marginTop: "20px", fontSize: "0.75rem", color: "rgba(255,255,255,0.6)" }}>
          © {new Date().getFullYear()} {settings?.clinicName || "Cabinet OULD MATARI"}
        </p>
      </div>
    </div>
  );
}