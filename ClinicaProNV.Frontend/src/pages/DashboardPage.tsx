import { useEffect, useMemo, useState } from "react";
import { apiRequest } from "../api/api";
import { pageStyles } from "../styles/pageStyles";

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
          <p style={styles.subtitle}>Clínica y farmacia con indicadores separados</p>
        </div>
      </section>

      {loading && <section style={styles.card}>Cargando indicadores...</section>}
      {message && <section style={styles.card}>{message}</section>}

      {sales && (
        <>
          <section style={styles.kpiGrid}>
            <MetricCard title="Total vendido hoy" value={`$${sales.today.total.toFixed(2)}`} />
            <MetricCard title="Facturación clínica hoy" value={`$${sales.today.clinicTotal.toFixed(2)}`} />
            <MetricCard title="Ventas de farmacia hoy" value={`$${sales.today.pharmacyTotal.toFixed(2)}`} />
            <MetricCard title="Facturas emitidas hoy" value={String(sales.today.invoices)} />
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
                  Facturación clínica
                </button>
                <button style={styles.actionButton} onClick={() => onNavigate("/farmacia")}>
                  Farmacia
                </button>
                <button style={styles.actionButton} onClick={() => onNavigate("/pacientes")}>
                  Pacientes y fichas técnicas
                </button>
              </div>
              <p style={styles.helpText}>
              </p>
            </article>
          </section>

          <section style={styles.cardGrid}>
            <RankingCard
              title="Servicios clínicos más vendidos"
              rows={sales.topClinicalServices.map((item) => ({
                id: item.name,
                name: item.name,
                detail: `${item.quantity} uds`,
                total: item.total,
              }))}
            />

            <RankingCard
              title="Medicinas de farmacia más vendidas"
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
            <MetricCard title="Histórico clínico" value={`$${sales.allTime.clinicTotal.toFixed(2)}`} />
            <MetricCard title="Histórico farmacia" value={`$${sales.allTime.pharmacyTotal.toFixed(2)}`} />
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
  ...pageStyles,
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
    color: "#12323f",
  },
  cardGrid: {
    maxWidth: "1200px",
    margin: "0 auto 24px",
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
    gap: "16px",
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
    color: "#284653",
  },
  barTrack: {
    height: "12px",
    borderRadius: "999px",
    background: "#d9e8ee",
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    borderRadius: "999px",
    background: "#0e9384",
  },
  quickActions: {
    display: "grid",
    gap: "10px",
  },
  actionButton: {
    padding: "12px",
    border: "none",
    borderRadius: "8px",
    background: "#0e9384",
    color: "white",
    fontWeight: "bold",
    cursor: "pointer",
  },
  helpText: {
    marginTop: "14px",
    color: "#5f7680",
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
    background: "#e7f7f4",
    color: "#0b635d",
    fontWeight: "bold",
  },};
