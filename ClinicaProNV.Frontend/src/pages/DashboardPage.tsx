import { useEffect, useMemo, useState } from "react";
import { apiRequest } from "../api/api";

type DashboardSales = {
  today: {
    clinicTotal: number;
    pharmacyTotal: number;
    total: number;
    invoices: number;
  };
  allTime: {
    clinicTotal: number;
    pharmacyTotal: number;
    total: number;
  };
  topClinicalServices: Array<{
    name: string;
    quantity: number;
    total: number;
  }>;
  topMedicines: Array<{
    medicineId: string;
    name: string | null;
    quantity: number;
    total: number;
  }>;
  dailySales: Array<{
    date: string;
    clinicTotal: number;
    pharmacyTotal: number;
    total: number;
  }>;
};

type DashboardPageProps = {
  onNavigate: (path: string) => void;
};

export function DashboardPage({ onNavigate }: DashboardPageProps) {
  const [sales, setSales] = useState<DashboardSales | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadSales() {
      try {
        setLoading(true);
        setMessage("");
        const data = await apiRequest<DashboardSales>("/dashboard/sales");
        setSales(data);
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Error al cargar dashboard");
      } finally {
        setLoading(false);
      }
    }

    loadSales();
  }, []);

  const maxDailyTotal = useMemo(() => {
    if (!sales || sales.dailySales.length === 0) {
      return 1;
    }

    return Math.max(...sales.dailySales.map((day) => day.total), 1);
  }, [sales]);

  return (
    <main style={styles.page}>
      <section style={styles.header}>
        <div>
          <h1 style={styles.title}>Dashboard</h1>
          <p style={styles.subtitle}>Ventas, facturas y productos con más movimiento</p>
        </div>
      </section>

      {loading && <section style={styles.card}>Cargando indicadores...</section>}
      {message && <section style={styles.card}>{message}</section>}

      {sales && (
        <>
          <section style={styles.kpiGrid}>
            <MetricCard title="Vendido hoy" value={`$${sales.today.total.toFixed(2)}`} />
            <MetricCard title="Clínica hoy" value={`$${sales.today.clinicTotal.toFixed(2)}`} />
            <MetricCard title="Farmacia hoy" value={`$${sales.today.pharmacyTotal.toFixed(2)}`} />
            <MetricCard title="Facturas hoy" value={String(sales.today.invoices)} />
          </section>

          <section style={styles.cardGrid}>
            <article style={styles.card}>
              <h2 style={styles.sectionTitle}>Ventas últimos 7 días</h2>
              <div style={styles.barList}>
                {sales.dailySales.map((day) => {
                  const width = `${Math.max((day.total / maxDailyTotal) * 100, 3)}%`;

                  return (
                    <div key={day.date} style={styles.barRow}>
                      <span>{new Date(day.date).toLocaleDateString()}</span>
                      <div style={styles.barTrack}>
                        <div style={{ ...styles.barFill, width }} />
                      </div>
                      <strong>${day.total.toFixed(2)}</strong>
                    </div>
                  );
                })}
              </div>
            </article>

            <article style={styles.card}>
              <h2 style={styles.sectionTitle}>Dónde se guarda</h2>
              <div style={styles.quickActions}>
                <button style={styles.actionButton} onClick={() => onNavigate("/facturacion")}>
                  Facturas clínicas
                </button>
                <button style={styles.actionButton} onClick={() => onNavigate("/farmacia")}>
                  Ventas de farmacia
                </button>
                <button style={styles.actionButton} onClick={() => onNavigate("/pacientes")}>
                  Pacientes y fichas técnicas
                </button>
              </div>
              <p style={styles.helpText}>
                Las fichas técnicas están en Pacientes. El doctor entra a Pacientes,
                selecciona el paciente en “Ficha clínica / técnica” y ve o agrega las fichas.
              </p>
            </article>
          </section>

          <section style={styles.cardGrid}>
            <RankingCard
              title="Servicios más vendidos"
              rows={sales.topClinicalServices.map((item) => ({
                id: item.name,
                name: item.name,
                detail: `${item.quantity} uds`,
                total: item.total,
              }))}
            />

            <RankingCard
              title="Medicinas más vendidas"
              rows={sales.topMedicines.map((item) => ({
                id: item.medicineId,
                name: item.name ?? item.medicineId,
                detail: `${item.quantity} uds`,
                total: item.total,
              }))}
            />
          </section>

          <section style={styles.kpiGrid}>
            <MetricCard title="Total histórico" value={`$${sales.allTime.total.toFixed(2)}`} />
            <MetricCard title="Clínica histórico" value={`$${sales.allTime.clinicTotal.toFixed(2)}`} />
            <MetricCard title="Farmacia histórico" value={`$${sales.allTime.pharmacyTotal.toFixed(2)}`} />
          </section>
        </>
      )}
    </main>
  );
}

