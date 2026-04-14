import { useEffect, useMemo, useState } from "react";

const getApiBaseUrl = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  
  if (typeof window !== 'undefined') {
    if (window.location.port === "5173") {
      return "http://localhost:3001/api";
    }
    if (window.location.protocol === 'capacitor:' || window.location.protocol === 'app:') {
      return "https://doctor-appointment-suite.onrender.com/api";
    }
    return `${window.location.origin}/api`;
  }
  
  return "https://doctor-appointment-suite.onrender.com/api";
};

const API_URL = getApiBaseUrl();

export function useClinicData() {
  const [state, setState] = useState({
    settings: null,
    users: [],
    patients: [],
    appointments: [],
    availableSlots: [],
    loading: true,
    error: ""
  });

  const load = async () => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    try {
      const response = await fetch(`${API_URL}/bootstrap`, {
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }
      
      const data = await response.json();
      setState((current) => ({
        ...current,
        ...data,
        loading: false,
        error: ""
      }));
    } catch (error) {
      clearTimeout(timeoutId);
      const errorMessage = error.name === 'AbortError' 
        ? "Le serveur met trop de temps a responder. Veuillez verifier votre connexion."
        : "Impossible de charger les donnees.";
      setState((current) => ({
        ...current,
        loading: false,
        error: errorMessage
      }));
    }
  };

  useEffect(() => {
    load();
    // Refresh data every 5 seconds (polling) instead of SSE for better stability
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, []);

  const today = new Date().toISOString().slice(0, 10);

  const queueToday = useMemo(() => {
    return state.appointments
      .filter((appointment) => appointment.date === today)
      .sort((a, b) => a.time.localeCompare(b.time))
      .map((appointment, index) => ({
        ...appointment,
        position:
          appointment.status === "treated"
            ? null
            : state.appointments
                .filter(
                  (item) =>
                    item.date === today &&
                    item.status !== "treated" &&
                    item.time <= appointment.time
                ).length
      }));
  }, [state.appointments, today]);

  return {
    API_URL,
    ...state,
    queueToday,
    reload: load
  };
}
