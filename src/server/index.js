import express from "express";
import cors from "cors";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const PORT = process.env.PORT || 3001;
const DATA_FILE = path.resolve(__dirname, "../../data/clinic-db.json");
const DIST_DIR = path.resolve(__dirname, "../../dist");
const getTodayDate = () => new Date().toISOString().slice(0, 10);

// ✅ Serve static files from Vite build
app.use(express.static(path.join(__dirname, "../../build")));

// ✅ Handle React/Vite routing
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../../build/index.html"));
});

app.use(cors());
app.use(express.json());

const seedData = {
  settings: {
    appointmentInterval: 30,
    clinicName: "Cabinet OULD MATARI",
    address: "LOTISSEMENT HARKAT, BT A, REZ DE CHAUSSÉÉ, BOUIRA",
    phone: "0555021297 / 0794084841 / 0553859803"
  },
  users: [
    {
      id: "USR-9001",
      fullName: "System Admin",
      username: "admin",
      password: "admin123",
      role: "admin"
    },
    {
      id: "USR-9002",
      fullName: "Reception User",
      username: "user",
      password: "user123",
      role: "simple"
    }
  ],
  patients: [
    {
      id: "PAT-1001",
      firstName: "Sara",
      lastName: "Benkacem",
      phone: "+213555010101",
      birthDate: "1992-03-14",
      note: "Controle post-traitement"
    },
    {
      id: "PAT-1002",
      firstName: "Yacine",
      lastName: "Mansouri",
      phone: "+213555020202",
      birthDate: "1987-11-06",
      note: "Consultation generale"
    },
    {
      id: "PAT-1003",
      firstName: "Lina",
      lastName: "Khelifi",
      phone: "+213555030303",
      birthDate: "2001-07-22",
      note: "Suivi mensuel"
    }
  ],
  appointments: [
    {
      id: "APT-2001",
      patientId: "PAT-1001",
      date: getTodayDate(),
      time: "09:00",
      duration: 30,
      status: "waiting"
    },
    {
      id: "APT-2002",
      patientId: "PAT-1002",
      date: getTodayDate(),
      time: "09:30",
      duration: 30,
      status: "waiting"
    },
    {
      id: "APT-2003",
      patientId: "PAT-1003",
      date: getTodayDate(),
      time: "10:00",
      duration: 30,
      status: "confirmed"
    }
  ]
};

const ensureDataFile = () => {
  if (!fs.existsSync(DATA_FILE)) {
    fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
    fs.writeFileSync(DATA_FILE, JSON.stringify(seedData, null, 2));
  }
};

const readDb = () => {
  ensureDataFile();
  const db = JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
  if (!db.users) {
    db.users = seedData.users;
    writeDb(db);
  }
  return db;
};

const writeDb = (db) => {
  fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2));
};

const emitters = new Set();

const broadcast = (event, payload) => {
  const message = `event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`;
  for (const res of emitters) {
    res.write(message);
  }
};

