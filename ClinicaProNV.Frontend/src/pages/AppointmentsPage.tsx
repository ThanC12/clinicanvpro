import { useEffect, useState } from "react";
import { apiRequest } from "../api/api";
import { pageStyles } from "../styles/pageStyles";

type Patient = {
    id: string;
    fullName: string;
    identification: string;
    email?: string;
    whatsAppNumber?: string;
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
    patientEmail: string | null;
    patientWhatsApp: string | null;
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
    const [editingAppointmentId, setEditingAppointmentId] = useState<string | null>(null);
    const [statusFilter, setStatusFilter] = useState("all");
    const [doctorFilter, setDoctorFilter] = useState("all");
    const [dateFilter, setDateFilter] = useState("");

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

            const endpoint = editingAppointmentId
                ? `/appointments/${editingAppointmentId}`
                : "/appointments";
            const result = await apiRequest<AppointmentResponse>(endpoint, {
                method: editingAppointmentId ? "PUT" : "POST",
                body: JSON.stringify({
                    patientId,
                    doctorId,
                    date: new Date(appointmentDate).toISOString(),
                    reason: reason.trim() || "Sin motivo",
                }),
            });

            clearForm();

            setMessage(
                editingAppointmentId
                    ? "Cita actualizada correctamente."
                    : `Cita creada correctamente. ID: ${result.id}`
            );

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
    async function handleCompleteAppointment(id: string) {
        const confirmed = window.confirm("¿Marcar esta cita como completada?");

        if (!confirmed) {
            return;
        }

        try {
            setMessage("Completando cita...");

            await apiRequest<void>(`/appointments/${id}/complete`, {
                method: "POST",
            });

            setMessage("Cita completada correctamente.");
            await loadData();
        } catch (error) {
            setMessage(error instanceof Error ? error.message : "Error al completar cita");
        }
    }

    function handleEditAppointment(appointment: Appointment) {
        if (appointment.status !== 1) {
            setMessage("Solo se pueden editar citas programadas.");
            return;
        }

        setEditingAppointmentId(appointment.id);
        setPatientId(appointment.patientId);
        setDoctorId(appointment.doctorId);
        setAppointmentDate(toDateTimeLocalValue(appointment.date));
        setReason(appointment.reason);
        setMessage("Editando cita programada.");
        window.scrollTo({ top: 0, behavior: "smooth" });
    }

    function clearForm() {
        setEditingAppointmentId(null);
        setPatientId("");
        setDoctorId("");
        setAppointmentDate("");
        setReason("");
    }

    function toDateTimeLocalValue(value: string) {
        const date = new Date(value);
        const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
        return offsetDate.toISOString().slice(0, 16);
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

    function buildAppointmentMessage(appointment: Appointment) {
        return `Cita médica CLININOVA\nPaciente: ${appointment.patientName ?? appointment.patientId}\nDoctor: ${appointment.doctorName ?? appointment.doctorId}${appointment.doctorSpecialty ? ` - ${appointment.doctorSpecialty}` : ""}\nFecha: ${new Date(appointment.date).toLocaleString()}\nMotivo: ${appointment.reason}\nEstado: ${getStatusLabel(appointment.status)}\n\nPor favor llegue 15 minutos antes.`;
    }

    function handleEmailAppointment(appointment: Appointment) {
        if (!appointment.patientEmail) {
            setMessage("El paciente no tiene correo registrado.");
            return;
        }

        const subject = encodeURIComponent("Confirmación de cita médica");
        const body = encodeURIComponent(buildAppointmentMessage(appointment));
        window.location.href = `mailto:${appointment.patientEmail}?subject=${subject}&body=${body}`;
    }

    function handleWhatsAppAppointment(appointment: Appointment) {
        if (!appointment.patientWhatsApp) {
            setMessage("El paciente no tiene WhatsApp registrado.");
            return;
        }

        const phone = appointment.patientWhatsApp.replace(/\D/g, "");
        const text = encodeURIComponent(buildAppointmentMessage(appointment));
        window.open(`https://wa.me/${phone}?text=${text}`, "_blank", "noopener,noreferrer");
    }

    async function handleShareAppointment(appointment: Appointment) {
        const text = buildAppointmentMessage(appointment);

        if (navigator.share) {
            await navigator.share({
                title: "Cita médica CLININOVA",
                text,
            });
            return;
        }

        await navigator.clipboard.writeText(text);
        setMessage("Mensaje de cita copiado para compartir en redes sociales.");
    }

    useEffect(() => {
        loadData();
    }, []);

    const filteredAppointments = appointments.filter((appointment) => {
        if (statusFilter !== "all" && String(appointment.status) !== statusFilter) {
            return false;
        }

        if (doctorFilter !== "all" && appointment.doctorId !== doctorFilter) {
            return false;
        }

        if (dateFilter) {
            const appointmentDay = new Date(appointment.date).toISOString().slice(0, 10);
            if (appointmentDay !== dateFilter) {
                return false;
            }
        }

        return true;
    });

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
                <h2 style={styles.sectionTitle}>
                    {editingAppointmentId ? "Editar cita" : "Registrar cita"}
                </h2>

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
                            {saving
                                ? "Guardando..."
                                : editingAppointmentId
                                ? "Guardar cambios"
                                : "Guardar cita"}
                        </button>

                        {editingAppointmentId && (
                            <button
                                style={styles.secondaryActionButton}
                                type="button"
                                onClick={clearForm}
                            >
                                Cancelar edición
                            </button>
                        )}
                    </form>
                )}

                {message && <p style={styles.message}>{message}</p>}
            </section>

            <section style={styles.card}>
                <h2 style={styles.sectionTitle}>Listado de citas</h2>

                <div style={styles.filters}>
                    <label style={styles.label}>
                        Estado
                        <select
                            style={styles.input}
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option value="all">Todos</option>
                            <option value="1">Programadas</option>
                            <option value="2">Completadas</option>
                            <option value="3">Canceladas</option>
                        </select>
                    </label>

                    <label style={styles.label}>
                        Doctor
                        <select
                            style={styles.input}
                            value={doctorFilter}
                            onChange={(e) => setDoctorFilter(e.target.value)}
                        >
                            <option value="all">Todos</option>
                            {doctors.map((doctor) => (
                                <option key={doctor.id} value={doctor.id}>
                                    {doctor.fullName}
                                </option>
                            ))}
                        </select>
                    </label>

                    <label style={styles.label}>
                        Fecha
                        <input
                            style={styles.input}
                            type="date"
                            value={dateFilter}
                            onChange={(e) => setDateFilter(e.target.value)}
                        />
                    </label>
                </div>

                {filteredAppointments.length === 0 && !loading && (
                    <p>No hay citas registradas.</p>
                )}

                {filteredAppointments.length > 0 && (
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
                            {filteredAppointments.map((appointment) => (
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
                                                <>
                                                <button
                                                    style={styles.editButton}
                                                    onClick={() => handleEditAppointment(appointment)}
                                                >
                                                    Editar
                                                </button>

                                                <button
                                                    style={styles.completeAppointmentButton}
                                                    onClick={() => handleCompleteAppointment(appointment.id)}
                                                >
                                                    Completar
                                                </button>

                                                <button
                                                    style={styles.cancelAppointmentButton}
                                                    onClick={() => handleCancelAppointment(appointment.id)}
                                                >
                                                    Cancelar
                                                </button>
                                                </>
                                            )}

                                            <button
                                                style={styles.emailButton}
                                                onClick={() => handleEmailAppointment(appointment)}
                                            >
                                                Correo
                                            </button>

                                            <button
                                                style={styles.whatsAppButton}
                                                onClick={() => handleWhatsAppAppointment(appointment)}
                                            >
                                                WhatsApp
                                            </button>

                                            <button
                                                style={styles.shareButton}
                                                onClick={() => handleShareAppointment(appointment)}
                                            >
                                                Compartir
                                            </button>

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
    ...pageStyles,
    form: {
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "16px",
    },
    secondaryActionButton: {
        gridColumn: "1 / -1",
        padding: "13px 18px",
        border: "none",
        borderRadius: "10px",
        background: "#5f7680",
        color: "white",
        fontWeight: "bold",
        cursor: "pointer",
    },
    filters: {
        display: "grid",
        gridTemplateColumns: "1fr 1fr 1fr",
        gap: "12px",
        marginBottom: "18px",
    },
    statusBadge: {
        display: "inline-block",
        padding: "6px 10px",
        borderRadius: "999px",
        fontSize: "12px",
        fontWeight: "bold",
    },
    scheduledBadge: {
        background: "#e7f7f4",
        color: "#0b635d",
    },
    cancelledBadge: {
        background: "#fee2e2",
        color: "#c2413b",
    },
    cancelAppointmentButton: {
        padding: "8px 12px",
        border: "none",
        borderRadius: "8px",
        background: "#c2413b",
        color: "white",
        fontWeight: "bold",
        cursor: "pointer",
    },
    completeAppointmentButton: {
        padding: "8px 12px",
        border: "none",
        borderRadius: "8px",
        background: "#0e9384",
        color: "white",
        fontWeight: "bold",
        cursor: "pointer",
    },
    emailButton: {
        padding: "8px 12px",
        border: "none",
        borderRadius: "8px",
        background: "#0e9384",
        color: "white",
        fontWeight: "bold",
        cursor: "pointer",
    },
    whatsAppButton: {
        padding: "8px 12px",
        border: "none",
        borderRadius: "8px",
        background: "#0e9384",
        color: "white",
        fontWeight: "bold",
        cursor: "pointer",
    },
    shareButton: {
        padding: "8px 12px",
        border: "none",
        borderRadius: "8px",
        background: "#1f5d73",
        color: "white",
        fontWeight: "bold",
        cursor: "pointer",
    },

    deleteAppointmentButton: {
        padding: "8px 12px",
        border: "none",
        borderRadius: "8px",
        background: "#c2413b",
        color: "white",
        fontWeight: "bold",
        cursor: "pointer",
    },};
