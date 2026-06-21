import { useEffect, useMemo, useState } from "react";
import { apiRequest } from "../api/api";
import { pageStyles } from "../styles/pageStyles";

type Medicine = {
  id: string;
  name: string;
  unitPrice: number;
  stock: number;
  requiresPrescription: boolean;
  createdAtUtc: string;
};

type Patient = {
  id: string;
  fullName: string;
  identification: string;
  whatsAppNumber?: string;
};

type SaleItemInput = {
  medicineId: string;
  quantity: string;
  hasPrescription: boolean;
};

type PharmacyInvoice = {
  id: string;
  patientId: string | null;
  patientName: string | null;
  customerName: string;
  customerIdentification: string;
  customerPhone: string;
  total: number;
  createdAtUtc: string;
  detailsCount: number;
};

type PharmacyInvoiceDetail = {
  id: string;
  medicineId: string;
  medicineName: string | null;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
};

type PharmacyInvoiceFull = PharmacyInvoice & {
  details: PharmacyInvoiceDetail[];
};

type DeletedPharmacyInvoice = {
  invoiceId: string;
  patientId: string;
  patientName: string;
  total: number;
  deletedByUserId: string;
  deletedByEmail: string;
  reason: string;
  deletedAtUtc: string;
};

type PharmacyPageProps = {
  onBack: () => void;
};

type PharmacyView = "sale" | "selectCustomer" | "customer" | "invoices" | "medicines" | "voided";

