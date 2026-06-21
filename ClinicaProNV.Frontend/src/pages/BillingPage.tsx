import { useEffect, useMemo, useRef, useState } from "react";
import { apiRequest } from "../api/api";
import { pageStyles } from "../styles/pageStyles";

type Patient = {
  id: string;
  fullName: string;
  identification: string;
  email?: string | null;
  whatsAppNumber?: string | null;
  address?: string | null;
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
  const [showPatientPanel, setShowPatientPanel] = useState(false);
  const [newPatientName, setNewPatientName] = useState("");
  const [newPatientIdentification, setNewPatientIdentification] = useState("");
  const [newPatientAddress, setNewPatientAddress] = useState("");
  const [newPatientEmail, setNewPatientEmail] = useState("");
  const [newPatientWhatsApp, setNewPatientWhatsApp] = useState("");
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
  const invoiceDetailRef = useRef<HTMLElement | null>(null);

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

  function clearPatientPanel() {
    setNewPatientName("");
    setNewPatientIdentification("");
    setNewPatientAddress("");
    setNewPatientEmail("");
    setNewPatientWhatsApp("");
  }

  async function handleCreatePatient(event: React.FormEvent) {
    event.preventDefault();

    if (!newPatientName.trim()) {
      setMessage("Ingrese el nombre del cliente.");
      return;
    }

    if (!newPatientIdentification.trim()) {
      setMessage("Ingrese cédula o RUC.");
      return;
    }

    try {
      setSaving(true);
      setMessage("Creando cliente clínico...");

      const patient = await apiRequest<Patient>("/patients", {
        method: "POST",
        body: JSON.stringify({
          fullName: newPatientName,
          identification: newPatientIdentification,
          email: newPatientEmail,
          whatsAppNumber: newPatientWhatsApp,
          address: newPatientAddress,
          birthDate: "",
          gender: "",
          emergencyContactName: "",
          emergencyContactPhone: "",
          bloodType: "",
        }),
      });

      await loadData();
      setPatientId(patient.id);
      clearPatientPanel();
      setShowPatientPanel(false);
      setMessage("Cliente clínico creado y seleccionado.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Error al crear cliente");
    } finally {
      setSaving(false);
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

  function getServiceInitials(description: string) {
    return description
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("");
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

  async function handlePrintInvoiceById(id: string) {
    try {
      setMessage("Cargando factura para impresión...");
      const invoice = await apiRequest<ClinicInvoiceFull>(`/clinic-invoices/${id}`);
      setSelectedInvoice(invoice);
      printInvoice(invoice);
      setMessage("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Error al imprimir factura");
    }
  }

  function escapeHtml(value: string) {
    return value
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function formatCurrency(value: number) {
    return `$${value.toFixed(2)}`;
  }

  function formatDate(value: string) {
    return new Date(value).toLocaleString();
  }

  function printInvoice(invoice: ClinicInvoiceFull) {
    const printable = window.open("", "_blank", "width=820,height=900");

    if (!printable) {
      setMessage("El navegador bloqueó la ventana de impresión.");
      return;
    }

    const rows = invoice.details
      .map(
        (detail) => `
          <tr>
            <td>${escapeHtml(detail.description)}</td>
            <td class="center">${detail.quantity}</td>
            <td class="money">${escapeHtml(formatCurrency(detail.unitPrice))}</td>
            <td class="money">${escapeHtml(formatCurrency(detail.lineTotal))}</td>
          </tr>`
      )
      .join("");

    const logoUrl = `${window.location.origin}/clininova-logo.png`;

    printable.document.write(`
      <!doctype html>
      <html>
        <head>
          <title>Factura ${escapeHtml(invoice.id)}</title>
          <style>
            * {
              box-sizing: border-box;
            }
            body {
              font-family: Inter, Arial, sans-serif;
              color: #12323f;
              margin: 0;
              background: #eef6f8;
            }
            h1, h2, p {
              margin: 0;
            }
            .sheet {
              width: min(920px, calc(100% - 32px));
              margin: 24px auto;
              background: #ffffff;
              border: 1px solid #d9e8ee;
              border-radius: 14px;
              box-shadow: 0 20px 50px rgba(18, 50, 63, 0.12);
              overflow: hidden;
            }
            .header {
              display: grid;
              grid-template-columns: 1fr auto;
              gap: 24px;
              padding: 28px;
              color: #ffffff;
              background: linear-gradient(135deg, #12323f 0%, #1f5d73 100%);
            }
            .brand {
              display: flex;
              align-items: center;
              gap: 16px;
            }
            .brand img {
              width: 82px;
              height: 82px;
              object-fit: contain;
              border-radius: 12px;
              background: #ffffff;
              padding: 6px;
            }
            .brand h1 {
              font-size: 30px;
              letter-spacing: 0;
            }
            .brand p,
            .invoice-number p {
              color: rgba(255, 255, 255, 0.82);
              margin-top: 4px;
            }
            .invoice-number {
              min-width: 220px;
              padding: 16px;
              border-radius: 10px;
              background: rgba(255, 255, 255, 0.12);
              text-align: right;
            }
            .invoice-number strong {
              display: block;
              margin-top: 6px;
              font-size: 15px;
              word-break: break-all;
            }
            .body {
              padding: 28px;
            }
            .meta {
              display: grid;
              grid-template-columns: repeat(2, minmax(0, 1fr));
              gap: 14px;
              margin-bottom: 24px;
            }
            .meta-card {
              min-height: 86px;
              padding: 16px;
              border: 1px solid #d9e8ee;
              border-radius: 10px;
              background: #f8fbfc;
            }
            .meta-card span {
              display: block;
              color: #5f7680;
              font-size: 12px;
              font-weight: 700;
              text-transform: uppercase;
            }
            .meta-card strong {
              display: block;
              margin-top: 6px;
              color: #12323f;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 12px;
              border: 1px solid #d9e8ee;
              border-radius: 10px;
              overflow: hidden;
            }
            th, td {
              border-bottom: 1px solid #d9e8ee;
              padding: 12px;
              text-align: left;
            }
            th {
              color: #ffffff;
              background: #12323f;
              font-size: 12px;
              text-transform: uppercase;
            }
            .center {
              text-align: center;
            }
            .money {
              text-align: right;
              white-space: nowrap;
            }
            .totals {
              display: flex;
              justify-content: flex-end;
              margin-top: 20px;
            }
            .total {
              min-width: 280px;
              padding: 18px;
              border-radius: 10px;
              background: #e7f7f4;
              color: #0b635d;
              text-align: right;
            }
            .total span {
              display: block;
              font-size: 13px;
              font-weight: 700;
              text-transform: uppercase;
            }
            .total strong {
              display: block;
              margin-top: 4px;
              font-size: 28px;
            }
            .footer {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 18px;
              margin-top: 28px;
              padding-top: 18px;
              border-top: 1px solid #d9e8ee;
              color: #5f7680;
              font-size: 12px;
            }
            @media print {
              body {
                background: #ffffff;
              }
              .sheet {
                width: 100%;
                margin: 0;
                border: 0;
                border-radius: 0;
                box-shadow: none;
              }
            }
          </style>
        </head>
        <body>
          <main class="sheet">
            <header class="header">
              <div class="brand">
                <img src="${escapeHtml(logoUrl)}" alt="CLININOVA" />
                <div>
                  <h1>CLININOVA</h1>
                  <p>Sistema de Gestión Clínica</p>
                </div>
              </div>
              <div class="invoice-number">
                <p>Factura clínica</p>
                <strong>${escapeHtml(invoice.id)}</strong>
              </div>
            </header>

            <section class="body">
              <section class="meta">
                <div class="meta-card">
                  <span>Paciente</span>
                  <strong>${escapeHtml(invoice.patientName ?? invoice.patientId)}</strong>
                </div>
                <div class="meta-card">
                  <span>Fecha de emisión</span>
                  <strong>${escapeHtml(formatDate(invoice.createdAtUtc))}</strong>
                </div>
                <div class="meta-card">
                  <span>Correo</span>
                  <strong>${escapeHtml(invoice.patientEmail || "Sin correo")}</strong>
                </div>
                <div class="meta-card">
                  <span>WhatsApp</span>
                  <strong>${escapeHtml(invoice.patientWhatsApp || "Sin WhatsApp")}</strong>
                </div>
              </section>

              <h2>Detalle de servicios</h2>
              <table>
                <thead>
                  <tr>
                    <th>Descripción</th>
                    <th class="center">Cantidad</th>
                    <th class="money">Precio</th>
                    <th class="money">Subtotal</th>
                  </tr>
                </thead>
                <tbody>${rows}</tbody>
              </table>

              <section class="totals">
                <div class="total">
                  <span>Total a pagar</span>
                  <strong>${escapeHtml(formatCurrency(invoice.total))}</strong>
                </div>
              </section>

              <footer class="footer">
                <p>Documento emitido por CLININOVA. Conserve este comprobante para control administrativo y clínico.</p>
                <p>Gracias por confiar en nuestros servicios.</p>
              </footer>
            </section>
          </main>
          <script>window.onload = () => window.print();</script>
        </body>
      </html>
    `);
    printable.document.close();
  }

  function buildInvoiceMessage(invoice: ClinicInvoiceFull) {
    const detailLines = invoice.details
      .map(
        (detail) =>
          `- ${detail.description}: ${detail.quantity} x $${detail.unitPrice.toFixed(2)} = $${detail.lineTotal.toFixed(2)}`
      )
      .join("\n");

    return `Factura CLININOVA\nPaciente: ${invoice.patientName ?? invoice.patientId}\nFecha: ${new Date(invoice.createdAtUtc).toLocaleString()}\n\n${detailLines}\n\nTotal: $${invoice.total.toFixed(2)}`;
  }

  function handleEmailInvoice(invoice: ClinicInvoiceFull) {
    if (!invoice.patientEmail) {
      setMessage("El paciente no tiene correo registrado.");
      return;
    }

    const subject = encodeURIComponent("Factura CLININOVA");
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

  useEffect(() => {
    if (selectedInvoice) {
      invoiceDetailRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [selectedInvoice]);

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
        <div style={styles.detailsHeader}>
          <div>
            <h2 style={styles.sectionTitle}>Crear factura clínica</h2>
            <p style={styles.inlineHint}>
              Facturación separada de Farmacia: servicios, consultas y procedimientos clínicos.
            </p>
          </div>

          <button
            style={styles.addButton}
            type="button"
            onClick={() => setShowPatientPanel((current) => !current)}
          >
            {showPatientPanel ? "Cerrar cliente" : "Cliente nuevo"}
          </button>
        </div>

        {showPatientPanel && (
          <form onSubmit={handleCreatePatient} style={styles.patientPanel}>
            <label style={styles.label}>
              Nombre
              <input
                style={styles.input}
                value={newPatientName}
                onChange={(e) => setNewPatientName(e.target.value)}
                placeholder="Nombre completo o razón social"
              />
            </label>

            <label style={styles.label}>
              Cédula o RUC
              <input
                style={styles.input}
                value={newPatientIdentification}
                onChange={(e) => setNewPatientIdentification(e.target.value)}
                placeholder="Cédula o RUC"
              />
            </label>

            <label style={styles.label}>
              Dirección
              <input
                style={styles.input}
                value={newPatientAddress}
                onChange={(e) => setNewPatientAddress(e.target.value)}
                placeholder="Dirección del cliente"
              />
            </label>

            <label style={styles.label}>
              Correo
              <input
                style={styles.input}
                value={newPatientEmail}
                onChange={(e) => setNewPatientEmail(e.target.value)}
                type="email"
                placeholder="cliente@correo.com"
              />
            </label>

            <label style={styles.label}>
              WhatsApp
              <input
                style={styles.input}
                value={newPatientWhatsApp}
                onChange={(e) => setNewPatientWhatsApp(e.target.value)}
                placeholder="593..."
              />
            </label>

            <div style={styles.actions}>
              <button style={styles.saveButton} type="submit" disabled={saving}>
                {saving ? "Guardando..." : "Crear y usar"}
              </button>
              <button style={styles.cancelButton} type="button" onClick={clearPatientPanel}>
                Limpiar
              </button>
            </div>
          </form>
        )}

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
                  <span style={styles.serviceVisual}>{getServiceInitials(service.description)}</span>
                  <span style={styles.serviceName}>{service.description}</span>
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
                        style={styles.addButton}
                        onClick={() => handlePrintInvoiceById(invoice.id)}
                      >
                        Imprimir
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
        <section ref={invoiceDetailRef} style={styles.invoiceDetailCard}>
          <div style={styles.detailsHeader}>
            <h2 style={styles.sectionTitle}>Factura clínica</h2>
            <div style={styles.actions}>
              <button style={styles.addButton} type="button" onClick={() => printInvoice(selectedInvoice)}>
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

          <article style={styles.invoiceSheet}>
            <header style={styles.invoiceHeader}>
              <div style={styles.invoiceBrand}>
                <img style={styles.invoiceLogo} src="/clininova-logo.png" alt="CLININOVA" />
                <div>
                  <h3 style={styles.invoiceBrandTitle}>CLININOVA</h3>
                  <p style={styles.invoiceBrandText}>Sistema de Gestión Clínica</p>
                </div>
              </div>

              <div style={styles.invoiceBadge}>
                <span>Factura clínica</span>
                <strong>{selectedInvoice.id}</strong>
              </div>
            </header>

            <div style={styles.invoiceSummary}>
              <div style={styles.invoiceMetaCard}>
                <span style={styles.smallText}>Paciente</span>
                <strong>{selectedInvoice.patientName ?? selectedInvoice.patientId}</strong>
              </div>
              <div style={styles.invoiceMetaCard}>
                <span style={styles.smallText}>Fecha de emisión</span>
                <strong>{formatDate(selectedInvoice.createdAtUtc)}</strong>
              </div>
              <div style={styles.invoiceMetaCard}>
                <span style={styles.smallText}>Correo</span>
                <strong>{selectedInvoice.patientEmail || "Sin correo"}</strong>
              </div>
              <div style={styles.invoiceMetaCard}>
                <span style={styles.smallText}>WhatsApp</span>
                <strong>{selectedInvoice.patientWhatsApp || "Sin WhatsApp"}</strong>
              </div>
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
                {selectedInvoice.details.length === 0 && (
                  <tr>
                    <td style={styles.td} colSpan={4}>
                      Esta factura no tiene detalles registrados.
                    </td>
                  </tr>
                )}

                {selectedInvoice.details.map((detail) => (
                  <tr key={detail.id}>
                    <td style={styles.td}>{detail.description}</td>
                    <td style={styles.td}>{detail.quantity}</td>
                    <td style={styles.td}>{formatCurrency(detail.unitPrice)}</td>
                    <td style={styles.td}>{formatCurrency(detail.lineTotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div style={styles.invoiceTotal}>
              <span>Total a pagar</span>
              <strong>{formatCurrency(selectedInvoice.total)}</strong>
            </div>
          </article>
        </section>
      )}
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  ...pageStyles,
  invoiceDetailCard: {
    maxWidth: "1200px",
    margin: "0 auto 24px auto",
    padding: "24px",
    borderRadius: "18px",
    background: "white",
    boxShadow: "0 12px 35px rgba(0,0,0,0.06)",
    overflowX: "auto",
  },
  form: {
    display: "grid",
    gap: "16px",
  },
  inlineHint: {
    margin: "6px 0 0 0",
    color: "#5f7680",
  },
  patientPanel: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "14px",
    alignItems: "end",
    margin: "18px 0",
    padding: "18px",
    border: "1px solid #d9e8ee",
    borderRadius: "12px",
    background: "linear-gradient(135deg, #ffffff 0%, #f4f9fb 100%)",
    boxShadow: "inset 4px 0 0 #0e9384",
  },
  detailRow: {
    display: "grid",
    gridTemplateColumns: "2fr 0.8fr 1fr 0.8fr auto",
    gap: "12px",
    alignItems: "end",
  },
  removeButton: {
    padding: "12px 14px",
    border: "none",
    borderRadius: "10px",
    background: "#c2413b",
    color: "white",
    fontWeight: "bold",
    cursor: "pointer",
  },
  catalogBox: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
    gap: "12px",
    padding: "12px",
    borderRadius: "10px",
    background: "#f8fafc",
  },
  catalogButton: {
    display: "grid",
    gap: "8px",
    minHeight: "160px",
    padding: "12px",
    border: "1px solid #dbe4ea",
    borderRadius: "8px",
    background: "white",
    color: "#12323f",
    cursor: "pointer",
    textAlign: "left",
  },
  serviceVisual: {
    display: "grid",
    placeItems: "center",
    width: "100%",
    aspectRatio: "1.45 / 1",
    border: "1px dashed #c9dce3",
    borderRadius: "8px",
    background: "#f4f9fb",
    color: "#1f5d73",
    fontSize: "24px",
    fontWeight: "bold",
  },
  serviceName: {
    minHeight: "38px",
    color: "#12323f",
    fontWeight: "bold",
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
  invoiceSummary: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "14px",
    padding: "22px",
    background: "#ffffff",
    color: "#12323f",
  },
  invoiceSheet: {
    marginTop: "18px",
    border: "1px solid #d9e8ee",
    borderRadius: "14px",
    background: "#ffffff",
    overflow: "hidden",
    boxShadow: "0 14px 32px rgba(18, 50, 63, 0.08)",
  },
  invoiceHeader: {
    display: "grid",
    gridTemplateColumns: "1fr auto",
    gap: "18px",
    padding: "24px",
    background: "linear-gradient(135deg, #12323f 0%, #1f5d73 100%)",
    color: "#ffffff",
  },
  invoiceBrand: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
    minWidth: 0,
  },
  invoiceLogo: {
    width: "76px",
    height: "76px",
    objectFit: "contain",
    borderRadius: "12px",
    background: "#ffffff",
    padding: "6px",
  },
  invoiceBrandTitle: {
    margin: 0,
    fontSize: "28px",
    letterSpacing: "0",
  },
  invoiceBrandText: {
    margin: "4px 0 0 0",
    color: "rgba(255,255,255,0.82)",
  },
  invoiceBadge: {
    minWidth: "210px",
    padding: "14px",
    borderRadius: "10px",
    background: "rgba(255,255,255,0.14)",
    textAlign: "right",
    overflowWrap: "anywhere",
  },
  invoiceMetaCard: {
    minHeight: "82px",
    padding: "14px",
    border: "1px solid #d9e8ee",
    borderRadius: "10px",
    background: "#f8fbfc",
  },
  invoiceTotal: {
    width: "min(320px, 100%)",
    margin: "20px 22px 24px auto",
    padding: "18px",
    borderRadius: "10px",
    background: "#e7f7f4",
    color: "#0b635d",
    textAlign: "right",
  },
  whatsAppButton: {
    padding: "10px 14px",
    border: "none",
    borderRadius: "10px",
    background: "#0e9384",
    color: "white",
    fontWeight: "bold",
    cursor: "pointer",
  },
};
