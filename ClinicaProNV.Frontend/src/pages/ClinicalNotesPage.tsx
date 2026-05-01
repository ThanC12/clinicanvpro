import { useEffect, useState } from "react";
import { apiRequest } from "../api/api";

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

type ClinicalNote = {
  id: string;
  appointmentId: string;
  notes: string;
  createdAtUtc: string;
  appointmentDate: string;
  patientId: string;
  patientName: string | null;
  doctorId: string;
  doctorName: string | null;
};

type ClinicalNotesPageProps = {
  onBack: () => void;
};

export function ClinicalNotesPage({ onBack }: ClinicalNotesPageProps) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [clinicalNotes, setClinicalNotes] = useState<ClinicalNote[]>([]);

  const [appointmentId, setAppointmentId] = useState("");
  const [notes, setNotes] = useState("");
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function loadData() {
    try {
      setLoading(true);
      setMessage("");

      const appointmentsData = await apiRequest<Appointment[]>("/appointments");
      setAppointments(appointmentsData);
      const notesData = await apiRequest<ClinicalNote[]>("/clinical-notes");
      setClinicalNotes(notesData);

    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Error al cargar datos");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (!editingNoteId && !appointmentId) {
      setMessage("Seleccione una cita.");
      return;
    }

    if (!notes.trim()) {
      setMessage("Ingrese la nota clínica.");
      return;
    }

    try {
      setSaving(true);
      setMessage(editingNoteId ? "Actualizando nota clínica..." : "Guardando nota clínica...");

      if (editingNoteId) {
        await apiRequest<ClinicalNote>(`/clinical-notes/${editingNoteId}`, {
          method: "PUT",
          body: JSON.stringify({
            notes,
          }),
        });

        setMessage("Nota clínica actualizada correctamente.");
      } else {
        await apiRequest<ClinicalNote>("/clinical-notes", {
          method: "POST",
          body: JSON.stringify({
            appointmentId,
            notes,
          }),
        });

        setMessage("Nota clínica guardada correctamente.");
      }

      clearForm();
      await loadData();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Error al guardar nota clínica");
    } finally {
      setSaving(false);
    }
  }

  function handleEdit(note: ClinicalNote) {
    setEditingNoteId(note.id);
    setAppointmentId(note.appointmentId);
    setNotes(note.notes);
    setMessage(`Editando nota clínica de ${note.patientName ?? "paciente"}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleDelete(id: string) {
    const confirmed = window.confirm("¿Seguro que deseas eliminar esta nota clínica?");

    if (!confirmed) {
      return;
    }

    try {
      setMessage("Eliminando nota clínica...");

      await apiRequest<void>(`/clinical-notes/${id}`, {
        method: "DELETE",
      });

      setMessage("Nota clínica eliminada correctamente.");
      await loadData();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Error al eliminar nota clínica");
    }
  }

  function clearForm() {
    setEditingNoteId(null);
    setAppointmentId("");
    setNotes("");
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
          <h1 style={styles.title}>Historias clínicas</h1>
          <p style={styles.subtitle}>Notas clínicas asociadas a citas médicas</p>
        </div>

        <button style={styles.backButton} onClick={onBack}>
          Volver
        </button>
      </section>

      <section style={styles.card}>
        <h2 style={styles.sectionTitle}>
          {editingNoteId ? "Editar nota clínica" : "Registrar nota clínica"}
        </h2>

        {loading && <p>Cargando citas e historias clínicas...</p>}

        {!loading && (
          <form onSubmit={handleSubmit} style={styles.form}>
            <label style={styles.label}>
              Cita médica
              <select
                style={styles.input}
                value={appointmentId}
                onChange={(e) => setAppointmentId(e.target.value)}
                disabled={!!editingNoteId}
              >
                <option value="">Seleccione una cita</option>

                {appointments.map((appointment) => (
                  <option key={appointment.id} value={appointment.id}>
                    {appointment.patientName ?? "Paciente"} -{" "}
                    {appointment.doctorName ?? "Doctor"} -{" "}
                    {new Date(appointment.date).toLocaleString()} -{" "}
                    {getStatusLabel(appointment.status)}
                  </option>
                ))}
              </select>
            </label>

            <label style={styles.label}>
              Nota clínica
              <textarea
                style={styles.textarea}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ej: Paciente llega a consulta. Se registra evolución clínica inicial."
              />
            </label>

            <div style={styles.actions}>
              <button style={styles.saveButton} type="submit" disabled={saving}>
                {saving
                  ? "Guardando..."
                  : editingNoteId
                  ? "Guardar cambios"
                  : "Guardar nota clínica"}
              </button>

              {editingNoteId && (
                <button style={styles.cancelButton} type="button" onClick={clearForm}>
                  Cancelar edición
                </button>
              )}
            </div>
          </form>
        )}

        {message && <p style={styles.message}>{message}</p>}
      </section>

      <section style={styles.card}>
        <h2 style={styles.sectionTitle}>Listado de historias clínicas</h2>

        {clinicalNotes.length === 0 && !loading && (
          <p>No hay notas clínicas registradas.</p>
        )}

        {clinicalNotes.length > 0 && (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Paciente</th>
                <th style={styles.th}>Doctor</th>
                <th style={styles.th}>Fecha cita</th>
                <th style={styles.th}>Nota clínica</th>
                <th style={styles.th}>Fecha registro</th>
                <th style={styles.th}>Acciones</th>
              </tr>
            </thead>

            <tbody>
              {clinicalNotes.map((note) => (
                <tr key={note.id}>
                  <td style={styles.td}>{note.patientName ?? note.patientId}</td>
                  <td style={styles.td}>{note.doctorName ?? note.doctorId}</td>
                  <td style={styles.td}>
                    {note.appointmentDate
                      ? new Date(note.appointmentDate).toLocaleString()
                      : "Sin fecha"}
                  </td>
                  <td style={styles.td}>{note.notes}</td>
                  <td style={styles.td}>
                    {new Date(note.createdAtUtc).toLocaleString()}
                  </td>
                  <td style={styles.td}>
                    <div style={styles.rowActions}>
                      <button style={styles.editButton} onClick={() => handleEdit(note)}>
                        Editar
                      </button>

                      <button style={styles.deleteButton} onClick={() => handleDelete(note.id)}>
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
    maxWidth: "1200px",
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
    maxWidth: "1200px",
    margin: "0 auto 24px auto",
    padding: "24px",
    borderRadius: "18px",
    background: "white",
    boxShadow: "0 12px 35px rgba(0,0,0,0.06)",
    overflowX: "auto",
  },
  sectionTitle: {
    marginTop: 0,
    color: "#111827",
  },
  form: {
    display: "grid",
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
  textarea: {
    minHeight: "130px",
    padding: "12px",
    border: "1px solid #d1d5db",
    borderRadius: "10px",
    fontSize: "15px",
    background: "#3b3b3b",
    color: "white",
    resize: "vertical",
  },
  actions: {
    display: "flex",
    gap: "12px",
  },
  saveButton: {
    padding: "13px 18px",
    border: "none",
    borderRadius: "10px",
    background: "#2563eb",
    color: "white",
    fontWeight: "bold",
    cursor: "pointer",
  },
  cancelButton: {
    padding: "13px 18px",
    border: "none",
    borderRadius: "10px",
    background: "#6b7280",
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
  rowActions: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
  },
  editButton: {
    padding: "8px 12px",
    border: "none",
    borderRadius: "8px",
    background: "#f59e0b",
    color: "white",
    fontWeight: "bold",
    cursor: "pointer",
  },
  deleteButton: {
    padding: "8px 12px",
    border: "none",
    borderRadius: "8px",
    background: "#ef4444",
    color: "white",
    fontWeight: "bold",
    cursor: "pointer",
  },
};