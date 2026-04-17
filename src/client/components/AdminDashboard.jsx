import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CalendarDays,
  Clock3,
  Edit,
  LayoutDashboard,
  Printer,
  QrCode,
  Settings,
  Shield,
  ShieldCheck,
  Search,
  UserCog,
  UserPlus,
  Users,
  X
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

const sections = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "patients", label: "Patients", icon: Users },
  { id: "appointments", label: "Rendez-vous", icon: CalendarDays },
  { id: "users", label: "Utilisateurs", icon: UserCog },
  { id: "settings", label: "Paramètres", icon: Settings }
];

function Modal({ isOpen, onClose, title, children }) {
  if (!isOpen) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{title}</h2>
          <button className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function formatPatientName(patient) {
  return `${patient.firstName} ${patient.lastName}`;
}

function StatusBadge({ status }) {
  const labelMap = {
    confirmed: "Confirmé",
    waiting: "En attente",
    treated: "Traité",
    cancelled: "Annulé"
  };

  return <span className={`status status-${status}`}>{labelMap[status] || status}</span>;
}

function Sidebar({ currentSection, setCurrentSection, currentUser, onLogout }) {
  const filteredSections = sections.filter(section => {
    if (section.id === "users") return currentUser.role === "admin";
    return true;
  });

  return (
    <aside className="sidebar-shell">
      <div className="sidebar-brand">
        <p className="eyebrow">Cabinet</p>
        <strong>OULD MATARI</strong>
      </div>

      <nav className="sidebar-nav">
        {filteredSections.map((section) => {
          const Icon = section.icon;
          return (
            <button
              key={section.id}
              className={`sidebar-link ${
                currentSection === section.id ? "sidebar-link-active" : ""
              }`}
              type="button"
              onClick={() => setCurrentSection(section.id)}
            >
              <Icon size={18} />
              {section.label}
            </button>
          );
        })}
      </nav>

      <div className="sidebar-user">
        <div className="sidebar-user-info">
          <strong>{currentUser.fullName}</strong>
          <small>{currentUser.role === "admin" ? "Administrateur" : "Utilisateur simple"}</small>
        </div>
        <button className="button button-soft" type="button" onClick={onLogout}>
          Déconnexion
        </button>
      </div>
    </aside>
  );
}

function DashboardSection({ settings, patients, appointments, queueToday, users, currentUser }) {
  const today = new Date().toISOString().slice(0, 10);
  const todayAppointments = appointments.filter((item) => item.date === today);
  const treatedCount = appointments.filter((item) => item.status === "treated").length;
  const adminCount = users.filter((item) => item.role === "admin").length;

  return (
    <div className="admin-content-grid">
      <section className="hero-card">
        <div className="hero-info">
          <p className="eyebrow">Bonjour, {currentUser?.fullName}</p>
          <h1>{settings?.clinicName || "Cabinet médical"}</h1>
          <div className="hero-contact-info">
            <p className="hero-address">{settings?.address}</p>
            <p className="hero-phone">{settings?.phone}</p>
          </div>
        </div>
        <div className="hero-metrics">
          <div className="metric-card metric-card-primary">
            <div className="metric-icon">
              <CalendarDays size={20} />
            </div>
            <div className="metric-data">
              <strong>{todayAppointments.length}</strong>
              <span>Rendez-vous</span>
              <small>aujourd&apos;hui</small>
            </div>
          </div>
          <div className="metric-card metric-card-accent">
            <div className="metric-icon">
              <Users size={20} />
            </div>
            <div className="metric-data">
              <strong>{patients.length}</strong>
              <span>Patients</span>
              <small>inscrits</small>
            </div>
          </div>
          <div className="metric-card metric-card-success">
            <div className="metric-icon">
              <Shield size={20} />
            </div>
            <div className="metric-data">
              <strong>{users.length}</strong>
              <span>Utilisateurs</span>
              <small>actifs</small>
            </div>
          </div>
        </div>
      </section>

      <section className="card">
        <div className="card-header">
          <div>
            <p className="eyebrow">Statistiques</p>
            <h2>Indicateurs clés</h2>
          </div>
        </div>
        <div className="stats-stack">
          <div className="stat-row">
            <span>Patients traités</span>
            <strong>{treatedCount}</strong>
          </div>
          <div className="stat-row">
            <span>En attente aujourd&apos;hui</span>
            <strong>{queueToday.filter((item) => item.status !== "treated").length}</strong>
          </div>
          <div className="stat-row">
            <span>Intervalle actuel</span>
            <strong>{settings?.appointmentInterval} min</strong>
          </div>
          {currentUser.role === "admin" && (
            <div className="stat-row">
              <span>Admins</span>
              <strong>{adminCount}</strong>
            </div>
          )}
        </div>
      </section>

      <section className="card">
        <div className="card-header">
          <div>
            <p className="eyebrow">File du jour</p>
            <h2>Ordre de passage</h2>
          </div>
          <div className="badge-pulse">En direct</div>
        </div>
        <div className="queue-stack">
          {queueToday.length ? (
            queueToday.map((item) => (
              <div key={item.id} className={`queue-tile ${item.status === "treated" ? "queue-tile-treated" : ""}`}>
                <div className="queue-position">
                  {item.status === "treated" ? (
                    <ShieldCheck size={16} />
                  ) : (
                    <span>{item.position}</span>
                  )}
                </div>
                <div className="queue-info">
                  <strong>{formatPatientName(item.patient)}</strong>
                  <div className="queue-meta">
                    <Clock3 size={12} />
                    <span>{item.time}</span>
                  </div>
                </div>
                <div className="queue-status">
                  <StatusBadge status={item.status} />
                </div>
              </div>
            ))
          ) : (
            <div className="notice-card">Aucun patient en file aujourd&apos;hui.</div>
          )}
        </div>
      </section>
    </div>
  );
}

function PatientsSection({ patients, onCreatePatient, onDeletePatient }) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [patientToDelete, setPatientToDelete] = useState(null);
  const [deleteConfirmName, setDeleteConfirmName] = useState("");
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientForm, setPatientForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    birthDate: "",
    nin: "",
    note: ""
  });

  const handleShowQR = (patient) => {
    setSelectedPatient(patient);
    setIsQRModalOpen(true);
  };

  const handlePrintQR = (patient) => {
    setSelectedPatient(patient);
    // Use a small delay to ensure the content is rendered for printing
    setTimeout(() => {
      window.print();
    }, 100);
  };

  const openDeleteModal = (patient) => {
    setPatientToDelete(patient);
    setDeleteConfirmName("");
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (patientToDelete && deleteConfirmName === formatPatientName(patientToDelete)) {
      onDeletePatient(patientToDelete.id);
      setIsDeleteModalOpen(false);
      setPatientToDelete(null);
    }
  };

  return (
    <div className="admin-content-grid">
      <section className="card card-wide">
        <div className="card-header">
          <div>
            <p className="eyebrow">Gestion des patients</p>
            <h2>Liste des patients</h2>
          </div>
          <button
            className="button button-primary"
            onClick={() => setIsAddModalOpen(true)}
          >
            <UserPlus size={18} />
            Nouveau Patient
          </button>
        </div>

        <div className="table-shell">
          {patients.length ? (
            <table className="patient-list-table">
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>NIN</th>
                  <th>Contact</th>
                  <th>Date de naissance</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {patients.map((patient) => (
                  <tr key={patient.id}>
                    <td>
                      <div className="patient-name">{formatPatientName(patient)}</div>
                      <div className="patient-info-small">ID: {patient.id}</div>
                    </td>
                    <td>
                      <code style={{ background: "rgba(15, 118, 110, 0.05)", padding: "4px 8px", borderRadius: "8px", fontWeight: "700" }}>
                        {patient.nin || "N/A"}
                      </code>
                    </td>
                    <td>{patient.phone || "N/A"}</td>
                    <td>{patient.birthDate || "N/A"}</td>
                    <td>
                      <div style={{ display: "flex", justifyContent: "flex-end" }}>
                        <button
                          className="icon-button"
                          title="Voir QR Code"
                          onClick={() => handleShowQR(patient)}
                        >
                          <QrCode size={18} />
                        </button>
                        <button
                          className="icon-button icon-button-print"
                          title="Imprimer ticket"
                          onClick={() => handlePrintQR(patient)}
                        >
                          <Printer size={18} />
                        </button>
                        <button
                          className="icon-button"
                          style={{ background: "rgba(220, 38, 38, 0.1)", color: "var(--danger)" }}
                          title="Supprimer le patient"
                          onClick={() => openDeleteModal(patient)}
                        >
                          <X size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="notice-card">Aucun patient enregistré pour le moment.</div>
          )}
        </div>
      </section>

      {/* Modal Suppression Patient (Professionnel) */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Confirmer la suppression"
      >
        <div className="modal-danger">
          <div className="alert-banner">
            <div className="alert-banner-icon">
              <AlertTriangle size={24} />
            </div>
            <div className="alert-banner-content">
              <p>
                Cette action est irréversible. Toutes les données associées à{" "}
                <strong>{patientToDelete ? formatPatientName(patientToDelete) : ""}</strong>{" "}
                (rendez-vous, historique) seront définitivement supprimées.
              </p>
            </div>
          </div>

          <div className="confirmation-input-group">
            <label>Saisissez le nom complet du patient pour confirmer :</label>
            <input
              className="input"
              value={deleteConfirmName}
              placeholder={patientToDelete ? formatPatientName(patientToDelete) : ""}
              onChange={(e) => setDeleteConfirmName(e.target.value)}
              autoFocus
            />
          </div>

          <div className="confirmation-actions">
            <button
              className="button button-soft"
              onClick={() => setIsDeleteModalOpen(false)}
            >
              Annuler
            </button>
            <button
              className="button button-danger"
              disabled={!patientToDelete || deleteConfirmName !== formatPatientName(patientToDelete)}
              onClick={confirmDelete}
            >
              Supprimer définitivement
            </button>
          </div>
        </div>
      </Modal>

      {/* Printable Area */}
      {selectedPatient && (
        <div className="printable-qr" style={{ display: 'none' }}>
          <h2>{formatPatientName(selectedPatient)}</h2>
          <QRCodeSVG value={selectedPatient.id} size={180} />
          <p>ID: {selectedPatient.id}</p>
          <p>NIN: {selectedPatient.nin}</p>
          <p>Cabinet Médical - Ticket Patient</p>
        </div>
      )}

      {/* Modal Ajout Patient */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Ajouter un nouveau patient"
      >
        <form
          className="form-grid"
          onSubmit={(event) => {
            event.preventDefault();
            // Validation NIN
            if (patientForm.nin.length !== 18 || !/^\d+$/.test(patientForm.nin)) {
              alert("Le NIN doit contenir exactement 18 chiffres.");
              return;
            }
            onCreatePatient(patientForm);
            setPatientForm({
              firstName: "",
              lastName: "",
              phone: "",
              birthDate: "",
              nin: "",
              note: ""
            });
            setIsAddModalOpen(false);
          }}
        >
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <div>
              <label className="field-label">Prénom</label>
              <input
                className="input"
                value={patientForm.firstName}
                onChange={(event) =>
                  setPatientForm((current) => ({ ...current, firstName: event.target.value }))
                }
                required
              />
            </div>
            <div>
              <label className="field-label">Nom</label>
              <input
                className="input"
                value={patientForm.lastName}
                onChange={(event) =>
                  setPatientForm((current) => ({ ...current, lastName: event.target.value }))
                }
                required
              />
            </div>
          </div>
          <label className="field-label">NIN (18 chiffres)</label>
          <input
            className="input"
            value={patientForm.nin}
            maxLength={18}
            placeholder="Ex: 123456789012345678"
            onChange={(event) => {
              const val = event.target.value.replace(/\D/g, ""); // Only numbers
              if (val.length <= 18) {
                setPatientForm((current) => ({ ...current, nin: val }));
              }
            }}
            required
          />
          <label className="field-label">Téléphone</label>
          <input
            className="input"
            value={patientForm.phone}
            onChange={(event) =>
              setPatientForm((current) => ({ ...current, phone: event.target.value }))
            }
            required
          />
          <label className="field-label">Date de naissance</label>
          <input
            className="input"
            type="date"
            value={patientForm.birthDate}
            onChange={(event) =>
              setPatientForm((current) => ({ ...current, birthDate: event.target.value }))
            }
            required
          />
          <label className="field-label">Observation</label>
          <textarea
            className="input textarea"
            value={patientForm.note}
            onChange={(event) =>
              setPatientForm((current) => ({ ...current, note: event.target.value }))
            }
          />
          <div style={{ marginTop: "12px", display: "flex", gap: "12px" }}>
            <button
              className="button button-soft"
              type="button"
              style={{ flex: 1 }}
              onClick={() => setIsAddModalOpen(false)}
            >
              Annuler
            </button>
            <button className="button button-primary" type="submit" style={{ flex: 2 }}>
              Enregistrer le patient
            </button>
          </div>
        </form>
      </Modal>


      {/* Modal QR Code */}
      <Modal
        isOpen={isQRModalOpen}
        onClose={() => setIsQRModalOpen(false)}
        title="QR Code du Patient"
      >
        {selectedPatient && (
          <div className="qr-preview">
            <div className="qr-shell">
              <QRCodeSVG value={selectedPatient.id} size={200} />
            </div>
            <div className="qr-info">
              <h3>{formatPatientName(selectedPatient)}</h3>
              <p className="patient-info-small">ID: {selectedPatient.id}</p>
              <p>{selectedPatient.phone}</p>
            </div>
            <button
              className="button button-primary"
              onClick={() => handlePrintQR(selectedPatient)}
            >
              <Printer size={18} />
              Imprimer le ticket
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
}


function AppointmentsSection({
  patients,
  appointments,
  selectedDate,
  setSelectedDate,
  availableSlots,
  onRefreshSlots,
  onCreateAppointment,
  onMarkStatus
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPatientSearchOpen, setIsPatientSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [appointmentForm, setAppointmentForm] = useState({
    patientId: "",
    date: selectedDate,
    time: ""
  });

  const selectedPatient = useMemo(
    () => patients.find((p) => p.id === appointmentForm.patientId),
    [patients, appointmentForm.patientId]
  );

  const filteredPatients = useMemo(() => {
    if (!searchQuery) return patients;
    const q = searchQuery.toLowerCase();
    return patients.filter((p) => {
      const fullName = formatPatientName(p).toLowerCase();
      const dob = p.birthDate || "";
      const nin = p.nin || "";
      const phone = p.phone || "";
      return (
        fullName.includes(q) ||
        dob.includes(q) ||
        nin.includes(q) ||
        phone.includes(q)
      );
    });
  }, [patients, searchQuery]);

  useEffect(() => {
    setAppointmentForm((current) => ({
      ...current,
      date: selectedDate,
      time: ""
    }));
    onRefreshSlots(selectedDate);
  }, [selectedDate]);

  const groupedAppointments = useMemo(
    () => appointments.filter((appointment) => appointment.date === selectedDate),
    [appointments, selectedDate]
  );

  return (
    <div className="admin-content-grid">
      <section className="card card-wide">
        <div className="card-header">
          <div>
            <p className="eyebrow">Calendrier</p>
            <h2>Rendez-vous du {selectedDate}</h2>
          </div>
          <div className="action-row">
            <input
              className="input"
              type="date"
              style={{ width: "auto" }}
              value={selectedDate}
              onChange={(event) => setSelectedDate(event.target.value)}
            />
            <button
              className="button button-primary"
              onClick={() => setIsModalOpen(true)}
            >
              <CalendarDays size={18} />
              Ajouter rendez-vous
            </button>
          </div>
        </div>

        <div className="table-shell">
          {groupedAppointments.length ? (
            <table className="appointment-list-table">
              <thead>
                <tr>
                  <th>Heure</th>
                  <th>Patient</th>
                  <th>Durée</th>
                  <th>État</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {groupedAppointments.map((appointment) => (
                  <tr key={appointment.id}>
                    <td>
                      <div className="appointment-time">{appointment.time}</div>
                    </td>
                    <td>
                      <div className="appointment-patient">{formatPatientName(appointment.patient)}</div>
                    </td>
                    <td>{appointment.duration} min</td>
                    <td>
                      <StatusBadge status={appointment.status} />
                    </td>
                    <td>
                      <div className="action-row">
                        <button
                          className="button button-soft"
                          type="button"
                          onClick={() => onMarkStatus(appointment.id, "waiting")}
                        >
                          En attente
                        </button>
                        <button
                          className="button button-success"
                           type="button"
                          onClick={() => onMarkStatus(appointment.id, "treated")}
                        >
                          Traité
                        </button>
                        <button
                          className="button button-danger"
                          type="button"
                          onClick={() => onMarkStatus(appointment.id, "cancelled")}
                        >
                          Annulé
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="notice-card">Aucun rendez-vous planifié pour cette date.</div>
          )}
        </div>
      </section>

      {/* Modal Ajouter Rendez-vous */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Planifier un nouveau rendez-vous"
      >
        <form
          className="form-grid"
          onSubmit={(event) => {
            event.preventDefault();
            onCreateAppointment(appointmentForm);
            setAppointmentForm((current) => ({ ...current, time: "", patientId: "" }));
            setIsModalOpen(false);
          }}
        >
          <label className="field-label">Patient</label>
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <button
              type="button"
              className="button button-soft"
              style={{ flexShrink: 0, padding: "10px" }}
              onClick={() => setIsPatientSearchOpen(true)}
            >
              <Search size={20} />
            </button>
            <div
              className="input"
              style={{
                display: "flex",
                alignItems: "center",
                background: "#f9fafb",
                color: selectedPatient ? "var(--text)" : "var(--muted)",
                cursor: "pointer",
                fontWeight: selectedPatient ? "700" : "400"
              }}
              onClick={() => setIsPatientSearchOpen(true)}
            >
              {selectedPatient
                ? `${formatPatientName(selectedPatient)} (NIN: ${selectedPatient.nin || "N/A"})`
                : "Cliquer pour rechercher un patient..."}
            </div>
          </div>

          <label className="field-label">Date</label>
          <input
            className="input"
            type="date"
            value={appointmentForm.date}
            onChange={(event) => {
              const nextDate = event.target.value;
              setAppointmentForm((current) => ({
                ...current,
                date: nextDate,
                time: ""
              }));
              setSelectedDate(nextDate);
            }}
            required
          />

          <label className="field-label">Créneau horaire</label>
          <div className="slot-grid">
            {availableSlots.length ? (
              availableSlots.map((slot) => (
                <button
                  key={slot.time}
                  type="button"
                  disabled={!slot.available}
                  className={`slot-button ${appointmentForm.time === slot.time ? "slot-button-selected" : ""}`}
                  onClick={() => setAppointmentForm(curr => ({ ...curr, time: slot.time }))}
                >
                  {slot.time}
                </button>
              ))
            ) : (
              <div className="notice-card">Aucun créneau disponible.</div>
            )}
          </div>

          <div style={{ marginTop: "24px", display: "flex", gap: "12px" }}>
            <button
              className="button button-soft"
              type="button"
              style={{ flex: 1 }}
              onClick={() => setIsModalOpen(false)}
            >
              Annuler
            </button>
            <button
              className="button button-primary"
              type="submit"
              disabled={!appointmentForm.time || !appointmentForm.patientId}
              style={{ flex: 2 }}
            >
              Valider le rendez-vous
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Recherche Patient */}
      <Modal
        isOpen={isPatientSearchOpen}
        onClose={() => setIsPatientSearchOpen(false)}
        title="Rechercher un patient"
      >
        <div style={{ display: "grid", gap: "16px" }}>
          <div style={{ position: "relative" }}>
            <Search
              size={18}
              style={{
                position: "absolute",
                left: "14px",
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--muted)"
              }}
            />
            <input
              className="input"
              style={{ paddingLeft: "44px" }}
              placeholder="Rechercher par nom, NIN, téléphone ou date de naissance..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
            />
          </div>

          <div
            style={{
              maxHeight: "400px",
              overflowY: "auto",
              display: "grid",
              gap: "8px",
              padding: "4px"
            }}
          >
            {filteredPatients.length ? (
              filteredPatients.map((p) => (
                <div
                  key={p.id}
                  className="patient-search-item"
                  style={{
                    padding: "12px 16px",
                    borderRadius: "14px",
                    background: appointmentForm.patientId === p.id ? "rgba(15, 118, 110, 0.1)" : "white",
                    border: appointmentForm.patientId === p.id ? "2px solid var(--primary)" : "1px solid var(--border)",
                    cursor: "pointer",
                    transition: "all 140ms ease"
                  }}
                  onClick={() => {
                    setAppointmentForm((curr) => ({ ...curr, patientId: p.id }));
                    setIsPatientSearchOpen(false);
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div className="patient-name" style={{ fontSize: "1.05rem" }}>
                        {formatPatientName(p)}
                      </div>
                      <div className="patient-info-small">
                        NIN: <span style={{ fontWeight: "700", color: "var(--primary)" }}>{p.nin || "N/A"}</span>
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div className="patient-info-small">{p.phone}</div>
                      <div className="patient-info-small">{p.birthDate}</div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="notice-card">Aucun patient ne correspond à votre recherche.</div>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}



function UsersSection({ users, currentUser, onCreateUser, onUpdateUser }) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userForm, setUserForm] = useState({
    fullName: "",
    username: "",
    password: "",
    role: "simple"
  });
  const [editPassword, setEditPassword] = useState("");

  const canCreateUser = currentUser.role === "admin";
  const roleLabelMap = { admin: "Admin", simple: "Simple" };

  const handleEditClick = (user) => {
    setSelectedUser(user);
    setEditPassword("");
    setIsEditModalOpen(true);
  };

  if (currentUser.role !== "admin") return null;

  return (
    <div className="admin-content-grid">
      <section className="card card-wide">
        <div className="card-header">
          <div>
            <p className="eyebrow">Utilisateurs</p>
            <h2>Liste des utilisateurs</h2>
          </div>
          {canCreateUser && (
            <button
              className="button button-primary"
              onClick={() => setIsAddModalOpen(true)}
            >
              <UserPlus size={18} />
              Nouveau utilisateur
            </button>
          )}
        </div>
        <div className="table-shell">
          <table className="user-list-table">
            <thead>
              <tr>
                <th>Nom</th>
                <th>Login</th>
                <th>Rôle</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.length ? (
                users.map((user) => (
                  <tr key={user.id}>
                    <td>{user.fullName}</td>
                    <td>{user.username}</td>
                    <td>
                      <span
                        className={`status ${
                          user.role === "admin" ? "status-confirmed" : "status-waiting"
                        }`}
                      >
                        {roleLabelMap[user.role] || user.role}
                      </span>
                    </td>
                    <td>
                      <button
                        className="icon-button"
                        title="Changer mot de passe"
                        onClick={() => handleEditClick(user)}
                      >
                        <Edit size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4}>
                    <div className="notice-card">Aucun utilisateur disponible.</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Modal Créer Utilisateur */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Créer un nouveau compte utilisateur"
      >
        <form
          className="form-grid"
          onSubmit={(event) => {
            event.preventDefault();
            onCreateUser(userForm);
            setUserForm({
              fullName: "",
              username: "",
              password: "",
              role: "simple"
            });
            setIsAddModalOpen(false);
          }}
        >
          <label className="field-label">Nom complet</label>
          <input
            className="input"
            value={userForm.fullName}
            onChange={(event) =>
              setUserForm((current) => ({ ...current, fullName: event.target.value }))
            }
            required
          />
          <label className="field-label">Nom d&apos;utilisateur</label>
          <input
            className="input"
            value={userForm.username}
            onChange={(event) =>
              setUserForm((current) => ({ ...current, username: event.target.value }))
            }
            required
          />
          <label className="field-label">Mot de passe</label>
          <input
            className="input"
            type="password"
            value={userForm.password}
            onChange={(event) =>
              setUserForm((current) => ({ ...current, password: event.target.value }))
            }
            required
          />
          <label className="field-label">Rôle</label>
          <select
            className="select"
            value={userForm.role}
            onChange={(event) =>
              setUserForm((current) => ({ ...current, role: event.target.value }))
            }
          >
            <option value="simple">Simple</option>
            <option value="admin">Admin</option>
          </select>
          <div style={{ marginTop: "24px", display: "flex", gap: "12px" }}>
            <button
              className="button button-soft"
              type="button"
              style={{ flex: 1 }}
              onClick={() => setIsAddModalOpen(false)}
            >
              Annuler
            </button>
            <button className="button button-primary" type="submit" style={{ flex: 2 }}>
              Créer l&apos;utilisateur
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Editer Utilisateur (Mot de passe) */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={`Modifier l'utilisateur : ${selectedUser?.fullName}`}
      >
        <form
          className="form-grid"
          onSubmit={(event) => {
            event.preventDefault();
            onUpdateUser(selectedUser.id, { password: editPassword });
            setIsEditModalOpen(false);
          }}
        >
          <div style={{ padding: "12px", background: "rgba(15, 118, 110, 0.05)", borderRadius: "14px", marginBottom: "12px" }}>
            <div className="patient-info-small">Nom d&apos;utilisateur : <strong>{selectedUser?.username}</strong></div>
            <div className="patient-info-small">Rôle : <strong>{selectedUser?.role}</strong></div>
          </div>
          
          <label className="field-label">Nouveau mot de passe</label>
          <input
            className="input"
            type="password"
            value={editPassword}
            onChange={(e) => setEditPassword(e.target.value)}
            placeholder="Saisir le nouveau mot de passe..."
            required
          />
          
          <div style={{ marginTop: "24px", display: "flex", gap: "12px" }}>
            <button
              className="button button-soft"
              type="button"
              style={{ flex: 1 }}
              onClick={() => setIsEditModalOpen(false)}
            >
              Annuler
            </button>
            <button className="button button-primary" type="submit" style={{ flex: 2 }}>
              Enregistrer les modifications
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function SettingsSection({ settings, onUpdateInterval, onSyncAll, onUpdateVisibility }) {
  const [syncing, setSyncAll] = useState(false);

  const handleSync = async () => {
    try {
      setSyncAll(true);
      await onSyncAll();
      alert("✅ Synchronisation Firebase Cloud terminée avec succès !");
    } catch (error) {
      console.error("Sync Error:", error);
      let msg = "Erreur de synchronisation.";
      if (error.code === 'permission-denied') {
        msg = "Accès refusé par Firebase. Vérifiez vos règles (Cloud Firestore Rules).";
      } else if (error.message && error.message.includes('not initialized')) {
        msg = "Firebase n'est pas initialisé. Vérifiez votre config dans firebase.js.";
      } else {
        msg = `Détail de l'erreur: ${error.message || error.toString()}`;
      }
      alert(`❌ ${msg}\n\nVérifiez la console (F12) pour plus de détails.`);
    } finally {
      setSyncAll(false);
    }
  };

  return (
    <div className="admin-content-grid">
      <section className="card card-wide" style={{ paddingBottom: "32px", marginBottom: "24px" }}>
        <div className="card-header" style={{ marginBottom: "20px" }}>
          <div>
            <p className="eyebrow">Application Mobile Patient</p>
            <h2>Contrôle de l&apos;interface</h2>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
          <div style={{ padding: "20px", background: "rgba(15, 118, 110, 0.05)", borderRadius: "20px", border: "1px solid var(--border)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
              <div>
                <p style={{ fontWeight: 600, color: "var(--text-bold)", margin: 0 }}>Noms des patients</p>
                <p style={{ fontSize: "0.8rem", color: "var(--text-soft)", margin: 0 }}>Afficher ou masquer les noms dans l&apos;app mobile</p>
              </div>
              <label className="switch">
                <input 
                  type="checkbox" 
                  checked={settings?.showPatientNames !== false} 
                  onChange={(e) => onUpdateVisibility(e.target.checked)}
                />
                <span className="slider round"></span>
              </label>
            </div>
          </div>
          
          <div style={{ padding: "20px", background: "rgba(15, 118, 110, 0.05)", borderRadius: "20px", border: "1px dashed var(--primary)" }}>
            <p style={{ fontSize: "0.85rem", color: "var(--text-soft)", marginBottom: "12px" }}>
              Forcer la synchronisation manuelle des données vers Firebase.
            </p>
            <button 
              className="button button-primary" 
              onClick={handleSync}
              disabled={syncing}
              style={{ width: "100%" }}
            >
              <ShieldCheck size={18} />
              {syncing ? "Synchronisation..." : "Synchroniser maintenant"}
            </button>
          </div>
        </div>
      </section>

      <section className="card card-wide" style={{ paddingBottom: "32px" }}>
        <div className="card-header" style={{ marginBottom: "20px" }}>
          <div>
            <p className="eyebrow">Paramètres globaux</p>
            <h2>Configuration et Sécurité</h2>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
          <div style={{ padding: "16px", background: "rgba(15, 118, 110, 0.03)", borderRadius: "20px", border: "1px solid var(--border)" }}>
            <p className="eyebrow" style={{ marginBottom: "12px" }}>Planning</p>
            <label className="field-label">Intervalle de traitement par patient</label>
            <select
              className="select"
              value={settings?.appointmentInterval || 30}
              onChange={(event) => onUpdateInterval(Number(event.target.value))}
            >
              <option value={15}>15 minutes</option>
              <option value={30}>30 minutes</option>
              <option value={60}>1 heure</option>
            </select>
          </div>

          <div style={{ padding: "16px", background: "rgba(15, 23, 42, 0.03)", borderRadius: "20px", border: "1px solid var(--border)" }}>
            <p className="eyebrow" style={{ marginBottom: "12px" }}>Sécurité</p>
            <div className="patient-info-small" style={{ lineHeight: "1.6" }}>
              Accès au tableau de bord sécurisé. Les mots de passe sont chiffrés et l&apos;accès est restreint selon les rôles utilisateurs.
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export function AdminDashboard(props) {
  const [currentSection, setCurrentSection] = useState("dashboard");

  // Automatically sync to Firebase on load to ensure mobile app has data
  useEffect(() => {
    if (props.onSyncAll) {
      props.onSyncAll();
    }
  }, []);

  let sectionContent = null;

  if (currentSection === "dashboard") {
    sectionContent = (
      <DashboardSection
        settings={props.settings}
        patients={props.patients}
        appointments={props.appointments}
        queueToday={props.queueToday}
        users={props.users}
        currentUser={props.currentUser}
      />
    );
  }

  if (currentSection === "patients") {
    sectionContent = (
      <PatientsSection
        patients={props.patients}
        onCreatePatient={props.onCreatePatient}
        onDeletePatient={props.onDeletePatient}
      />
    );
  }

  if (currentSection === "appointments") {
    sectionContent = (
      <AppointmentsSection
        patients={props.patients}
        appointments={props.appointments}
        selectedDate={props.selectedDate}
        setSelectedDate={props.setSelectedDate}
        availableSlots={props.availableSlots}
        onRefreshSlots={props.onRefreshSlots}
        onCreateAppointment={props.onCreateAppointment}
        onMarkStatus={props.onMarkStatus}
      />
    );
  }

  if (currentSection === "users") {
    sectionContent = (
      <UsersSection
        users={props.users}
        currentUser={props.currentUser}
        onCreateUser={props.onCreateUser}
        onUpdateUser={props.onUpdateUser}
      />
    );
  }

  if (currentSection === "settings") {
    sectionContent = (
      <SettingsSection 
        settings={props.settings} 
        onUpdateInterval={props.onUpdateInterval} 
        onSyncAll={props.onSyncAll} 
        onUpdateVisibility={props.onUpdateVisibility}
      />
    );
  }

  return (
    <div className="admin-shell">
      <Sidebar
        currentSection={currentSection}
        setCurrentSection={setCurrentSection}
        currentUser={props.currentUser}
        onLogout={props.onLogout}
      />
      <main className="admin-main">
        <header className="admin-header">
          <div>
            <p className="eyebrow">Back office</p>
            <h2>{sections.find((item) => item.id === currentSection)?.label}</h2>
          </div>
        </header>
        {sectionContent}
      </main>
    </div>
  );
}
