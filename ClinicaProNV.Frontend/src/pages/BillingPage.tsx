import { useEffect, useMemo, useState } from "react";
import { apiRequest } from "../api/api";

type Patient = {
  id: string;
  fullName: string;
  identification: string;
  createdAtUtc: string;
};

type InvoiceDetailInput = {
  description: string;
  quantity: string;
  unitPrice: string;
};

type ClinicInvoice = {
  id: string;
  patientId: string;
  patientName: string | null;
  total: number;
  createdAtUtc: string;
  detailsCount: number;
};

type BillingPageProps = {
  onBack: () => void;
};

export function BillingPage({ onBack }: BillingPageProps) {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [invoices, setInvoices] = useState<ClinicInvoice[]>([]);

  const [patientId, setPatientId] = useState("");
  const [details, setDetails] = useState<InvoiceDetailInput[]>([
    {
      description: "",
      quantity: "1",
      unitPrice: "",
    },
  ]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const total = useMemo(() => {
    return details.reduce((sum, detail) => {
      const quantity = Number(detail.quantity);
      const unitPrice = Number(detail.unitPrice);

      if (quantity <= 0 || unitPrice <= 0) {
        return sum;
      }

      return sum + quantity * unitPrice;
    }, 0);
  }, [details]);

  async function loadData() {
    try {
      setLoading(true);
      setMessage("");

      const patientsData = await apiRequest<Patient[]>("/patients");
      const invoicesData = await apiRequest<ClinicInvoice[]>("/clinic-invoices");

      setPatients(patientsData);
      setInvoices(invoicesData);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Error al cargar datos");
    } finally {
      setLoading(false);
    }
  }

  function updateDetail(index: number, field: keyof InvoiceDetailInput, value: string) {
    setDetails((current) =>
      current.map((detail, i) =>
        i === index
          ? {
              ...detail,
              [field]: value,
            }
          : detail
      )
    );
  }

  function addDetail() {
    setDetails((current) => [
      ...current,
      {
        description: "",
        quantity: "1",
        unitPrice: "",
      },
    ]);
  }

  function removeDetail(index: number) {
    setDetails((current) => {
      if (current.length === 1) {
        return current;
      }

      return current.filter((_, i) => i !== index);
    });
  }

  function clearForm() {
    setPatientId("");
    setDetails([
      {
        description: "",
        quantity: "1",
        unitPrice: "",
      },
    ]);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (!patientId) {
      setMessage("Seleccione un paciente.");
      return;
    }

    const cleanDetails = details.map((detail) => ({
      description: detail.description.trim(),
      quantity: Number(detail.quantity),
      unitPrice: Number(detail.unitPrice),
    }));

    if (cleanDetails.some((detail) => !detail.description)) {
      setMessage("Todos los detalles deben tener descripción.");
      return;
    }

    if (cleanDetails.some((detail) => detail.quantity <= 0)) {
      setMessage("La cantidad debe ser mayor a cero.");
      return;
    }

    if (cleanDetails.some((detail) => detail.unitPrice <= 0)) {
      setMessage("El precio unitario debe ser mayor a cero.");
      return;
    }

    try {
      setSaving(true);
      setMessage("Guardando factura...");

      await apiRequest("/clinic-invoices", {
        method: "POST",
        body: JSON.stringify({
          patientId,
          details: cleanDetails,
        }),
      });

      setMessage("Factura creada correctamente.");
      clearForm();
      await loadData();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Error al guardar factura");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    const confirmed = window.confirm("¿Seguro que deseas eliminar esta factura?");

    if (!confirmed) {
      return;
    }

    try {
      setMessage("Eliminando factura...");

      await apiRequest<void>(`/clinic-invoices/${id}`, {
        method: "DELETE",
      });

      setMessage("Factura eliminada correctamente.");
      await loadData();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Error al eliminar factura");
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  return (
    <main style={styles.page}>
      <section style={styles.header}>
        <div>
          <h1 style={styles.title}>Facturación</h1>
          <p style={styles.subtitle}>Cobros y comprobantes clínicos</p>
        </div>

        <button style={styles.backButton} onClick={onBack}>
          Volver
        </button>
      </section>

      <section style={styles.card}>
        <h2 style={styles.sectionTitle}>Crear factura clínica</h2>

        {loading && <p>Cargando pacientes y facturas...</p>}

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

            <div style={styles.detailsHeader}>
              <h3 style={styles.subTitle}>Detalles</h3>

              <button style={styles.addButton} type="button" onClick={addDetail}>
                Agregar detalle
              </button>
            </div>

            {details.map((detail, index) => {
              const lineTotal =
                Number(detail.quantity) > 0 && Number(detail.unitPrice) > 0
                  ? Number(detail.quantity) * Number(detail.unitPrice)
                  : 0;

              return (
                <div key={index} style={styles.detailRow}>
                  <label style={styles.label}>
                    Descripción
                    <input
                      style={styles.input}
                      value={detail.description}
                      onChange={(e) =>
                        updateDetail(index, "description", e.target.value)
                      }
                      placeholder="Ej: Consulta médica general"
                    />
                  </label>

                  <label style={styles.label}>
                    Cantidad
                    <input
                      style={styles.input}
                      type="number"
                      min="1"
                      value={detail.quantity}
                      onChange={(e) => updateDetail(index, "quantity", e.target.value)}
                    />
                  </label>

                  <label style={styles.label}>
                    Precio unitario
                    <input
                      style={styles.input}
                      type="number"
                      step="0.01"
                      min="0"
                      value={detail.unitPrice}
                      onChange={(e) => updateDetail(index, "unitPrice", e.target.value)}
                      placeholder="Ej: 25"
                    />
                  </label>

                  <div style={styles.lineTotalBox}>
                    <span style={styles.smallText}>Subtotal</span>
                    <strong>${lineTotal.toFixed(2)}</strong>
                  </div>

                  <button
                    style={styles.removeButton}
                    type="button"
                    onClick={() => removeDetail(index)}
                    disabled={details.length === 1}
                  >
                    Quitar
                  </button>
                </div>
              );
            })}

            <div style={styles.totalBox}>
              <span>Total factura</span>
              <strong>${total.toFixed(2)}</strong>
            </div>

            <button style={styles.saveButton} type="submit" disabled={saving}>
              {saving ? "Guardando..." : "Guardar factura"}
            </button>
          </form>
        )}

        {message && <p style={styles.message}>{message}</p>}
      </section>

      <section style={styles.card}>
        <h2 style={styles.sectionTitle}>Listado de facturas</h2>

        {!loading && invoices.length === 0 && <p>No hay facturas registradas.</p>}

        {!loading && invoices.length > 0 && (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Paciente</th>
                <th style={styles.th}>Total</th>
                <th style={styles.th}>Detalles</th>
                <th style={styles.th}>Fecha</th>
                <th style={styles.th}>Acciones</th>
              </tr>
            </thead>

            <tbody>
              {invoices.map((invoice) => (
                <tr key={invoice.id}>
                  <td style={styles.td}>{invoice.patientName ?? invoice.patientId}</td>

                  <td style={styles.td}>${invoice.total.toFixed(2)}</td>

                  <td style={styles.td}>{invoice.detailsCount}</td>

                  <td style={styles.td}>
                    {new Date(invoice.createdAtUtc).toLocaleString()}
                  </td>

                  <td style={styles.td}>
                    <button
                      style={styles.deleteButton}
                      onClick={() => handleDelete(invoice.id)}
                    >
                      Eliminar
                    </button>
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
  subTitle: {
    margin: 0,
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
  detailsHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  detailRow: {
    display: "grid",
    gridTemplateColumns: "2fr 0.8fr 1fr 0.8fr auto",
    gap: "12px",
    alignItems: "end",
  },
  lineTotalBox: {
    display: "grid",
    gap: "6px",
    padding: "10px 12px",
    borderRadius: "10px",
    background: "#f3f4f6",
    color: "#111827",
  },
  smallText: {
    color: "#6b7280",
    fontSize: "12px",
  },
  totalBox: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "16px",
    borderRadius: "12px",
    background: "#ecfdf5",
    color: "#065f46",
    fontSize: "18px",
  },
  addButton: {
    padding: "10px 14px",
    border: "none",
    borderRadius: "10px",
    background: "#111827",
    color: "white",
    fontWeight: "bold",
    cursor: "pointer",
  },
  removeButton: {
    padding: "12px 14px",
    border: "none",
    borderRadius: "10px",
    background: "#ef4444",
    color: "white",
    fontWeight: "bold",
    cursor: "pointer",
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