import { useEffect, useState } from "react";
import { apiRequest } from "../api/api";
import { pageStyles } from "../styles/pageStyles";

type Doctor = {
  id: string;
  fullName: string;
  specialty: string;
  createdAtUtc: string;
};

type DoctorsPageProps = {
  onBack: () => void;
};

export function DoctorsPage({ onBack }: DoctorsPageProps) {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [fullName, setFullName] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [editingDoctorId, setEditingDoctorId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function loadDoctors() {
    try {
      setLoading(true);
      setMessage("");

      const data = await apiRequest<Doctor[]>("/doctors");
      setDoctors(data);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Error al cargar doctores");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmitDoctor(event: React.FormEvent) {
    event.preventDefault();

    if (!fullName.trim()) {
      setMessage("Ingrese el nombre completo del doctor.");
      return;
    }

    if (!specialty.trim()) {
      setMessage("Ingrese la especialidad.");
      return;
    }

    try {
      setSaving(true);
      setMessage(editingDoctorId ? "Actualizando doctor..." : "Guardando doctor...");

      if (editingDoctorId) {
        await apiRequest<Doctor>(`/doctors/${editingDoctorId}`, {
          method: "PUT",
          body: JSON.stringify({
            fullName,
            specialty,
          }),
        });

        setMessage("Doctor actualizado correctamente.");
      } else {
        await apiRequest<Doctor>("/doctors", {
          method: "POST",
          body: JSON.stringify({
            fullName,
            specialty,
          }),
        });

        setMessage("Doctor guardado correctamente.");
      }

      clearForm();
      await loadDoctors();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Error al guardar doctor");
    } finally {
      setSaving(false);
    }
  }

  function handleEditDoctor(doctor: Doctor) {
    setEditingDoctorId(doctor.id);
    setFullName(doctor.fullName);
    setSpecialty(doctor.specialty);
    setMessage(`Editando doctor: ${doctor.fullName}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function clearForm() {
    setEditingDoctorId(null);
    setFullName("");
    setSpecialty("");
  }

  async function handleDeleteDoctor(id: string, name: string) {
    const confirmed = window.confirm(`¿Seguro que deseas eliminar al doctor ${name}?`);

    if (!confirmed) {
      return;
    }

    try {
      setMessage("Eliminando doctor...");

      await apiRequest<void>(`/doctors/${id}`, {
        method: "DELETE",
      });

      setMessage("Doctor eliminado correctamente.");
      await loadDoctors();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Error al eliminar doctor");
    }
  }

  useEffect(() => {
    loadDoctors();
  }, []);

  const filteredDoctors = doctors.filter((doctor) => {
    const text = search.toLowerCase().trim();

    return (
      doctor.fullName.toLowerCase().includes(text) ||
      doctor.specialty.toLowerCase().includes(text)
    );
  });

  return (
    <main style={styles.page}>
      <section style={styles.header}>
        <div>
          <h1 style={styles.title}>Doctores</h1>
          <p style={styles.subtitle}>Gestión de doctores conectada a PostgreSQL</p>
        </div>

        <button style={styles.backButton} onClick={onBack}>
          Volver
        </button>
      </section>

      <section style={styles.card}>
        <h2 style={styles.sectionTitle}>
          {editingDoctorId ? "Editar doctor" : "Registrar doctor"}
        </h2>

        <form onSubmit={handleSubmitDoctor} style={styles.form}>
          <label style={styles.label}>
            Nombre completo
            <input
              style={styles.input}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Ej: Dr. Carlos Mendoza"
            />
          </label>

          <label style={styles.label}>
            Especialidad
            <input
              style={styles.input}
              value={specialty}
              onChange={(e) => setSpecialty(e.target.value)}
              placeholder="Ej: Medicina General"
            />
          </label>

          <button style={styles.saveButton} type="submit" disabled={saving}>
            {saving
              ? "Guardando..."
              : editingDoctorId
              ? "Guardar cambios"
              : "Guardar doctor"}
          </button>

          {editingDoctorId && (
            <button style={styles.cancelButton} type="button" onClick={clearForm}>
              Cancelar
            </button>
          )}
        </form>

        {message && <p style={styles.message}>{message}</p>}
      </section>

      <section style={styles.card}>
        <h2 style={styles.sectionTitle}>Listado de doctores</h2>

        <input
          style={styles.searchInput}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nombre o especialidad..."
        />

        {loading && <p>Cargando doctores...</p>}

        {!loading && filteredDoctors.length === 0 && (
          <p>No hay doctores que coincidan con la búsqueda.</p>
        )}

        {!loading && filteredDoctors.length > 0 && (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Nombre completo</th>
                <th style={styles.th}>Especialidad</th>
                <th style={styles.th}>Fecha registro</th>
                <th style={styles.th}>Acciones</th>
              </tr>
            </thead>

            <tbody>
              {filteredDoctors.map((doctor) => (
                <tr key={doctor.id}>
                  <td style={styles.td}>{doctor.fullName}</td>
                  <td style={styles.td}>{doctor.specialty}</td>
                  <td style={styles.td}>
                    {new Date(doctor.createdAtUtc).toLocaleString()}
                  </td>
                  <td style={styles.td}>
                    <div style={styles.actions}>
                      <button
                        style={styles.editButton}
                        onClick={() => handleEditDoctor(doctor)}
                      >
                        Editar
                      </button>

                      <button
                        style={styles.deleteButton}
                        onClick={() => handleDeleteDoctor(doctor.id, doctor.fullName)}
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
    gridTemplateColumns: "1fr 1fr auto auto",
    gap: "16px",
    alignItems: "end",
  },};
