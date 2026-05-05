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
  patientEmail?: string | null;
  patientWhatsApp?: string | null;
  total: number;
  createdAtUtc: string;
  detailsCount: number;
};

type ClinicInvoiceDetail = {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
};

type ClinicInvoiceFull = ClinicInvoice & {
  details: ClinicInvoiceDetail[];
};

type DeletedClinicInvoice = {
  invoiceId: string;
  patientId: string;
  patientName: string;
  total: number;
  deletedByUserId: string;
  deletedByEmail: string;
  reason: string;
  deletedAtUtc: string;
};

type BillingPageProps = {
  onBack: () => void;
};

const serviceCatalog = [
  { description: "Consulta médica general", unitPrice: 30 },
  { description: "Consulta médica especialista", unitPrice: 45 },
  { description: "Control postoperatorio", unitPrice: 25 },
  { description: "Curación menor", unitPrice: 18 },
  { description: "Sutura simple", unitPrice: 35 },
  { description: "Retiro de puntos", unitPrice: 15 },
  { description: "Nebulización", unitPrice: 12 },
  { description: "Inyección / medicación intramuscular", unitPrice: 8 },
  { description: "Hidratación intravenosa básica", unitPrice: 35 },
  { description: "Electrocardiograma", unitPrice: 25 },
  { description: "Ecografía general", unitPrice: 30 },
  { description: "Radiografía simple", unitPrice: 25 },
  { description: "Laboratorio básico", unitPrice: 20 },
  { description: "Paquete chequeo general", unitPrice: 40 },
  { description: "Uso sala observación 6 horas", unitPrice: 60 },
  { description: "Hospitalización día clínica", unitPrice: 220 },
  { description: "Derecho de quirófano menor", unitPrice: 180 },
  { description: "Derecho de quirófano general básico", unitPrice: 350 },
  { description: "Cirugía menor ambulatoria", unitPrice: 280 },
  { description: "Apendicectomía paquete base", unitPrice: 950 },
  { description: "Colecistectomía paquete base", unitPrice: 1200 },
  { description: "Cesárea paquete base", unitPrice: 1100 },
  { description: "Parto normal paquete base", unitPrice: 750 },
  { description: "Limpieza quirúrgica / drenaje absceso", unitPrice: 180 },
];

