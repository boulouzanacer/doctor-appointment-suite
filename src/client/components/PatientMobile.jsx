import { useEffect, useMemo, useRef, useState } from "react";
import { Camera, QrCode, ScanLine, ShieldCheck } from "lucide-react";

function StatusBadge({ status }) {
  const labelMap = {
    confirmed: "Confirmé",
    waiting: "En attente",
    treated: "Traité",
    cancelled: "Annulé"
  };

  return <span className={`status status-${status}`}>{labelMap[status] || status}</span>;
}

function QueueItem({ item, myId }) {
  return (
    <div className={`queue-line ${item.patient.id === myId ? "queue-line-me" : ""}`}>
      <span className="queue-rank">{item.position}</span>
      <div>
        <strong>{item.patient.id === myId ? "Vous" : `${item.patient.firstName} ${item.patient.lastName}`}</strong>
        <small>{item.time}</small>
      </div>
      <StatusBadge status={item.status} />
    </div>
  );
}

export function PatientMobile({ apiUrl, settings }) {
  const [patientId, setPatientId] = useState("");
  const [inputValue, setInputValue] = useState("");
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [scanState, setScanState] = useState("idle");
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const loadPatient = async (id) => {
    if (!id) return;
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${apiUrl}/patient/${id}`);
      if (!response.ok) {
        throw new Error("not-found");
      }
      const data = await response.json();
      setProfile(data);
      setPatientId(id);
    } catch (loadError) {
      setError("Identifiant patient invalide.");
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!patientId) return;
    // Refresh patient profile every 5 seconds (polling)
    const interval = setInterval(() => loadPatient(patientId), 5000);
    return () => clearInterval(interval);
  }, [patientId]);

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        for (const track of streamRef.current.getTracks()) {
          track.stop();
        }
      }
    };
  }, []);

  const startScanner = async () => {
    if (!("BarcodeDetector" in window) || !navigator.mediaDevices?.getUserMedia) {
      setScanState("unsupported");
      return;
    }

    try {
      const detector = new window.BarcodeDetector({ formats: ["qr_code"] });
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }
      });
      let stopped = false;

      streamRef.current = stream;
      setScanState("active");

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      const loop = async () => {
        if (!videoRef.current || stopped) {
          return;
        }

        try {
          const codes = await detector.detect(videoRef.current);
          if (codes[0]?.rawValue) {
            const value = codes[0].rawValue.trim();
            setInputValue(value);
            setScanState("done");
            stopped = true;
            for (const track of stream.getTracks()) {
              track.stop();
            }
            streamRef.current = null;
            await loadPatient(value);
            return;
          }
        } catch (_scanError) {
          setScanState("error");
          stopped = true;
          return;
        }

        window.requestAnimationFrame(loop);
      };

      window.requestAnimationFrame(loop);
    } catch (_cameraError) {
      setScanState("error");
    }
  };

  const upcomingAppointments = useMemo(() => profile?.appointments || [], [profile]);

  return (
    <div className="mobile-shell">
      <section className="mobile-hero">
        <p className="eyebrow">{settings?.clinicName || "Espace patient"}</p>
        <h1>Suivi de votre passage</h1>
        <p className="helper-text" style={{ marginBottom: "12px" }}>
          {settings?.address} <br />
          {settings?.phone}
        </p>
        <p>
          Scannez votre QR code patient ou saisissez votre identifiant pour voir votre
          rendez-vous et votre position du jour en direct.
        </p>
      </section>

      <section className="mobile-card">
        <div className="mobile-card-header">
          <QrCode size={18} />
          <strong>Identification patient</strong>
        </div>
        <form
          className="mobile-auth"
          onSubmit={(event) => {
            event.preventDefault();
            loadPatient(inputValue.trim());
          }}
        >
          <input
            className="input"
            placeholder="Ex: PAT-1001"
            value={inputValue}
            onChange={(event) => setInputValue(event.target.value)}
          />
          <button className="button button-primary" type="submit">
            <ShieldCheck size={16} />
            Se connecter
          </button>
        </form>
        <button className="button button-soft" type="button" onClick={startScanner}>
          <Camera size={16} />
          Scanner le QR code
        </button>
        {scanState === "active" ? (
          <video className="scanner-video" ref={videoRef} playsInline muted />
        ) : null}
        <p className="helper-text">
          Le QR contient simplement l&apos;identifiant patient. Si le scan caméra n&apos;est pas
          disponible sur l&apos;appareil, la saisie manuelle de l&apos;ID reste possible.
        </p>
        {scanState === "unsupported" ? (
          <p className="helper-text">Le scan caméra n&apos;est pas pris en charge sur cet appareil.</p>
        ) : null}
        {scanState === "error" ? (
          <p className="helper-text">Impossible d&apos;accéder à la caméra ou de lire le QR code.</p>
        ) : null}
      </section>

      {loading ? <section className="mobile-card">Chargement...</section> : null}
      {error ? <section className="mobile-card error-card">{error}</section> : null}

      {profile ? (
        <>
          <section className="mobile-card">
            <div className="mobile-card-header">
              <ScanLine size={18} />
              <strong>
                {profile.patient.firstName} {profile.patient.lastName}
              </strong>
            </div>
            <div className="mobile-metric-grid">
              <div className="mobile-metric">
                <span>Mon ID</span>
                <strong>{profile.patient.id}</strong>
              </div>
              <div className="mobile-metric">
                <span>Position du jour</span>
                <strong>{profile.myPosition || "Aucun rendez-vous aujourd'hui"}</strong>
              </div>
            </div>
          </section>

          <section className="mobile-card">
            <div className="mobile-card-header">
              <ShieldCheck size={18} />
              <strong>Mes rendez-vous</strong>
            </div>
            <div className="stack-list">
              {upcomingAppointments.map((appointment) => (
                <div key={appointment.id} className="appointment-tile">
                  <div>
                    <strong>{appointment.date}</strong>
                    <small>{appointment.time}</small>
                  </div>
                  <StatusBadge status={appointment.status} />
                </div>
              ))}
            </div>
          </section>

          {profile.queue.length ? (
            <section className="mobile-card">
              <div className="mobile-card-header">
                <ScanLine size={18} />
                <strong>Classement du jour</strong>
              </div>
              <div className="stack-list">
                {profile.queue.map((item) => (
                  <QueueItem key={item.id} item={item} myId={profile.patient.id} />
                ))}
              </div>
            </section>
          ) : (
            <section className="mobile-card">
              Aucun classement visible: la file n&apos;est affichée qu&apos;aux patients ayant un
              rendez-vous aujourd&apos;hui.
            </section>
          )}
        </>
      ) : null}
    </div>
  );
}
