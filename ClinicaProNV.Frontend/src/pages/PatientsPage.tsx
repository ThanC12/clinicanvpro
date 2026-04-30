import { useEffect, useState } from "react";
import { apiRequest } from "../api/api";

type Patient = {
  id: string;
  fullName: string;
  identification: string;
  createdAtUtc: string;
};

type PatientsPageProps = {
  onBack: () => void;
};

export function PatientsPage({ onBack }: PatientsPageProps) {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [fullName, setFullName] = useState("");
  const [identification, setIdentification] = useState("");
  const [editingPatientId, setEditingPatientId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function loadPatients() {
    try {
      setLoading(true);
      setMessage("");

      const data = await apiRequest<Patient[]>("/patients");
      setPatients(data);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Error al cargar pacientes");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmitPatient(event: React.FormEvent) {
    event.preventDefault();

    if (!fullName.trim()) {
      setMessage("Ingrese el nombre completo.");
      return;
    }

    if (!identification.trim()) {
      setMessage("Ingrese la identificación.");
      return;
    }

    try {
      setSaving(true);
      setMessage(editingPatientId ? "Actualizando paciente..." : "Guardando paciente...");

      if (editingPatientId) {
        await apiRequest<Patient>(`/patients/${editingPatientId}`, {
          method: "PUT",
          body: JSON.stringify({
            fullName,
            identification,
          }),
        });

        setMessage("Paciente actualizado correctamente.");
      } else {
        await apiRequest<Patient>("/patients", {
          method: "POST",
          body: JSON.stringify({
            fullName,
            identification,
          }),
        });

        setMessage("Paciente guardado correctamente.");
      }

      clearForm();
      await loadPatients();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Error al guardar paciente");
    } finally {
      setSaving(false);
    }
  }

  function handleEditPatient(patient: Patient) {
    setEditingPatientId(patient.id);
    setFullName(patient.fullName);
    setIdentification(patient.identification);
    setMessage(`Editando paciente: ${patient.fullName}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function clearForm() {
    setEditingPatientId(null);
    setFullName("");
    setIdentification("");
  }

  async function handleDeletePatient(id: string, name: string) {
    const confirmed = window.confirm(
      `¿Seguro que deseas eliminar al paciente ${name}?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setMessage("Eliminando paciente...");

      await apiRequest<void>(`/patients/${id}`, {
        method: "DELETE",
      });

      setMessage("Paciente eliminado correctamente.");
      await loadPatients();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Error al eliminar paciente");
    }
  }

  useEffect(() => {
    loadPatients();
  }, []);

  const filteredPatients = patients.filter((patient) => {
    const text = search.toLowerCase().trim();

    return (
      patient.fullName.toLowerCase().includes(text) ||
      patient.identification.toLowerCase().includes(text)
    );
  });

  return (
    <main style={styles.page}>
      <section style={styles.header}>
        <div>
          <h1 style={styles.title}>Pacientes</h1>
          <p style={styles.subtitle}>Gestión de pacientes conectada a PostgreSQL</p>
        </div>

        <button style={styles.backButton} onClick={onBack}>
          Volver
        </button>
      </section>

      <section style={styles.card}>
        <h2 style={styles.sectionTitle}>
          {editingPatientId ? "Editar paciente" : "Registrar paciente"}
        </h2>

        <form onSubmit={handleSubmitPatient} style={styles.form}>
          <label style={styles.label}>
            Nombre completo
            <input
              style={styles.input}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Ej: Luis Torres"
            />
          </label>

          <label style={styles.label}>
            Identificación
            <input
              style={styles.input}
              value={identification}
              onChange={(e) => setIdentification(e.target.value)}
              placeholder="Ej: 1700000001"
            />
          </label>

          <button style={styles.saveButton} type="submit" disabled={saving}>
            {saving
              ? "Guardando..."
              : editingPatientId
              ? "Guardar cambios"
              : "Guardar paciente"}
          </button>

          {editingPatientId && (
            <button
              style={styles.cancelButton}
              type="button"
              onClick={clearForm}
            >
              Cancelar
            </button>
          )}
        </form>

        {message && <p style={styles.message}>{message}</p>}
      </section>

      <section style={styles.card}>
        <h2 style={styles.sectionTitle}>Listado de pacientes</h2>

        <input
          style={styles.searchInput}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nombre o identificación..."
        />

        {loading && <p>Cargando pacientes...</p>}

        {!loading && filteredPatients.length === 0 && (
          <p>No hay pacientes que coincidan con la búsqueda.</p>
        )}

        {!loading && filteredPatients.length > 0 && (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Nombre completo</th>
                <th style={styles.th}>Identificación</th>
                <th style={styles.th}>Fecha registro</th>
                <th style={styles.th}>Acciones</th>
              </tr>
            </thead>

            <tbody>
              {filteredPatients.map((patient) => (
                <tr key={patient.id}>
                  <td style={styles.td}>{patient.fullName}</td>
                  <td style={styles.td}>{patient.identification}</td>
                  <td style={styles.td}>
                    {new Date(patient.createdAtUtc).toLocaleString()}
                  </td>
                  <td style={styles.td}>
                    <div style={styles.actions}>
                      <button
                        style={styles.editButton}
                        onClick={() => handleEditPatient(patient)}
                      >
                        Editar
                      </button>

                      <button
                        style={styles.deleteButton}
                        onClick={() =>
                          handleDeletePatient(patient.id, patient.fullName)
                        }
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
    gridTemplateColumns: "1fr 1fr auto auto",
    gap: "16px",
    alignItems: "end",
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
  },
  searchInput: {
    width: "100%",
    boxSizing: "border-box",
    padding: "12px",
    marginBottom: "18px",
    border: "1px solid #d1d5db",
    borderRadius: "10px",
    fontSize: "15px",
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
  },
  actions: {
    display: "flex",
    gap: "8px",
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