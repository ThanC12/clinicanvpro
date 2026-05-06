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

type PharmacyView = "sale" | "invoices" | "medicines" | "voided";

export function PharmacyPage({ onBack }: PharmacyPageProps) {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [invoices, setInvoices] = useState<PharmacyInvoice[]>([]);
  const [deletedInvoices, setDeletedInvoices] = useState<DeletedPharmacyInvoice[]>([]);
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
  const [customerPhone, setCustomerPhone] = useState("");
  const [saleItems, setSaleItems] = useState<SaleItemInput[]>([
    { medicineId: "", quantity: "1", hasPrescription: false },
  ]);

  const [search, setSearch] = useState("");
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
    setCustomerPhone("");
    setSaleItems([{ medicineId: "", quantity: "1", hasPrescription: false }]);
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

  const quickSaleMedicines = medicines
    .filter((medicine) => medicine.stock > 0)
    .slice(0, 18);

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
                  Cédula / documento
                  <input
                    style={styles.input}
                    value={customerIdentification}
                    onChange={(e) => setCustomerIdentification(e.target.value)}
                    placeholder="Opcional"
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
                  <span>{medicine.name}</span>
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
                    <button
                      style={styles.deleteButton}
                      onClick={() => handleDeleteInvoice(invoice.id)}
                    >
                      Anular
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
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
    gridTemplateColumns: "repeat(4, 1fr)",
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
    minHeight: "92px",
    padding: "12px",
    border: "1px solid #dbe4ea",
    borderRadius: "8px",
    background: "white",
    color: "#12323f",
    cursor: "pointer",
    textAlign: "left",
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
  },};
