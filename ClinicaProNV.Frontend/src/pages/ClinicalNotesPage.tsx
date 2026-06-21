import { useEffect, useState } from "react";
import { apiRequest } from "../api/api";
import { pageStyles } from "../styles/pageStyles";

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

type Medicine = {
  id: string;
  name: string;
  unitPrice: number;
  stock: number;
  requiresPrescription: boolean;
};

type PrescriptionDetailInput = {
  medicineId: string;
  quantity: string;
  dosage: string;
  instructions: string;
};

type Prescription = {
  id: string;
  appointmentId: string;
  notes: string;
  createdAtUtc: string;
  appointmentDate: string;
  patientName: string | null;
  doctorName: string | null;
  details: Array<{
    id: string;
    medicineId: string;
    medicineName: string | null;
    quantity: number;
    dosage: string;
    instructions: string;
  }>;
};

type ClinicalNotesPageProps = {
  onBack: () => void;
};

export function ClinicalNotesPage({ onBack }: ClinicalNotesPageProps) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [clinicalNotes, setClinicalNotes] = useState<ClinicalNote[]>([]);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);

  const [appointmentId, setAppointmentId] = useState("");
  const [notes, setNotes] = useState("");
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [patientFilter, setPatientFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [prescriptionAppointmentId, setPrescriptionAppointmentId] = useState("");
  const [prescriptionNotes, setPrescriptionNotes] = useState("");
  const [prescriptionDetails, setPrescriptionDetails] = useState<PrescriptionDetailInput[]>([
    {
      medicineId: "",
      quantity: "1",
      dosage: "",
      instructions: "",
    },
  ]);

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
      const medicinesData = await apiRequest<Medicine[]>("/medicines");
      setMedicines(medicinesData);
      const prescriptionsData = await apiRequest<Prescription[]>("/prescriptions");
      setPrescriptions(prescriptionsData);

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

  function updatePrescriptionDetail(
    index: number,
    field: keyof PrescriptionDetailInput,
    value: string
  ) {
    setPrescriptionDetails((current) =>
      current.map((detail, i) => (i === index ? { ...detail, [field]: value } : detail))
    );
  }

  function addPrescriptionDetail() {
    setPrescriptionDetails((current) => [
      ...current,
      {
        medicineId: "",
        quantity: "1",
        dosage: "",
        instructions: "",
      },
    ]);
  }

  function removePrescriptionDetail(index: number) {
    setPrescriptionDetails((current) =>
      current.length === 1 ? current : current.filter((_, i) => i !== index)
    );
  }

  function clearPrescriptionForm() {
    setPrescriptionAppointmentId("");
    setPrescriptionNotes("");
    setPrescriptionDetails([
      {
        medicineId: "",
        quantity: "1",
        dosage: "",
        instructions: "",
      },
    ]);
  }

  async function handleSubmitPrescription(event: React.FormEvent) {
    event.preventDefault();

    if (!prescriptionAppointmentId) {
      setMessage("Seleccione una cita para la receta.");
      return;
    }

    const cleanDetails = prescriptionDetails.map((detail) => ({
      medicineId: detail.medicineId,
      quantity: Number(detail.quantity),
      dosage: detail.dosage,
      instructions: detail.instructions,
    }));

    if (cleanDetails.some((detail) => !detail.medicineId)) {
      setMessage("Todos los medicamentos de la receta son obligatorios.");
      return;
    }

    if (cleanDetails.some((detail) => detail.quantity <= 0)) {
      setMessage("La cantidad debe ser mayor a cero.");
      return;
    }

    try {
      setSaving(true);
      setMessage("Guardando receta...");

      await apiRequest<void>("/prescriptions", {
        method: "POST",
        body: JSON.stringify({
          appointmentId: prescriptionAppointmentId,
          notes: prescriptionNotes,
          details: cleanDetails,
        }),
      });

      setMessage("Receta guardada correctamente.");
      clearPrescriptionForm();
      await loadData();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Error al guardar receta");
    } finally {
      setSaving(false);
    }
  }

  function handlePrintPrescription(prescription: Prescription) {
    const details = prescription.details
      .map(
        (detail) =>
          `${detail.medicineName ?? detail.medicineId} - Cantidad: ${detail.quantity} - Dosis: ${detail.dosage} - Indicaciones: ${detail.instructions}`
      )
      .join("\n");

    const printable = window.open("", "_blank", "width=820,height=900");

    if (!printable) {
      setMessage("No se pudo abrir la ventana de impresión.");
      return;
    }

    printable.document.write(`
      <html>
        <head>
          <title>Receta CLININOVA</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 32px; color: #12323f; }
            h1 { margin: 0 0 8px; }
            .meta { display: grid; gap: 6px; margin: 20px 0; }
            pre { white-space: pre-wrap; font-family: Arial, sans-serif; line-height: 1.5; }
            .notes { margin-top: 20px; padding-top: 14px; border-top: 1px solid #c9dce3; }
          </style>
        </head>
        <body>
          <h1>CLININOVA</h1>
          <h2>Receta médica</h2>
          <div class="meta">
            <span><strong>Paciente:</strong> ${prescription.patientName ?? "Paciente"}</span>
            <span><strong>Doctor:</strong> ${prescription.doctorName ?? "Doctor"}</span>
            <span><strong>Fecha cita:</strong> ${new Date(prescription.appointmentDate).toLocaleString()}</span>
            <span><strong>Fecha receta:</strong> ${new Date(prescription.createdAtUtc).toLocaleString()}</span>
          </div>
          <h3>Medicamentos</h3>
          <pre>${details}</pre>
          <div class="notes"><strong>Observaciones:</strong> ${prescription.notes}</div>
          <script>window.print();</script>
        </body>
      </html>
    `);
    printable.document.close();
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

  const availableAppointments = appointments.filter((appointment) =>
    editingNoteId ? appointment.id === appointmentId : appointment.status === 1 || appointment.status === 2
  );

  const patientsFromNotes = Array.from(
    new Map(
      clinicalNotes.map((note) => [
        note.patientId,
        note.patientName ?? note.patientId,
      ])
    ).entries()
  );

  const filteredNotes = clinicalNotes.filter((note) => {
    const text = search.toLowerCase().trim();

    if (patientFilter !== "all" && note.patientId !== patientFilter) {
      return false;
    }

    return (
      !text ||
      note.notes.toLowerCase().includes(text) ||
      (note.patientName ?? "").toLowerCase().includes(text) ||
      (note.doctorName ?? "").toLowerCase().includes(text)
    );
  });

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

                {availableAppointments.map((appointment) => (
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
        <h2 style={styles.sectionTitle}>Receta médica</h2>

        {!loading && (
          <form onSubmit={handleSubmitPrescription} style={styles.form}>
            <label style={styles.label}>
              Cita médica
              <select
                style={styles.input}
                value={prescriptionAppointmentId}
                onChange={(e) => setPrescriptionAppointmentId(e.target.value)}
              >
                <option value="">Seleccione una cita</option>
                {availableAppointments.map((appointment) => (
                  <option key={appointment.id} value={appointment.id}>
                    {appointment.patientName ?? "Paciente"} -{" "}
                    {appointment.doctorName ?? "Doctor"} -{" "}
                    {new Date(appointment.date).toLocaleString()}
                  </option>
                ))}
              </select>
            </label>

            <div style={styles.detailsHeader}>
              <h3 style={styles.subTitle}>Medicamentos</h3>
              <button
                style={styles.addButton}
                type="button"
                onClick={addPrescriptionDetail}
              >
                Agregar medicamento
              </button>
            </div>

            {prescriptionDetails.map((detail, index) => (
              <div key={index} style={styles.prescriptionRow}>
                <label style={styles.label}>
                  Medicamento
                  <select
                    style={styles.input}
                    value={detail.medicineId}
                    onChange={(e) =>
                      updatePrescriptionDetail(index, "medicineId", e.target.value)
                    }
                  >
                    <option value="">Seleccione medicamento</option>
                    {medicines.map((medicine) => (
                      <option key={medicine.id} value={medicine.id}>
                        {medicine.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label style={styles.label}>
                  Cantidad
                  <input
                    style={styles.input}
                    type="number"
                    min="1"
                    value={detail.quantity}
                    onChange={(e) =>
                      updatePrescriptionDetail(index, "quantity", e.target.value)
                    }
                  />
                </label>

                <label style={styles.label}>
                  Dosis
                  <input
                    style={styles.input}
                    value={detail.dosage}
                    onChange={(e) =>
                      updatePrescriptionDetail(index, "dosage", e.target.value)
                    }
                    placeholder="Ej: 1 tableta cada 8 horas"
                  />
                </label>

                <label style={styles.label}>
                  Indicaciones
                  <input
                    style={styles.input}
                    value={detail.instructions}
                    onChange={(e) =>
                      updatePrescriptionDetail(index, "instructions", e.target.value)
                    }
                    placeholder="Ej: Después de alimentos"
                  />
                </label>

                <button
                  style={styles.deleteButton}
                  type="button"
                  onClick={() => removePrescriptionDetail(index)}
                  disabled={prescriptionDetails.length === 1}
                >
                  Quitar
                </button>
              </div>
            ))}

            <label style={styles.label}>
              Observaciones
              <textarea
                style={styles.textarea}
                value={prescriptionNotes}
                onChange={(e) => setPrescriptionNotes(e.target.value)}
                placeholder="Indicaciones generales para el paciente"
              />
            </label>

            <button style={styles.saveButton} type="submit" disabled={saving}>
              {saving ? "Guardando..." : "Guardar receta"}
            </button>
          </form>
        )}
      </section>

      <section style={styles.card}>
        <h2 style={styles.sectionTitle}>Recetas emitidas</h2>

        {!loading && prescriptions.length === 0 && <p>No hay recetas registradas.</p>}

        {!loading && prescriptions.length > 0 && (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Paciente</th>
                <th style={styles.th}>Doctor</th>
                <th style={styles.th}>Fecha</th>
                <th style={styles.th}>Medicamentos</th>
                <th style={styles.th}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {prescriptions.map((prescription) => (
                <tr key={prescription.id}>
                  <td style={styles.td}>{prescription.patientName ?? "Paciente"}</td>
                  <td style={styles.td}>{prescription.doctorName ?? "Doctor"}</td>
                  <td style={styles.td}>
                    {new Date(prescription.createdAtUtc).toLocaleString()}
                  </td>
                  <td style={styles.td}>{prescription.details.length}</td>
                  <td style={styles.td}>
                    <button
                      style={styles.editButton}
                      type="button"
                      onClick={() => handlePrintPrescription(prescription)}
                    >
                      Imprimir
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section style={styles.card}>
        <h2 style={styles.sectionTitle}>Listado de historias clínicas</h2>

        <div style={styles.filters}>
          <label style={styles.label}>
            Paciente
            <select
              style={styles.input}
              value={patientFilter}
              onChange={(e) => setPatientFilter(e.target.value)}
            >
              <option value="all">Todos</option>
              {patientsFromNotes.map(([patientId, patientName]) => (
                <option key={patientId} value={patientId}>
                  {patientName}
                </option>
              ))}
            </select>
          </label>

          <label style={styles.label}>
            Buscar en historial
            <input
              style={styles.input}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Paciente, doctor o texto de nota"
            />
          </label>
        </div>

        {filteredNotes.length === 0 && !loading && (
          <p>No hay notas clínicas registradas.</p>
        )}

        {filteredNotes.length > 0 && (
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
              {filteredNotes.map((note) => (
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
  ...pageStyles,
  form: {
    display: "grid",
    gap: "16px",
  },
  prescriptionRow: {
    display: "grid",
    gridTemplateColumns: "1.4fr 0.55fr 1fr 1fr auto",
    gap: "12px",
    alignItems: "end",
  },
  filters: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "12px",
    marginBottom: "18px",
  },};
