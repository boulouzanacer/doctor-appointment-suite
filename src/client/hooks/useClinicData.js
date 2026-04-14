import { useEffect, useMemo, useState } from "react";

const API_URL =
  import.meta.env.VITE_API_URL ||
  (window.location.port === "5173" ? "http://localhost:3001/api" : `${window.location.origin}/api`);

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
    try {
      const response = await fetch(`${API_URL}/bootstrap`);
      const data = await response.json();
      setState((current) => ({
        ...current,
        ...data,
        loading: false,
        error: ""
      }));
    } catch (error) {
      setState((current) => ({
        ...current,
        loading: false,
        error: "Impossible de charger les donnees."
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