function MetricCard({ title, value }: { title: string; value: string }) {
  return (
    <article style={styles.metricCard}>
      <span>{title}</span>
      <strong>{value}</strong>
    </article>
  );
}

function RankingCard({
  title,
  rows,
}: {
  title: string;
  rows: Array<{ id: string; name: string; detail: string; total: number }>;
}) {
  return (
    <article style={styles.card}>
      <h2 style={styles.sectionTitle}>{title}</h2>
      {rows.length === 0 && <p>No hay ventas registradas.</p>}
      {rows.length > 0 && (
        <div style={styles.rankingList}>
          {rows.map((row, index) => (
            <div key={row.id} style={styles.rankingRow}>
              <span style={styles.rank}>{index + 1}</span>
              <div>
                <strong>{row.name}</strong>
                <span>{row.detail}</span>
              </div>
              <strong>${row.total.toFixed(2)}</strong>
            </div>
          ))}
        </div>
      )}
    </article>
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
    borderRadius: "8px",
    background: "white",
    boxShadow: "0 12px 35px rgba(0,0,0,0.06)",
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
  kpiGrid: {
    maxWidth: "1200px",
    margin: "0 auto 24px",
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
    gap: "16px",
  },
  metricCard: {
    display: "grid",
    gap: "10px",
    padding: "20px",
    borderRadius: "8px",
    background: "white",
    boxShadow: "0 12px 35px rgba(0,0,0,0.06)",
    color: "#111827",
  },
  cardGrid: {
    maxWidth: "1200px",
    margin: "0 auto 24px",
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
    gap: "16px",
  },
  card: {
    padding: "24px",
    borderRadius: "8px",
    background: "white",
    boxShadow: "0 12px 35px rgba(0,0,0,0.06)",
    color: "#111827",
  },
  sectionTitle: {
    marginTop: 0,
    color: "#111827",
  },
  barList: {
    display: "grid",
    gap: "12px",
  },
  barRow: {
    display: "grid",
    gridTemplateColumns: "92px 1fr 90px",
    gap: "10px",
    alignItems: "center",
    color: "#374151",
  },
  barTrack: {
    height: "12px",
    borderRadius: "999px",
    background: "#e5e7eb",
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    borderRadius: "999px",
    background: "#0f766e",
  },
  quickActions: {
    display: "grid",
    gap: "10px",
  },
  actionButton: {
    padding: "12px",
    border: "none",
    borderRadius: "8px",
    background: "#0f766e",
    color: "white",
    fontWeight: "bold",
    cursor: "pointer",
  },
  helpText: {
    marginTop: "14px",
    color: "#6b7280",
  },
  rankingList: {
    display: "grid",
    gap: "10px",
  },
  rankingRow: {
    display: "grid",
    gridTemplateColumns: "34px 1fr auto",
    gap: "12px",
    alignItems: "center",
    padding: "12px",
    borderRadius: "8px",
    background: "#f8fafc",
  },
  rank: {
    display: "grid",
    placeItems: "center",
    width: "28px",
    height: "28px",
    borderRadius: "999px",
    background: "#ecfdf5",
    color: "#065f46",
    fontWeight: "bold",
  },
};
