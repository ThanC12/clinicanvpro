import { useEffect, useMemo, useState } from "react";
import { apiRequest } from "../api/api";

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
};

type SaleItemInput = {
  medicineId: string;
  quantity: string;
};

type PharmacyInvoice = {
  id: string;
  patientId: string;
  patientName: string | null;
  total: number;
  createdAtUtc: string;
  detailsCount: number;
};

type PharmacyPageProps = {
  onBack: () => void;
};

export function PharmacyPage({ onBack }: PharmacyPageProps) {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [invoices, setInvoices] = useState<PharmacyInvoice[]>([]);
  const [name, setName] = useState("");
  const [unitPrice, setUnitPrice] = useState("");
  const [stock, setStock] = useState("");
  const [requiresPrescription, setRequiresPrescription] = useState(false);
  const [editingMedicineId, setEditingMedicineId] = useState<string | null>(null);
  const [salePatientId, setSalePatientId] = useState("");
  const [saleItems, setSaleItems] = useState<SaleItemInput[]>([
    { medicineId: "", quantity: "1" },
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
      setMedicines(medicinesData);
      setPatients(patientsData);
      setInvoices(invoicesData);
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

  function updateSaleItem(index: number, field: keyof SaleItemInput, value: string) {
    setSaleItems((current) =>
      current.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  }

  function addSaleItem() {
    setSaleItems((current) => [...current, { medicineId: "", quantity: "1" }]);
  }

  function removeSaleItem(index: number) {
    setSaleItems((current) =>
      current.length === 1 ? current : current.filter((_, i) => i !== index)
    );
  }

  function clearSale() {
    setSalePatientId("");
    setSaleItems([{ medicineId: "", quantity: "1" }]);
  }

  async function handleSaleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (!salePatientId) {
      setMessage("Seleccione un paciente para la venta.");
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

    try {
      setSaving(true);
      setMessage("Registrando venta...");

      await apiRequest<void>("/pharmacy/invoices", {
        method: "POST",
        body: JSON.stringify({
          patientId: salePatientId,
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
    const confirmed = window.confirm("¿Seguro que deseas eliminar esta venta?");

    if (!confirmed) {
      return;
    }

    try {
      setMessage("Eliminando venta...");

      await apiRequest<void>(`/pharmacy/invoices/${id}`, {
        method: "DELETE",
      });

      setMessage("Venta eliminada correctamente.");
      await loadData();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Error al eliminar venta");
    }
  }

  useEffect(() => {
    loadData();
  }, []);

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

      <section style={styles.card}>
        <h2 style={styles.sectionTitle}>Venta de medicamentos de farmacia</h2>

        {loading && <p>Cargando datos de farmacia...</p>}

        {!loading && (
          <form onSubmit={handleSaleSubmit} style={styles.saleForm}>
            <label style={styles.label}>
              Paciente
              <select
                style={styles.input}
                value={salePatientId}
                onChange={(e) => setSalePatientId(e.target.value)}
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
              <h3 style={styles.subTitle}>Medicamentos</h3>
              <button style={styles.addButton} type="button" onClick={addSaleItem}>
                Agregar medicamento
              </button>
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
                      onChange={(e) => updateSaleItem(index, "medicineId", e.target.value)}
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
                  <td style={styles.td}>{invoice.patientName ?? invoice.patientId}</td>
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
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

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
    gridTemplateColumns: "1fr 1fr 1fr",
    gap: "16px",
    alignItems: "end",
  },
  saleForm: {
    display: "grid",
    gap: "16px",
  },
  saleRow: {
    display: "grid",
    gridTemplateColumns: "2fr 0.7fr 0.8fr auto",
    gap: "12px",
    alignItems: "end",
  },
  detailsHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
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
  label: {
    display: "grid",
    gap: "8px",
    color: "#374151",
    fontSize: "14px",
    fontWeight: "bold",
  },
  checkboxLabel: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    color: "#374151",
    fontSize: "14px",
    fontWeight: "bold",
    paddingBottom: "12px",
  },
  input: {
    padding: "12px",
    border: "1px solid #d1d5db",
    borderRadius: "10px",
    fontSize: "15px",
    background: "white",
    color: "#111827",
  },
  actions: {
    gridColumn: "1 / -1",
    display: "flex",
    gap: "12px",
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
    color: "#0f766e",
    fontWeight: "bold",
    textAlign: "center",
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
  rowActions: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
  },
  editButton: {
    padding: "8px 12px",
    border: "none",
    borderRadius: "8px",
    background: "#334155",
    color: "white",
    fontWeight: "bold",
    cursor: "pointer",
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
};
