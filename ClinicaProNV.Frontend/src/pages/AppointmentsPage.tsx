import { useEffect, useState } from "react";
import { apiRequest } from "../api/api";

type Patient = {
    id: string;
    fullName: string;
    identification: string;
    createdAtUtc: string;
};

type Doctor = {
    id: string;
    fullName: string;
    specialty: string;
    createdAtUtc: string;
};

type Appointment = {
    id: string;
    patientId: string;
    patientName: string | null;
    doctorId: string;
    doctorName: string | null;
    doctorSpecialty: string | null;
    date: string;
    reason: string;
    status: number;
    statusText: string;
    createdAtUtc: string;
};

type AppointmentResponse = {
    id: string;
    patientId: string;
    doctorId: string;
    date: string;
    reason: string;
    status: number;
};

type AppointmentsPageProps = {
    onBack: () => void;
};

export function AppointmentsPage({ onBack }: AppointmentsPageProps) {
    const [patients, setPatients] = useState<Patient[]>([]);
    const [doctors, setDoctors] = useState<Doctor[]>([]);
    const [appointments, setAppointments] = useState<Appointment[]>([]);

    const [patientId, setPatientId] = useState("");
    const [doctorId, setDoctorId] = useState("");
    const [appointmentDate, setAppointmentDate] = useState("");
    const [reason, setReason] = useState("");

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState("");

    async function loadData() {
        try {
            setLoading(true);
            setMessage("");

            const patientsData = await apiRequest<Patient[]>("/patients");
            const doctorsData = await apiRequest<Doctor[]>("/doctors");
            const appointmentsData = await apiRequest<Appointment[]>("/appointments");

            setPatients(patientsData);
            setDoctors(doctorsData);
            setAppointments(appointmentsData);
        } catch (error) {
            setMessage(error instanceof Error ? error.message : "Error al cargar datos");
        } finally {
            setLoading(false);
        }
    }

    async function handleSubmit(event: React.FormEvent) {
        event.preventDefault();

        if (!patientId) {
            setMessage("Seleccione un paciente.");
            return;
        }

        if (!doctorId) {
            setMessage("Seleccione un doctor.");
            return;
        }

        if (!appointmentDate) {
            setMessage("Seleccione fecha y hora de la cita.");
            return;
        }

        try {
            setSaving(true);
            setMessage("Guardando cita...");

            const result = await apiRequest<AppointmentResponse>("/appointments", {
                method: "POST",
                body: JSON.stringify({
                    patientId,
                    doctorId,
                    date: new Date(appointmentDate).toISOString(),
                    reason: reason.trim() || "Sin motivo",
                }),
            });

            setPatientId("");
            setDoctorId("");
            setAppointmentDate("");
            setReason("");

            setMessage(`Cita creada correctamente. ID: ${result.id}`);

            await loadData();
        } catch (error) {
            setMessage(error instanceof Error ? error.message : "Error al guardar cita");
        } finally {
            setSaving(false);
        }
    }

    async function handleCancelAppointment(id: string) {
        const confirmed = window.confirm("¿Seguro que deseas cancelar esta cita?");

        if (!confirmed) {
            return;
        }

        try {
            setMessage("Cancelando cita...");

            await apiRequest<void>(`/appointments/${id}/cancel`, {
                method: "POST",
                body: JSON.stringify("Cancelada desde frontend"),
            });

            setMessage("Cita cancelada correctamente.");

            await loadData();
        } catch (error) {
            setMessage(error instanceof Error ? error.message : "Error al cancelar cita");
        }
    }
    async function handleDeleteAppointment(id: string) {
        const confirmed = window.confirm("¿Seguro que deseas eliminar esta cita?");

        if (!confirmed) {
            return;
        }

        try {
            setMessage("Eliminando cita...");

            await apiRequest<void>(`/appointments/${id}`, {
                method: "DELETE",
            });

            setMessage("Cita eliminada correctamente.");

            await loadData();
        } catch (error) {
            setMessage(error instanceof Error ? error.message : "Error al eliminar cita");
        }
    }

    function getStatusLabel(status: number) {
        if (status === 1) return "Programada";
        if (status === 2) return "Completada";
        if (status === 3) return "Cancelada";
        return "Desconocido";
    }

    useEffect(() => {
        loadData();
    }, []);

    return (
        <main style={styles.page}>
            <section style={styles.header}>
                <div>
                    <h1 style={styles.title}>Citas</h1>
                    <p style={styles.subtitle}>Agenda médica con pacientes y doctores</p>
                </div>

                <button style={styles.backButton} onClick={onBack}>
                    Volver
                </button>
            </section>

            <section style={styles.card}>
                <h2 style={styles.sectionTitle}>Registrar cita</h2>

                {loading && <p>Cargando pacientes, doctores y citas...</p>}

                {!loading && (
                    <form onSubmit={handleSubmit} style={styles.form}>
                        <label style={styles.label}>
                            Paciente
                            <select
                                style={styles.input}
                                value={patientId}
                                onChange={(e) => setPatientId(e.target.value)}
                            >
                                <option value="">Seleccione un paciente</option>
                                {patients.map((patient) => (
                                    <option key={patient.id} value={patient.id}>
                                        {patient.fullName} - {patient.identification}
                                    </option>
                                ))}
                            </select>
                        </label>

                        <label style={styles.label}>
                            Doctor
                            <select
                                style={styles.input}
                                value={doctorId}
                                onChange={(e) => setDoctorId(e.target.value)}
                            >
                                <option value="">Seleccione un doctor</option>
                                {doctors.map((doctor) => (
                                    <option key={doctor.id} value={doctor.id}>
                                        {doctor.fullName} - {doctor.specialty}
                                    </option>
                                ))}
                            </select>
                        </label>

                        <label style={styles.label}>
                            Fecha y hora
                            <input
                                style={styles.input}
                                type="datetime-local"
                                value={appointmentDate}
                                onChange={(e) => setAppointmentDate(e.target.value)}
                            />
                        </label>

                        <label style={styles.label}>
                            Motivo
                            <input
                                style={styles.input}
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                placeholder="Ej: Consulta general"
                            />
                        </label>

                        <button style={styles.saveButton} type="submit" disabled={saving}>
                            {saving ? "Guardando..." : "Guardar cita"}
                        </button>
                    </form>
                )}

                {message && <p style={styles.message}>{message}</p>}
            </section>

            <section style={styles.card}>
                <h2 style={styles.sectionTitle}>Listado de citas</h2>

                {appointments.length === 0 && !loading && (
                    <p>No hay citas registradas.</p>
                )}

                {appointments.length > 0 && (
                    <table style={styles.table}>
                        <thead>
                            <tr>
                                <th style={styles.th}>Paciente</th>
                                <th style={styles.th}>Doctor</th>
                                <th style={styles.th}>Fecha</th>
                                <th style={styles.th}>Motivo</th>
                                <th style={styles.th}>Estado</th>
                                <th style={styles.th}>Acciones</th>
                            </tr>
                        </thead>

                        <tbody>
                            {appointments.map((appointment) => (
                                <tr key={appointment.id}>
                                    <td style={styles.td}>
                                        {appointment.patientName ?? appointment.patientId}
                                    </td>

                                    <td style={styles.td}>
                                        {appointment.doctorName ?? appointment.doctorId}
                                        {appointment.doctorSpecialty && (
                                            <div style={styles.smallText}>
                                                {appointment.doctorSpecialty}
                                            </div>
                                        )}
                                    </td>

                                    <td style={styles.td}>
                                        {new Date(appointment.date).toLocaleString()}
                                    </td>

                                    <td style={styles.td}>{appointment.reason}</td>

                                    <td style={styles.td}>
                                        <span
                                            style={{
                                                ...styles.statusBadge,
                                                ...(appointment.status === 3
                                                    ? styles.cancelledBadge
                                                    : styles.scheduledBadge),
                                            }}
                                        >
                                            {getStatusLabel(appointment.status)}
                                        </span>
                                    </td>

                                    <td style={styles.td}>
                                        <div style={styles.actions}>
                                            {appointment.status === 1 && (
                                                <button
                                                    style={styles.cancelAppointmentButton}
                                                    onClick={() => handleCancelAppointment(appointment.id)}
                                                >
                                                    Cancelar
                                                </button>
                                            )}

                                            <button
                                                style={styles.deleteAppointmentButton}
                                                onClick={() => handleDeleteAppointment(appointment.id)}
                                            >
                                                Eliminar
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </section>
        </main>
    );
}

const styles: Record<string, React.CSSProperties> = {
    page: {
        minHeight: "100vh",
        background: "#f3f6fb",
        padding: "32px",
        fontFamily: "Arial, sans-serif",
    },
    header: {
        maxWidth: "1100px",
        margin: "0 auto 24px auto",
        padding: "24px",
        borderRadius: "18px",
        background: "white",
        boxShadow: "0 12px 35px rgba(0,0,0,0.06)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
    },
    title: {
        margin: 0,
        color: "#111827",
        fontSize: "34px",
    },
    subtitle: {
        margin: "6px 0 0 0",
        color: "#6b7280",
    },
    backButton: {
        padding: "12px 18px",
        border: "none",
        borderRadius: "10px",
        background: "#111827",
        color: "white",
        fontWeight: "bold",
        cursor: "pointer",
    },
    card: {
        maxWidth: "1100px",
        margin: "0 auto 24px auto",
        padding: "24px",
        borderRadius: "18px",
        background: "white",
        boxShadow: "0 12px 35px rgba(0,0,0,0.06)",
    },
    sectionTitle: {
        marginTop: 0,
        color: "#111827",
    },
    form: {
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "16px",
    },
    label: {
        display: "grid",
        gap: "8px",
        color: "#374151",
        fontSize: "14px",
        fontWeight: "bold",
    },
    input: {
        padding: "12px",
        border: "1px solid #d1d5db",
        borderRadius: "10px",
        fontSize: "15px",
        background: "#3b3b3b",
        color: "white",
    },
    saveButton: {
        gridColumn: "1 / -1",
        padding: "13px 18px",
        border: "none",
        borderRadius: "10px",
        background: "#2563eb",
        color: "white",
        fontWeight: "bold",
        cursor: "pointer",
    },
    message: {
        marginTop: "16px",
        color: "#2563eb",
        fontWeight: "bold",
        textAlign: "center",
    },
    table: {
        width: "100%",
        borderCollapse: "collapse",
    },
    th: {
        textAlign: "left",
        padding: "14px",
        borderBottom: "1px solid #e5e7eb",
        color: "#374151",
    },
    td: {
        padding: "14px",
        borderBottom: "1px solid #e5e7eb",
        color: "#111827",
        verticalAlign: "top",
    },
    smallText: {
        fontSize: "12px",
        color: "#6b7280",
        marginTop: "4px",
    },
    statusBadge: {
        display: "inline-block",
        padding: "6px 10px",
        borderRadius: "999px",
        fontSize: "12px",
        fontWeight: "bold",
    },
    scheduledBadge: {
        background: "#dbeafe",
        color: "#1d4ed8",
    },
    cancelledBadge: {
        background: "#fee2e2",
        color: "#b91c1c",
    },
    cancelAppointmentButton: {
        padding: "8px 12px",
        border: "none",
        borderRadius: "8px",
        background: "#ef4444",
        color: "white",
        fontWeight: "bold",
        cursor: "pointer",
    },
    actions: {
        display: "flex",
        gap: "8px",
        flexWrap: "wrap",
    },

    deleteAppointmentButton: {
        padding: "8px 12px",
        border: "none",
        borderRadius: "8px",
        background: "#7f0c0c",
        color: "white",
        fontWeight: "bold",
        cursor: "pointer",
    },
};