export function PharmacyPage({ onBack }: PharmacyPageProps) {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [invoices, setInvoices] = useState<PharmacyInvoice[]>([]);
  const [deletedInvoices, setDeletedInvoices] = useState<DeletedPharmacyInvoice[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<PharmacyInvoiceFull | null>(null);
  const [view, setView] = useState<PharmacyView>("sale");
  const [name, setName] = useState("");
  const [unitPrice, setUnitPrice] = useState("");
  const [stock, setStock] = useState("");
  const [requiresPrescription, setRequiresPrescription] = useState(false);
  const [editingMedicineId, setEditingMedicineId] = useState<string | null>(null);
  const [saleCustomerType, setSaleCustomerType] = useState<"registered" | "external">("external");
  const [patientIdentification, setPatientIdentification] = useState("");
  const [salePatientId, setSalePatientId] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerIdentification, setCustomerIdentification] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [saleItems, setSaleItems] = useState<SaleItemInput[]>([
    { medicineId: "", quantity: "1", hasPrescription: false },
  ]);

  const [search, setSearch] = useState("");
  const [customerSearch, setCustomerSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function loadData() {
    try {
      setLoading(true);
      setMessage("");

      const medicinesData = await apiRequest<Medicine[]>("/medicines");
      const patientsData = await apiRequest<Patient[]>("/patients");
      const invoicesData = await apiRequest<PharmacyInvoice[]>("/pharmacy/invoices");
      const deletedInvoicesData = await apiRequest<DeletedPharmacyInvoice[]>("/pharmacy/invoices/deleted");
      setMedicines(medicinesData);
      setPatients(patientsData);
      setInvoices(invoicesData);
      setDeletedInvoices(deletedInvoicesData);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Error al cargar farmacia");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (!name.trim()) {
      setMessage("Ingrese el nombre del medicamento.");
      return;
    }

    const priceValue = Number(unitPrice);
    const stockValue = Number(stock);

    if (priceValue <= 0) {
      setMessage("El precio unitario debe ser mayor a cero.");
      return;
    }

    if (stockValue < 0) {
      setMessage("El stock no puede ser negativo.");
      return;
    }

    try {
      setSaving(true);
      setMessage(editingMedicineId ? "Actualizando medicamento..." : "Guardando medicamento...");

      const body = JSON.stringify({
        name,
        unitPrice: priceValue,
        stock: stockValue,
        requiresPrescription,
      });

      if (editingMedicineId) {
        await apiRequest<Medicine>(`/medicines/${editingMedicineId}`, {
          method: "PUT",
          body,
        });

        setMessage("Medicamento actualizado correctamente.");
      } else {
        await apiRequest<Medicine>("/medicines", {
          method: "POST",
          body,
        });

        setMessage("Medicamento guardado correctamente.");
      }

      clearForm();
      await loadData();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Error al guardar medicamento");
    } finally {
      setSaving(false);
    }
  }

  function handleEdit(medicine: Medicine) {
    setEditingMedicineId(medicine.id);
    setName(medicine.name);
    setUnitPrice(String(medicine.unitPrice));
    setStock(String(medicine.stock));
    setRequiresPrescription(medicine.requiresPrescription);
    setMessage(`Editando medicamento: ${medicine.name}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleDelete(id: string, medicineName: string) {
    const confirmed = window.confirm(`¿Seguro que deseas eliminar ${medicineName}?`);

    if (!confirmed) {
      return;
    }

    try {
      setMessage("Eliminando medicamento...");

      await apiRequest<void>(`/medicines/${id}`, {
        method: "DELETE",
      });

      setMessage("Medicamento eliminado correctamente.");
      await loadData();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Error al eliminar medicamento");
    }
  }

  function clearForm() {
    setEditingMedicineId(null);
    setName("");
    setUnitPrice("");
    setStock("");
    setRequiresPrescription(false);
  }

  function updateSaleItem(index: number, field: keyof SaleItemInput, value: string | boolean) {
    setSaleItems((current) =>
      current.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  }

  function addSaleItem() {
    setSaleItems((current) => [
      ...current,
      { medicineId: "", quantity: "1", hasPrescription: false },
    ]);
  }

  function addMedicineToSale(medicine: Medicine) {
    if (medicine.stock <= 0) {
      setMessage("Este medicamento no tiene stock disponible.");
      return;
    }

    setSaleItems((current) => {
      const existingIndex = current.findIndex((item) => item.medicineId === medicine.id);

      if (existingIndex >= 0) {
        return current.map((item, index) =>
          index === existingIndex
            ? { ...item, quantity: String(Number(item.quantity || "0") + 1) }
            : item
        );
      }

      const emptyIndex = current.findIndex((item) => !item.medicineId);
      if (emptyIndex >= 0) {
        return current.map((item, index) =>
          index === emptyIndex
            ? { medicineId: medicine.id, quantity: "1", hasPrescription: false }
            : item
        );
      }

      return [...current, { medicineId: medicine.id, quantity: "1", hasPrescription: false }];
    });
  }

  function removeSaleItem(index: number) {
    setSaleItems((current) =>
      current.length === 1 ? current : current.filter((_, i) => i !== index)
    );
  }

  function clearSale() {
    setSaleCustomerType("external");
    setPatientIdentification("");
    setSalePatientId("");
    setCustomerName("");
    setCustomerIdentification("");
    setCustomerAddress("");
    setCustomerEmail("");
    setCustomerPhone("");
    setSaleItems([{ medicineId: "", quantity: "1", hasPrescription: false }]);
  }

  function handleNewCustomerSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (!customerName.trim()) {
      setMessage("Ingrese el nombre del cliente.");
      return;
    }

    if (!customerIdentification.trim()) {
      setMessage("Ingrese la cédula o RUC del cliente.");
      return;
    }

    setSaleCustomerType("external");
    setView("sale");
    setMessage("Cliente listo para registrar la venta.");
  }

  function handleSelectPatientCustomer(patient: Patient) {
    setSaleCustomerType("registered");
    setPatientIdentification(patient.identification);
    setSalePatientId(patient.id);
    setCustomerName("");
    setCustomerIdentification("");
    setCustomerAddress("");
    setCustomerEmail("");
    setCustomerPhone("");
    setView("sale");
    setMessage(`Cliente seleccionado: ${patient.fullName}`);
  }

  async function handleSaleSubmit(event: React.FormEvent) {
    event.preventDefault();

    const selectedPatient = patients.find((patient) => patient.id === salePatientId);

    if (saleCustomerType === "registered") {
      if (!patientIdentification.trim()) {
        setMessage("Ingrese la cédula del paciente.");
        return;
      }

      if (!selectedPatient) {
        setMessage("No existe un paciente con esa cédula.");
        return;
      }
    }

    if (saleCustomerType === "external" && !customerName.trim()) {
      setMessage("Ingrese el nombre del cliente.");
      return;
    }

    const cleanItems = saleItems.map((item) => ({
      medicineId: item.medicineId,
      quantity: Number(item.quantity),
    }));

    if (cleanItems.some((item) => !item.medicineId)) {
      setMessage("Todos los renglones deben tener medicamento.");
      return;
    }

    if (cleanItems.some((item) => item.quantity <= 0)) {
      setMessage("La cantidad debe ser mayor a cero.");
      return;
    }

    const missingPrescription = saleItems.some((item) => {
      const medicine = medicines.find((med) => med.id === item.medicineId);
      return medicine?.requiresPrescription && !item.hasPrescription;
    });

    if (missingPrescription) {
      setMessage("Hay medicamentos que requieren receta. Marque 'Receta vista' para continuar.");
      return;
    }

    try {
      setSaving(true);
      setMessage("Registrando venta...");

      await apiRequest<void>("/pharmacy/invoices", {
        method: "POST",
        body: JSON.stringify({
          patientId: saleCustomerType === "registered" ? salePatientId : null,
          customerName:
            saleCustomerType === "registered"
              ? selectedPatient?.fullName ?? ""
              : customerName,
          customerIdentification:
            saleCustomerType === "registered"
              ? selectedPatient?.identification ?? ""
              : customerIdentification,
          customerPhone:
            saleCustomerType === "registered"
              ? selectedPatient?.whatsAppNumber ?? ""
              : customerPhone,
          customerAddress: saleCustomerType === "registered" ? "" : customerAddress,
          customerEmail: saleCustomerType === "registered" ? "" : customerEmail,
          items: cleanItems,
        }),
      });

      setMessage("Venta registrada correctamente.");
      clearSale();
      await loadData();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Error al registrar venta");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteInvoice(id: string) {
    const reason = window.prompt(
      "Motivo de anulación. Ejemplos: cliente pidió sin datos, error en medicamento, factura no válida."
    );

    if (reason === null) {
      return;
    }

    const confirmed = window.confirm("¿Seguro que deseas anular esta venta?");

    if (!confirmed) {
      return;
    }

    try {
      setMessage("Eliminando venta...");

      await apiRequest<void>(`/pharmacy/invoices/${id}`, {
        method: "DELETE",
        body: JSON.stringify({ reason }),
      });

      setMessage("Venta anulada correctamente.");
      await loadData();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Error al eliminar venta");
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

  async function handleViewInvoice(id: string) {
    try {
      setMessage("Cargando factura de farmacia...");
      const invoice = await apiRequest<PharmacyInvoiceFull>(`/pharmacy/invoices/${id}`);
      setSelectedInvoice(invoice);
      setMessage("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Error al cargar factura");
    }
  }

  async function handlePrintInvoiceById(id: string) {
    try {
      setMessage("Cargando factura para impresión...");
      const invoice = await apiRequest<PharmacyInvoiceFull>(`/pharmacy/invoices/${id}`);
      setSelectedInvoice(invoice);
      printPharmacyInvoice(invoice);
      setMessage("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Error al imprimir factura");
    }
  }

  function printPharmacyInvoice(invoice: PharmacyInvoiceFull) {
    const printable = window.open("", "_blank", "width=820,height=900");

    if (!printable) {
      setMessage("El navegador bloqueó la ventana de impresión.");
      return;
    }

    const logoUrl = `${window.location.origin}/clininova-logo.png`;
    const customer = invoice.patientName ?? invoice.customerName;
    const rows = invoice.details
      .map(
        (detail, index) => `
          <tr>
            <td class="index">${index + 1}</td>
            <td>
              <strong>${escapeHtml(detail.medicineName ?? detail.medicineId)}</strong>
              <span>Producto de farmacia</span>
            </td>
            <td class="center">${detail.quantity}</td>
            <td class="money">${escapeHtml(formatCurrency(detail.unitPrice))}</td>
            <td class="money">${escapeHtml(formatCurrency(detail.lineTotal))}</td>
          </tr>`
      )
      .join("");

    printable.document.write(`
      <!doctype html>
      <html>
        <head>
          <title>Factura Farmacia ${escapeHtml(invoice.id)}</title>
          <style>
            * { box-sizing: border-box; }
            body {
              margin: 0;
              background: #f4f9fb;
              color: #12323f;
              font-family: Inter, Arial, sans-serif;
            }
            .sheet {
              width: min(920px, calc(100% - 32px));
              margin: 24px auto;
              background: #fff;
              border: 1px solid #d9e8ee;
              border-radius: 14px;
              box-shadow: 0 20px 50px rgba(18, 50, 63, 0.12);
              overflow: hidden;
            }
            .top {
              display: grid;
              grid-template-columns: 1fr auto;
              gap: 18px;
              align-items: center;
              padding: 18px 22px;
              background: #12323f;
              color: #fff;
            }
            .brand {
              display: flex;
              align-items: center;
              gap: 14px;
            }
            .brand img {
              width: 68px;
              height: 68px;
              object-fit: contain;
              border-radius: 10px;
              padding: 5px;
              background: #fff;
            }
            h1, h2, p { margin: 0; }
            h1 { font-size: 26px; letter-spacing: 0; }
            .brand p, .badge span { color: rgba(255,255,255,0.78); }
            .badge {
              min-width: 230px;
              padding: 12px;
              border: 1px solid rgba(255,255,255,0.18);
              border-radius: 10px;
              background: rgba(255,255,255,0.08);
              text-align: right;
              overflow-wrap: anywhere;
            }
            .badge strong { display: block; margin-top: 5px; font-size: 13px; }
            .body { padding: 22px; }
            .summary {
              display: grid;
              grid-template-columns: repeat(4, minmax(0, 1fr));
              gap: 12px;
              margin-bottom: 20px;
            }
            .box {
              min-height: 76px;
              padding: 13px;
              border: 1px solid #d9e8ee;
              border-radius: 10px;
              background: #f8fbfc;
            }
            .box span {
              display: block;
              color: #5f7680;
              font-size: 11px;
              font-weight: 800;
              text-transform: uppercase;
            }
            .box strong {
              display: block;
              margin-top: 6px;
              overflow-wrap: anywhere;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              border: 1px solid #d9e8ee;
              border-radius: 10px;
              overflow: hidden;
            }
            th {
              padding: 11px;
              background: #f4f9fb;
              color: #284653;
              border-bottom: 1px solid #d9e8ee;
              font-size: 12px;
              text-transform: uppercase;
              text-align: left;
            }
            td {
              padding: 12px 11px;
              border-bottom: 1px solid #edf4f6;
              vertical-align: top;
            }
            td span { display: block; margin-top: 3px; color: #5f7680; font-size: 12px; }
            .index { width: 42px; color: #5f7680; font-weight: 800; }
            .center { text-align: center; }
            .money { text-align: right; white-space: nowrap; }
            .totals {
              display: grid;
              grid-template-columns: 1fr 300px;
              gap: 18px;
              align-items: end;
              margin-top: 20px;
            }
            .note {
              padding: 14px;
              border-left: 4px solid #0e9384;
              background: #f4f9fb;
              color: #5f7680;
              border-radius: 8px;
              font-size: 13px;
            }
            .total {
              padding: 18px;
              border-radius: 10px;
              background: #e7f7f4;
              color: #0b635d;
              text-align: right;
            }
            .total span { font-size: 12px; font-weight: 800; text-transform: uppercase; }
            .total strong { display: block; margin-top: 4px; font-size: 28px; }
            .footer {
              margin-top: 20px;
              padding-top: 16px;
              border-top: 1px solid #d9e8ee;
              color: #5f7680;
              font-size: 12px;
              text-align: center;
            }
            @media print {
              body { background: #fff; }
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
            <header class="top">
              <div class="brand">
                <img src="${escapeHtml(logoUrl)}" alt="CLININOVA" />
                <div>
                  <h1>CLININOVA</h1>
                  <p>Farmacia y Punto de Venta</p>
                </div>
              </div>
              <div class="badge">
                <span>Factura de farmacia</span>
                <strong>${escapeHtml(invoice.id)}</strong>
              </div>
            </header>

            <section class="body">
              <section class="summary">
                <div class="box"><span>Cliente</span><strong>${escapeHtml(customer || "Cliente externo")}</strong></div>
                <div class="box"><span>Cédula / RUC</span><strong>${escapeHtml(invoice.customerIdentification || "Sin documento")}</strong></div>
                <div class="box"><span>WhatsApp</span><strong>${escapeHtml(invoice.customerPhone || "Sin teléfono")}</strong></div>
                <div class="box"><span>Fecha</span><strong>${escapeHtml(formatDate(invoice.createdAtUtc))}</strong></div>
              </section>

              <h2>Productos vendidos</h2>
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Producto</th>
                    <th class="center">Cant.</th>
                    <th class="money">Precio</th>
                    <th class="money">Subtotal</th>
                  </tr>
                </thead>
                <tbody>${rows}</tbody>
              </table>

              <section class="totals">
                <p class="note">Comprobante generado desde el módulo de farmacia. Verifique producto, cantidad y total antes de entregar.</p>
                <div class="total">
                  <span>Total venta</span>
                  <strong>${escapeHtml(formatCurrency(invoice.total))}</strong>
                </div>
              </section>

              <p class="footer">Gracias por su compra. CLININOVA - Gestión que cuida.</p>
            </section>
          </main>
          <script>window.onload = () => window.print();</script>
        </body>
      </html>
    `);
    printable.document.close();
  }

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (saleCustomerType !== "registered") {
      setSalePatientId("");
      return;
    }

    const identification = patientIdentification.trim();
    const patient = patients.find((item) => item.identification === identification);
    setSalePatientId(patient?.id ?? "");
  }, [patientIdentification, patients, saleCustomerType]);

  const selectedSalePatient = patients.find((patient) => patient.id === salePatientId);

  const saleTotal = useMemo(() => {
    return saleItems.reduce((sum, item) => {
      const medicine = medicines.find((med) => med.id === item.medicineId);
      const quantity = Number(item.quantity);
      return medicine && quantity > 0 ? sum + medicine.unitPrice * quantity : sum;
    }, 0);
  }, [medicines, saleItems]);

  const filteredMedicines = medicines.filter((medicine) => {
    const text = search.toLowerCase().trim();

    return medicine.name.toLowerCase().includes(text);
  });

  const filteredCustomerPatients = patients.filter((patient) => {
    const text = customerSearch.toLowerCase().trim();

    return (
      !text ||
      patient.fullName.toLowerCase().includes(text) ||
      patient.identification.toLowerCase().includes(text) ||
      (patient.whatsAppNumber ?? "").toLowerCase().includes(text)
    );
  });

  const quickSaleMedicines = medicines
    .filter((medicine) => medicine.stock > 0)
    .slice(0, 18);

  function getMedicineInitials(medicineName: string) {
    const words = medicineName.trim().split(/\s+/).filter(Boolean);
    return words
      .slice(0, 2)
      .map((word) => word[0]?.toUpperCase())
      .join("");
  }

  return (
    <main style={styles.page}>
      <section style={styles.header}>
        <div>
          <h1 style={styles.title}>Farmacia</h1>
          <p style={styles.subtitle}>Gestión de medicamentos, stock y ventas de farmacia</p>
        </div>

        <button style={styles.backButton} onClick={onBack}>
          Volver
        </button>
      </section>

      <section style={styles.tabsCard}>
        <button
          style={{ ...styles.tabButton, ...(view === "sale" ? styles.activeTabButton : {}) }}
          type="button"
          onClick={() => setView("sale")}
        >
          Venta
        </button>
        <button
          style={{
            ...styles.tabButton,
            ...(view === "selectCustomer" ? styles.activeTabButton : {}),
          }}
          type="button"
          onClick={() => setView("selectCustomer")}
        >
          Seleccionar cliente
        </button>
        <button
          style={{
            ...styles.tabButton,
            ...(view === "customer" ? styles.activeTabButton : {}),
          }}
          type="button"
          onClick={() => setView("customer")}
        >
          Cliente nuevo
        </button>
        <button
          style={{
            ...styles.tabButton,
            ...(view === "invoices" ? styles.activeTabButton : {}),
          }}
          type="button"
          onClick={() => setView("invoices")}
        >
          Facturas
        </button>
        <button
          style={{
            ...styles.tabButton,
            ...(view === "medicines" ? styles.activeTabButton : {}),
          }}
          type="button"
          onClick={() => setView("medicines")}
        >
          Medicamentos
        </button>
        <button
          style={{
            ...styles.tabButton,
            ...(view === "voided" ? styles.activeTabButton : {}),
          }}
          type="button"
          onClick={() => setView("voided")}
        >
          Anuladas
        </button>
      </section>

      {view === "selectCustomer" && (
      <section style={styles.card}>
        <h2 style={styles.sectionTitle}>Seleccionar cliente</h2>
        <p style={styles.inlineHint}>
          Busca un paciente registrado y úsalo como cliente para la venta de farmacia.
        </p>

        <input
          style={styles.searchInput}
          value={customerSearch}
          onChange={(e) => setCustomerSearch(e.target.value)}
          placeholder="Buscar por nombre, cédula o WhatsApp..."
        />

        {loading && <p>Cargando clientes...</p>}

        {!loading && filteredCustomerPatients.length === 0 && (
          <p>No hay clientes registrados que coincidan con la búsqueda.</p>
        )}

        {!loading && filteredCustomerPatients.length > 0 && (
          <div style={styles.customerCardGrid}>
            {filteredCustomerPatients.map((patient) => (
              <article key={patient.id} style={styles.customerCard}>
                <div style={styles.customerAvatar}>
                  {patient.fullName
                    .split(/\s+/)
                    .slice(0, 2)
                    .map((part) => part[0]?.toUpperCase())
                    .join("")}
                </div>
                <div style={styles.customerCardBody}>
                  <strong>{patient.fullName}</strong>
                  <span>{patient.identification}</span>
                  <small>{patient.whatsAppNumber || "Sin WhatsApp"}</small>
                </div>
                <button
                  style={styles.saveButton}
                  type="button"
                  onClick={() => handleSelectPatientCustomer(patient)}
                >
                  Usar en venta
                </button>
              </article>
            ))}
          </div>
        )}

        {message && <p style={styles.message}>{message}</p>}
      </section>
      )}

      {view === "sale" && (
      <section style={styles.card}>
        <h2 style={styles.sectionTitle}>Venta de medicamentos de farmacia</h2>

        {loading && <p>Cargando datos de farmacia...</p>}

        {!loading && (
          <form onSubmit={handleSaleSubmit} style={styles.saleForm}>
            <div style={styles.customerMode}>
              <button
                style={{
                  ...styles.modeButton,
                  ...(saleCustomerType === "external" ? styles.activeModeButton : {}),
                }}
                type="button"
                onClick={() => setSaleCustomerType("external")}
              >
                Cliente externo
              </button>
              <button
                style={{
                  ...styles.modeButton,
                  ...(saleCustomerType === "registered" ? styles.activeModeButton : {}),
                }}
                type="button"
                onClick={() => setSaleCustomerType("registered")}
              >
                Paciente por cédula
              </button>
            </div>

            {saleCustomerType === "registered" && (
              <div style={styles.registeredCustomerGrid}>
                <label style={styles.label}>
                  Cédula del paciente
                  <input
                    style={styles.input}
                    value={patientIdentification}
                    onChange={(e) => setPatientIdentification(e.target.value)}
                    placeholder="Ingrese número de cédula"
                  />
                </label>

                <div style={styles.customerPreview}>
                  <span>Paciente</span>
                  <strong>{selectedSalePatient?.fullName ?? "No encontrado"}</strong>
                  <small>
                    {selectedSalePatient
                      ? selectedSalePatient.identification
                      : "Debe estar registrado en el sistema"}
                  </small>
                </div>
              </div>
            )}

            {saleCustomerType === "external" && (
              <div style={styles.externalCustomerGrid}>
                <label style={styles.label}>
                  Nombre del cliente
                  <input
                    style={styles.input}
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Ej: Juan Pérez"
                  />
                </label>

                <label style={styles.label}>
                  Cédula / RUC
                  <input
                    style={styles.input}
                    value={customerIdentification}
                    onChange={(e) => setCustomerIdentification(e.target.value)}
                    placeholder="Opcional"
                  />
                </label>

                <label style={styles.label}>
                  Dirección
                  <input
                    style={styles.input}
                    value={customerAddress}
                    onChange={(e) => setCustomerAddress(e.target.value)}
                    placeholder="Dirección del cliente"
                  />
                </label>

                <label style={styles.label}>
                  Correo
                  <input
                    style={styles.input}
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    type="email"
                    placeholder="cliente@correo.com"
                  />
                </label>

                <label style={styles.label}>
                  Teléfono / WhatsApp
                  <input
                    style={styles.input}
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="Opcional"
                  />
                </label>
              </div>
            )}

            <div style={styles.detailsHeader}>
              <h3 style={styles.subTitle}>Medicamentos</h3>
              <button style={styles.addButton} type="button" onClick={addSaleItem}>
                Agregar medicamento
              </button>
            </div>

            <div style={styles.quickCatalogBox}>
              {quickSaleMedicines.length === 0 && (
                <p style={styles.catalogEmpty}>No hay medicamentos con stock disponible.</p>
              )}

              {quickSaleMedicines.map((medicine) => (
                <button
                  key={medicine.id}
                  style={styles.quickMedicineButton}
                  type="button"
                  onClick={() => addMedicineToSale(medicine)}
                >
                  <span style={styles.productImageBox}>
                    {getMedicineInitials(medicine.name)}
                  </span>
                  <span style={styles.productCardName}>{medicine.name}</span>
                  <strong>${medicine.unitPrice.toFixed(2)}</strong>
                  <small>
                    Stock {medicine.stock}
                    {medicine.requiresPrescription ? " · Receta" : ""}
                  </small>
                </button>
              ))}
            </div>

            {saleItems.map((item, index) => {
              const medicine = medicines.find((med) => med.id === item.medicineId);
              const quantity = Number(item.quantity);
              const subtotal = medicine && quantity > 0 ? medicine.unitPrice * quantity : 0;

              return (
                <div key={index} style={styles.saleRow}>
                  <label style={styles.label}>
                    Medicamento
                    <select
                      style={styles.input}
                      value={item.medicineId}
                      onChange={(e) => {
                        updateSaleItem(index, "medicineId", e.target.value);
                        updateSaleItem(index, "hasPrescription", false);
                      }}
                    >
                      <option value="">Seleccione medicamento</option>
                      {medicines.map((medicine) => (
                        <option key={medicine.id} value={medicine.id}>
                          {medicine.name} - stock {medicine.stock} - ${medicine.unitPrice.toFixed(2)}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label style={styles.label}>
                    Cantidad
                    <input
                      style={styles.input}
                      value={item.quantity}
                      onChange={(e) => updateSaleItem(index, "quantity", e.target.value)}
                      type="number"
                      min="1"
                    />
                  </label>

                  <div style={styles.lineTotalBox}>
                    <span style={styles.smallText}>
                      {medicine?.requiresPrescription ? "Requiere receta" : "Sin receta"}
                    </span>
                    <strong>${subtotal.toFixed(2)}</strong>
                  </div>

                  <label
                    style={{
                      ...styles.prescriptionCheck,
                      ...(medicine?.requiresPrescription
                        ? styles.prescriptionRequired
                        : styles.prescriptionDisabled),
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={item.hasPrescription}
                      disabled={!medicine?.requiresPrescription}
                      onChange={(e) =>
                        updateSaleItem(index, "hasPrescription", e.target.checked)
                      }
                    />
                    Receta vista
                  </label>

                  <button
                    style={styles.deleteButton}
                    type="button"
                    onClick={() => removeSaleItem(index)}
                    disabled={saleItems.length === 1}
                  >
                    Quitar
                  </button>
                </div>
              );
            })}

            <div style={styles.totalBox}>
              <span>Total venta</span>
              <strong>${saleTotal.toFixed(2)}</strong>
            </div>

            <button style={styles.saveButton} type="submit" disabled={saving}>
              {saving ? "Registrando..." : "Registrar venta"}
            </button>
          </form>
        )}

        {message && <p style={styles.message}>{message}</p>}
      </section>
      )}

      {view === "customer" && (
      <section style={styles.card}>
        <h2 style={styles.sectionTitle}>Cliente nuevo para farmacia</h2>
        <p style={styles.inlineHint}>
          Estos datos se usarán en la próxima venta de farmacia.
        </p>

        <form onSubmit={handleNewCustomerSubmit} style={styles.customerForm}>
          <label style={styles.label}>
            Nombre
            <input
              style={styles.input}
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Nombre completo o razón social"
            />
          </label>

          <label style={styles.label}>
            Cédula o RUC
            <input
              style={styles.input}
              value={customerIdentification}
              onChange={(e) => setCustomerIdentification(e.target.value)}
              placeholder="Ej: 1700000001 o RUC"
            />
          </label>

          <label style={styles.label}>
            Dirección
            <input
              style={styles.input}
              value={customerAddress}
              onChange={(e) => setCustomerAddress(e.target.value)}
              placeholder="Dirección del cliente"
            />
          </label>

          <label style={styles.label}>
            Correo
            <input
              style={styles.input}
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
              type="email"
              placeholder="cliente@correo.com"
            />
          </label>

          <label style={styles.label}>
            Teléfono / WhatsApp
            <input
              style={styles.input}
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              placeholder="Opcional"
            />
          </label>

          <div style={styles.actions}>
            <button style={styles.saveButton} type="submit">
              Usar cliente en venta
            </button>
            <button style={styles.cancelButton} type="button" onClick={clearSale}>
              Limpiar datos
            </button>
          </div>
        </form>

        {message && <p style={styles.message}>{message}</p>}
      </section>
      )}

      {view === "medicines" && (
      <section style={styles.card}>
        <h2 style={styles.sectionTitle}>
          {editingMedicineId ? "Editar medicamento" : "Registrar medicamento"}
        </h2>

        <form onSubmit={handleSubmit} style={styles.form}>
          <label style={styles.label}>
            Nombre
            <input
              style={styles.input}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Paracetamol 500mg"
            />
          </label>

          <label style={styles.label}>
            Precio unitario
            <input
              style={styles.input}
              value={unitPrice}
              onChange={(e) => setUnitPrice(e.target.value)}
              type="number"
              step="0.01"
              min="0"
              placeholder="Ej: 0.25"
            />
          </label>

          <label style={styles.label}>
            Stock
            <input
              style={styles.input}
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              type="number"
              min="0"
              placeholder="Ej: 100"
            />
          </label>

          <label style={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={requiresPrescription}
              onChange={(e) => setRequiresPrescription(e.target.checked)}
            />
            Requiere receta
          </label>

          <div style={styles.actions}>
            <button style={styles.saveButton} type="submit" disabled={saving}>
              {saving
                ? "Guardando..."
                : editingMedicineId
                ? "Guardar cambios"
                : "Guardar medicamento"}
            </button>

            {editingMedicineId && (
              <button style={styles.cancelButton} type="button" onClick={clearForm}>
                Cancelar edición
              </button>
            )}
          </div>
        </form>

        {message && <p style={styles.message}>{message}</p>}
      </section>
      )}

      {view === "invoices" && (
      <section style={styles.card}>
        <h2 style={styles.sectionTitle}>Ventas y facturas de farmacia</h2>

        {!loading && invoices.length === 0 && <p>No hay ventas de farmacia registradas.</p>}

        {!loading && invoices.length > 0 && (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Paciente</th>
                <th style={styles.th}>Total farmacia</th>
                <th style={styles.th}>Medicamentos</th>
                <th style={styles.th}>Fecha</th>
                <th style={styles.th}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((invoice) => (
                <tr key={invoice.id}>
                  <td style={styles.td}>
                    {invoice.patientName ?? invoice.customerName}
                    <div style={styles.smallText}>
                      {invoice.patientName
                        ? "Paciente registrado"
                        : invoice.customerIdentification || "Cliente externo"}
                    </div>
                  </td>
                  <td style={styles.td}>${invoice.total.toFixed(2)}</td>
                  <td style={styles.td}>{invoice.detailsCount}</td>
                  <td style={styles.td}>
                    {new Date(invoice.createdAtUtc).toLocaleString()}
                  </td>
                  <td style={styles.td}>
                    <div style={styles.rowActions}>
                      <button
                        style={styles.viewButton}
                        onClick={() => handleViewInvoice(invoice.id)}
                      >
                        Ver factura
                      </button>
                      <button
                        style={styles.addButton}
                        onClick={() => handlePrintInvoiceById(invoice.id)}
                      >
                        Imprimir
                      </button>
                      <button
                        style={styles.deleteButton}
                        onClick={() => handleDeleteInvoice(invoice.id)}
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
      )}

      {view === "invoices" && selectedInvoice && (
      <section style={styles.invoicePreviewCard}>
        <div style={styles.detailsHeader}>
          <h2 style={styles.sectionTitle}>Factura de farmacia</h2>
          <div style={styles.actions}>
            <button
              style={styles.addButton}
              type="button"
              onClick={() => printPharmacyInvoice(selectedInvoice)}
            >
              Imprimir
            </button>
            <button
              style={styles.cancelButton}
              type="button"
              onClick={() => setSelectedInvoice(null)}
            >
              Cerrar
            </button>
          </div>
        </div>

        <article style={styles.posInvoiceSheet}>
          <header style={styles.posInvoiceHeader}>
            <div style={styles.invoiceBrand}>
              <img style={styles.invoiceLogo} src="/clininova-logo.png" alt="CLININOVA" />
              <div>
                <h3 style={styles.invoiceBrandTitle}>CLININOVA</h3>
                <p style={styles.invoiceBrandText}>Farmacia y Punto de Venta</p>
              </div>
            </div>

            <div style={styles.invoiceBadge}>
              <span>Factura de farmacia</span>
              <strong>{selectedInvoice.id}</strong>
            </div>
          </header>

          <div style={styles.posInvoiceSummary}>
            <div style={styles.invoiceMetaCard}>
              <span style={styles.smallText}>Cliente</span>
              <strong>{selectedInvoice.patientName ?? selectedInvoice.customerName}</strong>
            </div>
            <div style={styles.invoiceMetaCard}>
              <span style={styles.smallText}>Cédula / RUC</span>
              <strong>{selectedInvoice.customerIdentification || "Sin documento"}</strong>
            </div>
            <div style={styles.invoiceMetaCard}>
              <span style={styles.smallText}>WhatsApp</span>
              <strong>{selectedInvoice.customerPhone || "Sin teléfono"}</strong>
            </div>
            <div style={styles.invoiceMetaCard}>
              <span style={styles.smallText}>Fecha</span>
              <strong>{formatDate(selectedInvoice.createdAtUtc)}</strong>
            </div>
          </div>

          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Producto</th>
                <th style={styles.th}>Cantidad</th>
                <th style={styles.th}>Precio</th>
                <th style={styles.th}>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {selectedInvoice.details.length === 0 && (
                <tr>
                  <td style={styles.td} colSpan={4}>
                    Esta factura no tiene productos registrados.
                  </td>
                </tr>
              )}

              {selectedInvoice.details.map((detail) => (
                <tr key={detail.id}>
                  <td style={styles.td}>{detail.medicineName ?? detail.medicineId}</td>
                  <td style={styles.td}>{detail.quantity}</td>
                  <td style={styles.td}>{formatCurrency(detail.unitPrice)}</td>
                  <td style={styles.td}>{formatCurrency(detail.lineTotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={styles.invoiceTotal}>
            <span>Total venta</span>
            <strong>{formatCurrency(selectedInvoice.total)}</strong>
          </div>
        </article>
      </section>
      )}

      {view === "voided" && (
      <section style={styles.card}>
        <h2 style={styles.sectionTitle}>Ventas de farmacia anuladas</h2>

        {deletedInvoices.length === 0 && <p>No hay ventas anuladas.</p>}

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
      )}

      {view === "medicines" && (
      <section style={styles.card}>
        <h2 style={styles.sectionTitle}>Listado de medicamentos</h2>

        <input
          style={styles.searchInput}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar medicamento..."
        />

        {loading && <p>Cargando medicamentos...</p>}

        {!loading && filteredMedicines.length === 0 && (
          <p>No hay medicamentos registrados.</p>
        )}

        {!loading && filteredMedicines.length > 0 && (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Nombre</th>
                <th style={styles.th}>Precio</th>
                <th style={styles.th}>Stock</th>
                <th style={styles.th}>Receta</th>
                <th style={styles.th}>Fecha registro</th>
                <th style={styles.th}>Acciones</th>
              </tr>
            </thead>

            <tbody>
              {filteredMedicines.map((medicine) => (
                <tr key={medicine.id}>
                  <td style={styles.td}>{medicine.name}</td>

                  <td style={styles.td}>${medicine.unitPrice.toFixed(2)}</td>

                  <td style={styles.td}>{medicine.stock}</td>

                  <td style={styles.td}>
                    {medicine.requiresPrescription ? "Sí" : "No"}
                  </td>

                  <td style={styles.td}>
                    {new Date(medicine.createdAtUtc).toLocaleString()}
                  </td>

                  <td style={styles.td}>
                    <div style={styles.rowActions}>
                      <button style={styles.editButton} onClick={() => handleEdit(medicine)}>
                        Editar
                      </button>

                      <button
                        style={styles.deleteButton}
                        onClick={() => handleDelete(medicine.id, medicine.name)}
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
      )}
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  ...pageStyles,
  tabsCard: {
    maxWidth: "1200px",
    margin: "0 auto 24px auto",
    padding: "6px",
    borderRadius: "10px",
    background: "#e7f1f4",
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(145px, 1fr))",
    gap: "6px",
  },
  tabButton: {
    minHeight: "42px",
    padding: "10px 12px",
    border: "none",
    borderRadius: "8px",
    background: "transparent",
    color: "#1f5d73",
    fontWeight: "bold",
    cursor: "pointer",
  },
  activeTabButton: {
    background: "white",
    color: "#0e9384",
    boxShadow: "0 1px 6px rgba(15, 23, 42, 0.1)",
  },
  form: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr",
    gap: "16px",
    alignItems: "end",
  },
  saleForm: {
    display: "grid",
    gap: "16px",
  },
  customerMode: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "8px",
    padding: "4px",
    borderRadius: "10px",
    background: "#e7f1f4",
  },
  modeButton: {
    padding: "11px 12px",
    border: "none",
    borderRadius: "8px",
    background: "transparent",
    color: "#1f5d73",
    fontWeight: "bold",
    cursor: "pointer",
  },
  activeModeButton: {
    background: "white",
    color: "#0e9384",
    boxShadow: "0 1px 6px rgba(15, 23, 42, 0.1)",
  },
  registeredCustomerGrid: {
    display: "grid",
    gridTemplateColumns: "minmax(220px, 1fr) 1fr",
    gap: "12px",
    alignItems: "end",
  },
  externalCustomerGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "12px",
  },
  customerForm: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: "16px",
    alignItems: "end",
  },
  inlineHint: {
    margin: "-8px 0 18px 0",
    color: "#5f7680",
  },
  customerCardGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
    gap: "14px",
  },
  customerCard: {
    display: "grid",
    gridTemplateColumns: "56px 1fr",
    gap: "12px",
    alignItems: "center",
    padding: "14px",
    border: "1px solid #d9e8ee",
    borderRadius: "10px",
    background: "#ffffff",
    boxShadow: "0 8px 20px rgba(18, 50, 63, 0.05)",
  },
  customerAvatar: {
    display: "grid",
    placeItems: "center",
    width: "56px",
    height: "56px",
    borderRadius: "10px",
    background: "#e7f7f4",
    color: "#0b635d",
    fontWeight: "bold",
  },
  customerCardBody: {
    display: "grid",
    gap: "3px",
    minWidth: 0,
    color: "#12323f",
  },
  customerPreview: {
    display: "grid",
    gap: "4px",
    padding: "12px",
    borderRadius: "10px",
    background: "#f8fafc",
    color: "#12323f",
  },
  quickCatalogBox: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "10px",
    padding: "12px",
    borderRadius: "10px",
    background: "#f8fafc",
  },
  quickMedicineButton: {
    display: "grid",
    gap: "5px",
    minHeight: "170px",
    padding: "12px",
    border: "1px solid #dbe4ea",
    borderRadius: "8px",
    background: "white",
    color: "#12323f",
    cursor: "pointer",
    textAlign: "left",
  },
  productImageBox: {
    display: "grid",
    placeItems: "center",
    width: "100%",
    aspectRatio: "1 / 1",
    border: "1px dashed #c9dce3",
    borderRadius: "8px",
    background: "#f4f9fb",
    color: "#1f5d73",
    fontSize: "24px",
    fontWeight: "bold",
  },
  productCardName: {
    minHeight: "38px",
    color: "#12323f",
    fontWeight: "bold",
  },
  invoicePreviewCard: {
    maxWidth: "1200px",
    margin: "0 auto 24px auto",
    padding: "24px",
    border: "1px solid #d9e8ee",
    borderRadius: "12px",
    background: "#ffffff",
    boxShadow: "0 10px 28px rgba(18, 50, 63, 0.06)",
    overflowX: "auto",
  },
  posInvoiceSheet: {
    marginTop: "18px",
    border: "1px solid #d9e8ee",
    borderRadius: "14px",
    background: "#ffffff",
    overflow: "hidden",
    boxShadow: "0 14px 32px rgba(18, 50, 63, 0.08)",
  },
  posInvoiceHeader: {
    display: "grid",
    gridTemplateColumns: "1fr auto",
    gap: "18px",
    padding: "20px",
    background: "#12323f",
    color: "#ffffff",
  },
  invoiceBrand: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
    minWidth: 0,
  },
  invoiceLogo: {
    width: "68px",
    height: "68px",
    objectFit: "contain",
    borderRadius: "10px",
    background: "#ffffff",
    padding: "5px",
  },
  invoiceBrandTitle: {
    margin: 0,
    fontSize: "26px",
    letterSpacing: "0",
  },
  invoiceBrandText: {
    margin: "4px 0 0 0",
    color: "rgba(255,255,255,0.78)",
  },
  invoiceBadge: {
    minWidth: "220px",
    padding: "12px",
    borderRadius: "10px",
    background: "rgba(255,255,255,0.1)",
    textAlign: "right",
    overflowWrap: "anywhere",
  },
  posInvoiceSummary: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "12px",
    padding: "20px",
    background: "#ffffff",
    color: "#12323f",
  },
  invoiceMetaCard: {
    minHeight: "76px",
    padding: "13px",
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
  viewButton: {
    padding: "8px 12px",
    border: "none",
    borderRadius: "8px",
    background: "#0e9384",
    color: "white",
    fontWeight: "bold",
    cursor: "pointer",
  },
  catalogEmpty: {
    margin: 0,
    color: "#64748b",
  },
  saleRow: {
    display: "grid",
    gridTemplateColumns: "2fr 0.65fr 0.75fr 0.8fr auto",
    gap: "12px",
    alignItems: "end",
  },
  prescriptionCheck: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    minHeight: "45px",
    padding: "10px 12px",
    borderRadius: "10px",
    fontSize: "14px",
    fontWeight: "bold",
  },
  prescriptionRequired: {
    background: "#fef3c7",
    color: "#92400e",
  },
  prescriptionDisabled: {
    background: "#f4f9fb",
    color: "#9ca3af",
  },
  checkboxLabel: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    color: "#284653",
    fontSize: "14px",
    fontWeight: "bold",
    paddingBottom: "12px",
  },
};