const buildResponse = (db) => {
  const patientsById = Object.fromEntries(db.patients.map((patient) => [patient.id, patient]));
  const users = (db.users || []).map(({ password, ...user }) => user);
  const appointments = db.appointments
    .map((appointment) => ({
      ...appointment,
      patient: patientsById[appointment.patientId]
    }))
    .sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`));

  return {
    settings: db.settings,
    users,
    patients: db.patients,
    appointments
  };
};

const getAvailableSlots = (db, date) => {
  const openHour = 9;
  const closeHour = 17;
  const interval = Number(db.settings.appointmentInterval || 30);
  const dayAppointments = db.appointments.filter((item) => item.date === date);
  const occupiedTimes = new Set(dayAppointments.map((item) => item.time));
  const slots = [];

  for (let minutes = openHour * 60; minutes < closeHour * 60; minutes += interval) {
    const hour = String(Math.floor(minutes / 60)).padStart(2, "0");
    const minute = String(minutes % 60).padStart(2, "0");
    const time = `${hour}:${minute}`;
    slots.push({
      time,
      available: !occupiedTimes.has(time)
    });
  }

  return slots;
};

if (fs.existsSync(DIST_DIR)) {
  app.use(express.static(DIST_DIR));
}

app.get("/api/bootstrap", (_req, res) => {
  const db = readDb();
  res.json({
    ...buildResponse(db),
    availableSlots: getAvailableSlots(db, getTodayDate())
  });
});

app.post("/api/login", (req, res) => {
  const db = readDb();
  const { username, password } = req.body;
  const user = (db.users || []).find(
    (item) => item.username === username && item.password === password
  );

  if (!user) {
    return res.status(401).json({ message: "Identifiants invalides." });
  }

  const { password: _password, ...safeUser } = user;
  return res.json({ user: safeUser });
});

app.get("/api/slots", (req, res) => {
  const db = readDb();
  const date = String(req.query.date || getTodayDate());
  res.json(getAvailableSlots(db, date));
});

app.post("/api/patients", (req, res) => {
  const db = readDb();
  const patient = {
    id: `PAT-${Date.now()}`,
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    phone: req.body.phone,
    birthDate: req.body.birthDate,
    note: req.body.note || ""
  };
  db.patients.unshift(patient);
  writeDb(db);
  res.status(201).json(patient);
});

app.patch("/api/settings", (req, res) => {
  const db = readDb();
  db.settings = {
    ...db.settings,
    ...req.body
  };
  writeDb(db);
  res.json(db.settings);
});

app.post("/api/users", (req, res) => {
  const db = readDb();
  const requesterRole = req.headers["x-user-role"];

  if (requesterRole !== "admin") {
    return res.status(403).json({ message: "Seul un admin peut ajouter un utilisateur." });
  }

  const exists = (db.users || []).some((item) => item.username === req.body.username);
  if (exists) {
    return res.status(409).json({ message: "Nom d'utilisateur deja utilise." });
  }

  const user = {
    id: `USR-${Date.now()}`,
    fullName: req.body.fullName,
    username: req.body.username,
    password: req.body.password,
    role: req.body.role === "admin" ? "admin" : "simple"
  };

  db.users.unshift(user);
  writeDb(db);
  const { password, ...safeUser } = user;
  return res.status(201).json(safeUser);
});

app.patch("/api/users/:id", (req, res) => {
  const db = readDb();
  const requesterRole = req.headers["x-user-role"];

  if (requesterRole !== "admin") {
    return res.status(403).json({ message: "Seul un admin peut modifier un utilisateur." });
  }

  const userIndex = (db.users || []).findIndex((item) => item.id === req.params.id);
  if (userIndex === -1) {
    return res.status(404).json({ message: "Utilisateur introuvable." });
  }

  if (req.body.password) {
    db.users[userIndex].password = req.body.password;
  }
  
  if (req.body.fullName) {
    db.users[userIndex].fullName = req.body.fullName;
  }

  writeDb(db);
  const { password, ...safeUser } = db.users[userIndex];
  return res.json(safeUser);
});

app.post("/api/appointments", (req, res) => {
  const db = readDb();
  const { patientId, date, time } = req.body;
  const exists = db.appointments.some((item) => item.date === date && item.time === time);

  if (exists) {
    return res.status(409).json({ message: "Ce créneau est déjà occupé." });
  }

  const appointment = {
    id: `APT-${Date.now()}`,
    patientId,
    date,
    time,
    duration: Number(db.settings.appointmentInterval),
    status: "confirmed"
  };

  db.appointments.push(appointment);
  writeDb(db);
  return res.status(201).json(appointment);
});

app.patch("/api/appointments/:id/status", (req, res) => {
  const db = readDb();
  const appointment = db.appointments.find((item) => item.id === req.params.id);

  if (!appointment) {
    return res.status(404).json({ message: "Rendez-vous introuvable." });
  }

  appointment.status = req.body.status;
  writeDb(db);
  return res.json(appointment);
});

app.get("/api/patient/:patientId", (req, res) => {
  const db = readDb();
  const patient = db.patients.find((item) => item.id === req.params.patientId);

  if (!patient) {
    return res.status(404).json({ message: "Patient introuvable." });
  }

  const appointments = db.appointments
    .filter((item) => item.patientId === patient.id)
    .sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`));

  const todaysQueue = db.appointments
    .filter((item) => item.date === getTodayDate() && item.status !== "treated")
    .sort((a, b) => a.time.localeCompare(b.time))
    .map((item, index) => ({
      ...item,
      position: index + 1,
      patient: db.patients.find((patientItem) => patientItem.id === item.patientId)
    }));

  const todayAppointment = todaysQueue.find((item) => item.patientId === patient.id);

  return res.json({
    patient,
    appointments,
    queue: todayAppointment ? todaysQueue : [],
    myPosition: todayAppointment?.position ?? null
  });
});

if (fs.existsSync(DIST_DIR)) {
  app.get("*", (_req, res) => {
    res.sendFile(path.join(DIST_DIR, "index.html"));
  });
}

app.listen(PORT, () => {
  ensureDataFile();
  console.log(`DoctorFlow API running on http://localhost:${PORT}`);
});
