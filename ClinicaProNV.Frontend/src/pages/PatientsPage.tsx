import { useEffect, useState } from "react";
import { apiRequest } from "../api/api";
import { pageStyles } from "../styles/pageStyles";

type Patient = {
  id: string;
  fullName: string;
  identification: string;
  email: string;
  whatsAppNumber: string;
  birthDate: string;
  gender: string;
  address: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  bloodType: string;
  recordsCount: number;
  createdAtUtc: string;
};

type PatientRecord = {
  id: string;
  patientId: string;
  reasonForVisit: string;
  currentCondition: string;
  symptoms: string;
  allergies: string;
  medicalHistory: string;
  vitalSigns: string;
  physicalSheetReference: string;
  physicalSheetTranscript: string;
  notes: string;
  createdAtUtc: string;
};

type PatientsPageProps = {
  onBack: () => void;
};

export function PatientsPage({ onBack }: PatientsPageProps) {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [fullName, setFullName] = useState("");
  const [identification, setIdentification] = useState("");
  const [email, setEmail] = useState("");
  const [whatsAppNumber, setWhatsAppNumber] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [gender, setGender] = useState("");
  const [address, setAddress] = useState("");
  const [emergencyContactName, setEmergencyContactName] = useState("");
  const [emergencyContactPhone, setEmergencyContactPhone] = useState("");
  const [bloodType, setBloodType] = useState("");
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [selectedRecordId, setSelectedRecordId] = useState("");
  const [patientRecords, setPatientRecords] = useState<PatientRecord[]>([]);
  const [reasonForVisit, setReasonForVisit] = useState("");
  const [currentCondition, setCurrentCondition] = useState("");
  const [symptoms, setSymptoms] = useState("");
  const [allergies, setAllergies] = useState("");
  const [medicalHistory, setMedicalHistory] = useState("");
  const [vitalSigns, setVitalSigns] = useState("");
  const [physicalSheetReference, setPhysicalSheetReference] = useState("");
  const [physicalSheetTranscript, setPhysicalSheetTranscript] = useState("");
  const [recordNotes, setRecordNotes] = useState("");
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
            email,
            whatsAppNumber,
            birthDate,
            gender,
            address,
            emergencyContactName,
            emergencyContactPhone,
            bloodType,
          }),
        });

        setMessage("Paciente actualizado correctamente.");
      } else {
        await apiRequest<Patient>("/patients", {
          method: "POST",
          body: JSON.stringify({
            fullName,
            identification,
            email,
            whatsAppNumber,
            birthDate,
            gender,
            address,
            emergencyContactName,
            emergencyContactPhone,
            bloodType,
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
    setEmail(patient.email ?? "");
    setWhatsAppNumber(patient.whatsAppNumber ?? "");
    setBirthDate(patient.birthDate ?? "");
    setGender(patient.gender ?? "");
    setAddress(patient.address ?? "");
    setEmergencyContactName(patient.emergencyContactName ?? "");
    setEmergencyContactPhone(patient.emergencyContactPhone ?? "");
    setBloodType(patient.bloodType ?? "");
    setMessage(`Editando paciente: ${patient.fullName}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function clearForm() {
    setEditingPatientId(null);
    setFullName("");
    setIdentification("");
    setEmail("");
    setWhatsAppNumber("");
    setBirthDate("");
    setGender("");
    setAddress("");
    setEmergencyContactName("");
    setEmergencyContactPhone("");
    setBloodType("");
  }

  async function loadPatientRecords(patientId: string) {
    if (!patientId) {
      setPatientRecords([]);
      return;
    }

    try {
      const data = await apiRequest<PatientRecord[]>(`/patients/${patientId}/records`);
      setPatientRecords(data);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Error al cargar fichas");
    }
  }

  async function handleSelectPatientForRecord(patientId: string) {
    setSelectedPatientId(patientId);
    setSelectedRecordId("");
    await loadPatientRecords(patientId);
  }

  async function handleViewPatientRecords(patient: Patient) {
    await handleSelectPatientForRecord(patient.id);
    setMessage(`Ficha abierta: ${patient.fullName}`);
    window.scrollTo({ top: 360, behavior: "smooth" });
  }

  function clearRecordForm() {
    setReasonForVisit("");
    setCurrentCondition("");
    setSymptoms("");
    setAllergies("");
    setMedicalHistory("");
    setVitalSigns("");
    setPhysicalSheetReference("");
    setPhysicalSheetTranscript("");
    setRecordNotes("");
  }

  async function handleSubmitRecord(event: React.FormEvent) {
    event.preventDefault();

    if (!selectedPatientId) {
      setMessage("Seleccione un paciente para registrar la ficha.");
      return;
    }

    if (!reasonForVisit.trim()) {
      setMessage("Ingrese el motivo de ingreso.");
      return;
    }

    try {
      setSaving(true);
      setMessage("Guardando ficha...");

      await apiRequest<void>(`/patients/${selectedPatientId}/records`, {
        method: "POST",
        body: JSON.stringify({
          reasonForVisit,
          currentCondition,
          symptoms,
          allergies,
          medicalHistory,
          vitalSigns,
          physicalSheetReference,
          physicalSheetTranscript,
          notes: recordNotes,
        }),
      });

      setMessage("Ficha guardada correctamente.");
      clearRecordForm();
      await loadPatientRecords(selectedPatientId);
      await loadPatients();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Error al guardar ficha");
    } finally {
      setSaving(false);
    }
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
      patient.identification.toLowerCase().includes(text) ||
      (patient.email ?? "").toLowerCase().includes(text) ||
      (patient.whatsAppNumber ?? "").toLowerCase().includes(text) ||
      (patient.address ?? "").toLowerCase().includes(text)
    );
  });

  const selectedPatient = patients.find((patient) => patient.id === selectedPatientId);
  const selectedRecord = patientRecords.find((record) => record.id === selectedRecordId);
  const lastNameFolder = selectedPatient ? getLastName(selectedPatient.fullName) : "";
  const groupedRecords = patientRecords.reduce<Record<string, PatientRecord[]>>((groups, record) => {
    const folder = getRecordFolder(record.reasonForVisit);
    groups[folder] = [...(groups[folder] ?? []), record];
    return groups;
  }, {});

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

          <label style={styles.label}>
            Correo
            <input
              style={styles.input}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              placeholder="Ej: paciente@correo.com"
            />
          </label>

          <label style={styles.label}>
            WhatsApp
            <input
              style={styles.input}
              value={whatsAppNumber}
              onChange={(e) => setWhatsAppNumber(e.target.value)}
              placeholder="Ej: 593991234567"
            />
          </label>

          <label style={styles.label}>
            Fecha nacimiento
            <input
              style={styles.input}
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              type="date"
            />
          </label>

          <label style={styles.label}>
            Género
            <select
              style={styles.input}
              value={gender}
              onChange={(e) => setGender(e.target.value)}
            >
              <option value="">No especificado</option>
              <option value="Femenino">Femenino</option>
              <option value="Masculino">Masculino</option>
              <option value="Otro">Otro</option>
            </select>
          </label>

          <label style={styles.label}>
            Tipo sangre
            <input
              style={styles.input}
              value={bloodType}
              onChange={(e) => setBloodType(e.target.value)}
              placeholder="Ej: O+"
            />
          </label>

          <label style={styles.label}>
            Dirección
            <input
              style={styles.input}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Dirección del paciente"
            />
          </label>

          <label style={styles.label}>
            Contacto emergencia
            <input
              style={styles.input}
              value={emergencyContactName}
              onChange={(e) => setEmergencyContactName(e.target.value)}
              placeholder="Nombre contacto"
            />
          </label>

          <label style={styles.label}>
            Teléfono emergencia
            <input
              style={styles.input}
              value={emergencyContactPhone}
              onChange={(e) => setEmergencyContactPhone(e.target.value)}
              placeholder="Teléfono contacto"
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
        <h2 style={styles.sectionTitle}>Ficha clínica / técnica</h2>

        <form onSubmit={handleSubmitRecord} style={styles.recordForm}>
          <label style={styles.label}>
            Paciente
            <select
              style={styles.input}
              value={selectedPatientId}
              onChange={(e) => handleSelectPatientForRecord(e.target.value)}
            >
              <option value="">Seleccione paciente</option>
              {patients.map((patient) => (
                <option key={patient.id} value={patient.id}>
                  {patient.fullName} - {patient.identification}
                </option>
              ))}
            </select>
          </label>

          <label style={styles.label}>
            Motivo de ingreso
            <input
              style={styles.input}
              value={reasonForVisit}
              onChange={(e) => setReasonForVisit(e.target.value)}
              placeholder="Ej: Dolor abdominal, control, emergencia"
            />
          </label>

          <label style={styles.label}>
            Qué tiene / condición actual
            <textarea
              style={styles.textarea}
              value={currentCondition}
              onChange={(e) => setCurrentCondition(e.target.value)}
              placeholder="Descripción del estado actual"
            />
          </label>

          <label style={styles.label}>
            Síntomas
            <textarea
              style={styles.textarea}
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
              placeholder="Síntomas reportados"
            />
          </label>

          <label style={styles.label}>
            Alergias
            <textarea
              style={styles.textarea}
              value={allergies}
              onChange={(e) => setAllergies(e.target.value)}
              placeholder="Medicamentos, alimentos u otras alergias"
            />
          </label>

          <label style={styles.label}>
            Antecedentes
            <textarea
              style={styles.textarea}
              value={medicalHistory}
              onChange={(e) => setMedicalHistory(e.target.value)}
              placeholder="Antecedentes personales/familiares"
            />
          </label>

          <label style={styles.label}>
            Signos vitales / datos técnicos
            <textarea
              style={styles.textarea}
              value={vitalSigns}
              onChange={(e) => setVitalSigns(e.target.value)}
              placeholder="PA, FC, temperatura, peso, talla, etc."
            />
          </label>

          <label style={styles.label}>
            Referencia hoja física
            <input
              style={styles.input}
              value={physicalSheetReference}
              onChange={(e) => setPhysicalSheetReference(e.target.value)}
              placeholder="Ej: Caja 2 / Carpeta 14 / Hoja 2026-001"
            />
          </label>

          <label style={styles.label}>
            Transcripción hoja física
            <textarea
              style={styles.textarea}
              value={physicalSheetTranscript}
              onChange={(e) => setPhysicalSheetTranscript(e.target.value)}
              placeholder="Copie aquí la información de la hoja física"
            />
          </label>

          <label style={styles.label}>
            Notas internas
            <textarea
              style={styles.textarea}
              value={recordNotes}
              onChange={(e) => setRecordNotes(e.target.value)}
              placeholder="Notas adicionales"
            />
          </label>

          <button style={styles.saveButton} type="submit" disabled={saving}>
            {saving ? "Guardando..." : "Guardar ficha"}
          </button>
        </form>

        {selectedPatientId && patientRecords.length > 0 && (
          <>
            <div style={styles.folderHeader}>
              <div>
                <span>Carpeta por apellido</span>
                <strong>{lastNameFolder}</strong>
              </div>
              <div>
                <span>Paciente</span>
                <strong>{selectedPatient?.fullName}</strong>
              </div>
              <div>
                <span>Fichas</span>
                <strong>{patientRecords.length}</strong>
              </div>
            </div>

            <div style={styles.folderGrid}>
              {Object.entries(groupedRecords).map(([folder, records]) => (
                <section key={folder} style={styles.folderBox}>
                  <h3 style={styles.folderTitle}>{folder}</h3>
                  <div style={styles.recordList}>
                    {records.map((record) => (
                      <button
                        key={record.id}
                        style={{
                          ...styles.recordButton,
                          ...(selectedRecordId === record.id ? styles.activeRecordButton : {}),
                        }}
                        type="button"
                        onClick={() => setSelectedRecordId(record.id)}
                      >
                        <strong>{record.reasonForVisit}</strong>
                        <span>{new Date(record.createdAtUtc).toLocaleString()}</span>
                        <small>{record.currentCondition || record.symptoms || "Sin detalle adicional"}</small>
                      </button>
                    ))}
                  </div>
                </section>
              ))}
            </div>

            {selectedRecord && (
              <article style={styles.recordDetail}>
                <div style={styles.detailsHeader}>
                  <h3 style={styles.subTitle}>Detalle de ficha</h3>
                  <span style={styles.folderBadge}>
                    {getRecordFolder(selectedRecord.reasonForVisit)}
                  </span>
                </div>
                <div style={styles.detailGrid}>
                  <DetailBlock label="Motivo" value={selectedRecord.reasonForVisit} />
                  <DetailBlock label="Condición actual" value={selectedRecord.currentCondition} />
                  <DetailBlock label="Síntomas" value={selectedRecord.symptoms} />
                  <DetailBlock label="Alergias" value={selectedRecord.allergies} />
                  <DetailBlock label="Antecedentes" value={selectedRecord.medicalHistory} />
                  <DetailBlock label="Signos vitales" value={selectedRecord.vitalSigns} />
                  <DetailBlock label="Hoja física" value={selectedRecord.physicalSheetReference} />
                  <DetailBlock label="Transcripción" value={selectedRecord.physicalSheetTranscript} />
                  <DetailBlock label="Notas internas" value={selectedRecord.notes} />
                </div>
              </article>
            )}
          </>
        )}
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
                <th style={styles.th}>Correo</th>
                <th style={styles.th}>WhatsApp</th>
                <th style={styles.th}>Fichas</th>
                <th style={styles.th}>Fecha registro</th>
                <th style={styles.th}>Acciones</th>
              </tr>
            </thead>

            <tbody>
              {filteredPatients.map((patient) => (
                <tr key={patient.id}>
                  <td style={styles.td}>{patient.fullName}</td>
                  <td style={styles.td}>{patient.identification}</td>
                  <td style={styles.td}>{patient.email || "Sin correo"}</td>
                  <td style={styles.td}>{patient.whatsAppNumber || "Sin WhatsApp"}</td>
                  <td style={styles.td}>{patient.recordsCount ?? 0}</td>
                  <td style={styles.td}>
                    {new Date(patient.createdAtUtc).toLocaleString()}
                  </td>
                  <td style={styles.td}>
                    <div style={styles.actions}>
                      <button
                        style={styles.viewButton}
                        onClick={() => handleViewPatientRecords(patient)}
                      >
                        Ver ficha
                      </button>

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

function getLastName(fullName: string) {
  const parts = fullName.trim().split(/\s+/);
  return parts.length > 1 ? parts[parts.length - 1].toUpperCase() : "SIN APELLIDO";
}

function getRecordFolder(reason: string) {
  const text = reason.toLowerCase();

  if (text.includes("oper") || text.includes("cirug") || text.includes("quir")) {
    return "Operaciones";
  }

  if (text.includes("emerg") || text.includes("urgenc") || text.includes("grave")) {
    return "Emergencia / gravedad";
  }

  if (text.includes("control") || text.includes("seguimiento") || text.includes("revision")) {
    return "Controles";
  }

  if (text.includes("consulta") || text.includes("general")) {
    return "Consulta general";
  }

  return "Otros";
}

function DetailBlock({ label, value }: { label: string; value: string }) {
  return (
    <div style={styles.detailBlock}>
      <span>{label}</span>
      <p>{value || "Sin registro"}</p>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  ...pageStyles,
  form: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "16px",
    alignItems: "end",
  },
  recordForm: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
    gap: "16px",
    alignItems: "end",
  },
  recordList: {
    display: "grid",
    gap: "10px",
    marginTop: "18px",
  },
  recordItem: {
    display: "grid",
    gap: "6px",
    padding: "14px",
    border: "1px solid #d9e8ee",
    borderRadius: "10px",
    color: "#12323f",
    background: "#f8fafc",
  },
  folderHeader: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "12px",
    marginTop: "18px",
    padding: "14px",
    borderRadius: "10px",
    background: "#e7f7f4",
    color: "#0b635d",
  },
  folderGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: "14px",
    marginTop: "16px",
  },
  folderBox: {
    padding: "14px",
    border: "1px solid #dbe4ea",
    borderRadius: "10px",
    background: "#ffffff",
  },
  folderTitle: {
    margin: "0 0 10px",
    color: "#12323f",
    fontSize: "17px",
  },
  recordButton: {
    display: "grid",
    gap: "5px",
    width: "100%",
    padding: "12px",
    border: "1px solid #d9e8ee",
    borderRadius: "8px",
    background: "#f8fafc",
    color: "#12323f",
    cursor: "pointer",
    textAlign: "left",
  },
  activeRecordButton: {
    borderColor: "#0e9384",
    background: "#e7f7f4",
  },
  recordDetail: {
    marginTop: "18px",
    padding: "18px",
    border: "1px solid #0e9384",
    borderRadius: "10px",
    background: "#ffffff",
  },
  folderBadge: {
    padding: "7px 10px",
    borderRadius: "999px",
    background: "#e7f7f4",
    color: "#0b635d",
    fontWeight: "bold",
  },
  detailGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "12px",
    marginTop: "14px",
  },
  detailBlock: {
    padding: "12px",
    borderRadius: "8px",
    background: "#f8fafc",
    color: "#12323f",
  },
  viewButton: {
    padding: "8px 12px",
    border: "none",
    borderRadius: "8px",
    background: "#0e9384",
    color: "white",
    fontWeight: "bold",
    cursor: "pointer",
  },
};