export function BillingPage({ onBack }: BillingPageProps) {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [invoices, setInvoices] = useState<ClinicInvoice[]>([]);
  const [deletedInvoices, setDeletedInvoices] = useState<DeletedClinicInvoice[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<ClinicInvoiceFull | null>(null);
  const [search, setSearch] = useState("");

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
      const deletedInvoicesData = await apiRequest<DeletedClinicInvoice[]>("/clinic-invoices/deleted");

      setPatients(patientsData);
      setInvoices(invoicesData);
      setDeletedInvoices(deletedInvoicesData);
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
    const reason = window.prompt(
      "Motivo de anulación. Ejemplos: cliente pidió sin datos, error en paciente, factura no válida."
    );

    if (reason === null) {
      return;
    }

    const confirmed = window.confirm("¿Seguro que deseas anular esta factura?");

    if (!confirmed) {
      return;
    }

    try {
      setMessage("Eliminando factura...");

      await apiRequest<void>(`/clinic-invoices/${id}`, {
        method: "DELETE",
        body: JSON.stringify({ reason }),
      });

      setMessage("Factura anulada correctamente.");
      await loadData();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Error al eliminar factura");
    }
  }

  function addCatalogService(description: string, unitPrice: number) {
    setDetails((current) => [
      ...current,
      {
        description,
        quantity: "1",
        unitPrice: String(unitPrice),
      },
    ]);
  }

  async function handleViewInvoice(id: string) {
    try {
      setMessage("Cargando detalle de factura...");
      const invoice = await apiRequest<ClinicInvoiceFull>(`/clinic-invoices/${id}`);
      setSelectedInvoice(invoice);
      setMessage("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Error al cargar factura");
    }
  }

  function handlePrintInvoice() {
    window.print();
  }

  function buildInvoiceMessage(invoice: ClinicInvoiceFull) {
    const detailLines = invoice.details
      .map(
        (detail) =>
          `- ${detail.description}: ${detail.quantity} x $${detail.unitPrice.toFixed(2)} = $${detail.lineTotal.toFixed(2)}`
      )
      .join("\n");

    return `Factura ClinicaProNV\nPaciente: ${invoice.patientName ?? invoice.patientId}\nFecha: ${new Date(invoice.createdAtUtc).toLocaleString()}\n\n${detailLines}\n\nTotal: $${invoice.total.toFixed(2)}`;
  }

  function handleEmailInvoice(invoice: ClinicInvoiceFull) {
    if (!invoice.patientEmail) {
      setMessage("El paciente no tiene correo registrado.");
      return;
    }

    const subject = encodeURIComponent("Factura ClinicaProNV");
    const body = encodeURIComponent(buildInvoiceMessage(invoice));
    window.location.href = `mailto:${invoice.patientEmail}?subject=${subject}&body=${body}`;
  }

  function handleWhatsAppInvoice(invoice: ClinicInvoiceFull) {
    if (!invoice.patientWhatsApp) {
      setMessage("El paciente no tiene WhatsApp registrado.");
      return;
    }

    const phone = invoice.patientWhatsApp.replace(/\D/g, "");
    const text = encodeURIComponent(buildInvoiceMessage(invoice));
    window.open(`https://wa.me/${phone}?text=${text}`, "_blank", "noopener,noreferrer");
  }

  useEffect(() => {
    loadData();
  }, []);

  const filteredInvoices = invoices.filter((invoice) => {
    const text = search.toLowerCase().trim();

    return (
      !text ||
      (invoice.patientName ?? invoice.patientId).toLowerCase().includes(text) ||
      invoice.id.toLowerCase().includes(text)
    );
  });

  return (
    <main style={styles.page}>
      <section style={styles.header}>
        <div>
          <h1 style={styles.title}>Facturación clínica</h1>
          <p style={styles.subtitle}>Cobros, operaciones y comprobantes de la clínica</p>
        </div>

        <button style={styles.backButton} onClick={onBack}>
          Volver
        </button>
      </section>

      <section style={styles.card}>
        <h2 style={styles.sectionTitle}>Crear factura clínica</h2>

        {loading && <p>Cargando pacientes y facturas clínicas...</p>}

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

            <div style={styles.catalogBox}>
              {serviceCatalog.map((service) => (
                <button
                  key={service.description}
                  style={styles.catalogButton}
                  type="button"
                  onClick={() => addCatalogService(service.description, service.unitPrice)}
                >
                  <span>{service.description}</span>
                  <strong>${service.unitPrice.toFixed(2)}</strong>
                </button>
              ))}
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
        <h2 style={styles.sectionTitle}>Listado de facturas clínicas</h2>

        <input
          style={styles.searchInput}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por paciente o ID..."
        />

        {!loading && filteredInvoices.length === 0 && <p>No hay facturas clínicas registradas.</p>}

        {!loading && filteredInvoices.length > 0 && (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Paciente</th>
                <th style={styles.th}>Total clínico</th>
                <th style={styles.th}>Detalles</th>
                <th style={styles.th}>Fecha</th>
                <th style={styles.th}>Acciones</th>
              </tr>
            </thead>

            <tbody>
              {filteredInvoices.map((invoice) => (
                <tr key={invoice.id}>
                  <td style={styles.td}>{invoice.patientName ?? invoice.patientId}</td>

                  <td style={styles.td}>${invoice.total.toFixed(2)}</td>

                  <td style={styles.td}>{invoice.detailsCount}</td>

                  <td style={styles.td}>
                    {new Date(invoice.createdAtUtc).toLocaleString()}
                  </td>

                  <td style={styles.td}>
                    <div style={styles.actions}>
                      <button
                        style={styles.viewButton}
                        onClick={() => handleViewInvoice(invoice.id)}
                      >
                        Ver detalle
                      </button>

                      <button
                        style={styles.deleteButton}
                        onClick={() => handleDelete(invoice.id)}
                      >
                      Anular
                    </button>
                  </div>
                </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section style={styles.card}>
        <h2 style={styles.sectionTitle}>Facturas clínicas anuladas</h2>

        {deletedInvoices.length === 0 && <p>No hay facturas anuladas.</p>}

        {deletedInvoices.length > 0 && (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Paciente</th>
                <th style={styles.th}>Total</th>
                <th style={styles.th}>Anulada por</th>
                <th style={styles.th}>Fecha</th>
                <th style={styles.th}>Motivo</th>
              </tr>
            </thead>
            <tbody>
              {deletedInvoices.map((invoice) => (
                <tr key={invoice.invoiceId}>
                  <td style={styles.td}>{invoice.patientName ?? invoice.patientId}</td>
                  <td style={styles.td}>${invoice.total.toFixed(2)}</td>
                  <td style={styles.td}>{invoice.deletedByEmail}</td>
                  <td style={styles.td}>{new Date(invoice.deletedAtUtc).toLocaleString()}</td>
                  <td style={styles.td}>{invoice.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {selectedInvoice && (
        <section style={styles.invoiceDetailCard}>
          <div style={styles.detailsHeader}>
            <h2 style={styles.sectionTitle}>Detalle de factura clínica</h2>
            <div style={styles.actions}>
              <button style={styles.addButton} type="button" onClick={handlePrintInvoice}>
                Imprimir
              </button>
              <button
                style={styles.viewButton}
                type="button"
                onClick={() => handleEmailInvoice(selectedInvoice)}
              >
                Enviar correo
              </button>
              <button
                style={styles.whatsAppButton}
                type="button"
                onClick={() => handleWhatsAppInvoice(selectedInvoice)}
              >
                Enviar WhatsApp
              </button>
              <button
                style={styles.removeButton}
                type="button"
                onClick={() => setSelectedInvoice(null)}
              >
                Cerrar
              </button>
            </div>
          </div>

          <div style={styles.invoiceSummary}>
            <span>Paciente: {selectedInvoice.patientName ?? selectedInvoice.patientId}</span>
            <span>Correo: {selectedInvoice.patientEmail || "Sin correo"}</span>
            <span>WhatsApp: {selectedInvoice.patientWhatsApp || "Sin WhatsApp"}</span>
            <span>Fecha: {new Date(selectedInvoice.createdAtUtc).toLocaleString()}</span>
            <strong>Total: ${selectedInvoice.total.toFixed(2)}</strong>
          </div>

          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Descripción</th>
                <th style={styles.th}>Cantidad</th>
                <th style={styles.th}>Precio</th>
                <th style={styles.th}>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {selectedInvoice.details.map((detail) => (
                <tr key={detail.id}>
                  <td style={styles.td}>{detail.description}</td>
                  <td style={styles.td}>{detail.quantity}</td>
                  <td style={styles.td}>${detail.unitPrice.toFixed(2)}</td>
                  <td style={styles.td}>${detail.lineTotal.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
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
  invoiceDetailCard: {
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
    background: "white",
    color: "#111827",
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
    background: "#334155",
    color: "white",
    fontWeight: "bold",
    cursor: "pointer",
  },
  removeButton: {
    padding: "12px 14px",
    border: "none",
    borderRadius: "10px",
    background: "#b91c1c",
    color: "white",
    fontWeight: "bold",
    cursor: "pointer",
  },
  saveButton: {
    padding: "13px 18px",
    border: "none",
    borderRadius: "10px",
    background: "#0f766e",
    color: "white",
    fontWeight: "bold",
    cursor: "pointer",
  },
  message: {
    marginTop: "16px",
    color: "#0f766e",
    fontWeight: "bold",
    textAlign: "center",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
  },
  catalogBox: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "8px",
    padding: "12px",
    borderRadius: "10px",
    background: "#f8fafc",
  },
  catalogButton: {
    display: "flex",
    justifyContent: "space-between",
    gap: "8px",
    padding: "10px",
    border: "1px solid #dbe4ea",
    borderRadius: "8px",
    background: "white",
    color: "#111827",
    cursor: "pointer",
    textAlign: "left",
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
    background: "#b91c1c",
    color: "white",
    fontWeight: "bold",
    cursor: "pointer",
  },
  viewButton: {
    padding: "8px 12px",
    border: "none",
    borderRadius: "8px",
    background: "#0f766e",
    color: "white",
    fontWeight: "bold",
    cursor: "pointer",
  },
  actions: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
  },
  invoiceSummary: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr",
    gap: "12px",
    padding: "14px",
    marginBottom: "14px",
    borderRadius: "10px",
    background: "#f8fafc",
    color: "#111827",
  },
  whatsAppButton: {
    padding: "10px 14px",
    border: "none",
    borderRadius: "10px",
    background: "#0f766e",
    color: "white",
    fontWeight: "bold",
    cursor: "pointer",
  },
};
