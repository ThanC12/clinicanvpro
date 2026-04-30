import { useEffect, useState } from "react";
import { apiRequest } from "./api/api";
import { PatientsPage } from "./pages/PatientsPage";
import { DoctorsPage } from "./pages/DoctorsPage";

type LoginResponse = {
  userId: string;
  email: string;
  role: string;
  token: string;
};

function App() {
  const [email, setEmail] = useState("admin@clinica.com");
  const [password, setPassword] = useState("Admin123*");
  const [message, setMessage] = useState("");
  const [loggedEmail, setLoggedEmail] = useState("");
  const [userRole, setUserRole] = useState("");
  const [currentPage, setCurrentPage] = useState("dashboard");

  useEffect(() => {
    const storedEmail = localStorage.getItem("email");
    const storedRole = localStorage.getItem("role");
    const token = localStorage.getItem("token");

    if (token && storedEmail && storedRole) {
      setLoggedEmail(storedEmail);
      setUserRole(storedRole);
      setCurrentPage("dashboard");
    }
  }, []);

  async function handleLogin(event: React.FormEvent) {
    event.preventDefault();
    setMessage("Iniciando sesión...");

    try {
      const data = await apiRequest<LoginResponse>("/Auth/login", {
        method: "POST",
        body: JSON.stringify({
          email,
          password,
        }),
      });

      localStorage.setItem("token", data.token);
      localStorage.setItem("role", data.role);
      localStorage.setItem("email", data.email);

      setLoggedEmail(data.email);
      setUserRole(data.role);
      setCurrentPage("dashboard");
      setMessage("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Error desconocido");
    }
  }

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("email");

    setLoggedEmail("");
    setUserRole("");
    setCurrentPage("dashboard");
    setMessage("");
  }

  if (loggedEmail && currentPage === "patients") {
    return <PatientsPage onBack={() => setCurrentPage("dashboard")} />;
  }

  if (loggedEmail && currentPage === "doctors") {
    return <DoctorsPage onBack={() => setCurrentPage("dashboard")} />;
  }

  if (loggedEmail) {
    return (
      <main style={styles.dashboardPage}>
        <section style={styles.dashboardHeader}>
          <div>
            <h1 style={styles.dashboardTitle}>ClinicaProNV</h1>
            <p style={styles.dashboardSubtitle}>
              Bienvenido, {loggedEmail} · Rol: {userRole}
            </p>
          </div>

          <button style={styles.logoutButton} onClick={handleLogout}>
            Cerrar sesión
          </button>
        </section>

        <section style={styles.grid}>
          <ModuleCard
            title="Pacientes"
            description="Gestionar datos de pacientes"
            onClick={() => setCurrentPage("patients")}
          />

          <ModuleCard
            title="Doctores"
            description="Administrar médicos y especialidades"
            onClick={() => setCurrentPage("doctors")}
          />

          <ModuleCard
            title="Citas"
            description="Crear y consultar citas médicas"
          />

          <ModuleCard
            title="Historias clínicas"
            description="Registrar notas y antecedentes"
          />

          <ModuleCard
            title="Farmacia"
            description="Medicamentos, stock y ventas"
          />

          <ModuleCard
            title="Facturación"
            description="Cobros y comprobantes clínicos"
          />

          <ModuleCard
            title="Usuarios"
            description="Roles y accesos del sistema"
          />
        </section>
      </main>
    );
  }

  return (
    <main style={styles.page}>
      <section style={styles.card}>
        <h1 style={styles.title}>Clinica</h1>
        <p style={styles.subtitle}>Ingreso al sistema clínico</p>

        <form onSubmit={handleLogin} style={styles.form}>
          <label style={styles.label}>
            Correo
            <input
              style={styles.input}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
            />
          </label>

          <label style={styles.label}>
            Contraseña
            <input
              style={styles.input}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
            />
          </label>

          <button style={styles.button} type="submit">
            Iniciar sesión
          </button>
        </form>

        {message && <p style={styles.message}>{message}</p>}
      </section>
    </main>
  );
}

function ModuleCard({
  title,
  description,
  onClick,
}: {
  title: string;
  description: string;
  onClick?: () => void;
}) {
  return (
    <article style={styles.moduleCard}>
      <h2 style={styles.moduleTitle}>{title}</h2>
      <p style={styles.moduleDescription}>{description}</p>
      <button style={styles.moduleButton} onClick={onClick}>
        Entrar
      </button>
    </article>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    display: "grid",
    placeItems: "center",
    background: "#f3f6fb",
    fontFamily: "Arial, sans-serif",
  },
  card: {
    width: "420px",
    padding: "36px",
    borderRadius: "18px",
    background: "white",
    boxShadow: "0 12px 35px rgba(0,0,0,0.08)",
  },
  title: {
    margin: 0,
    color: "#1f2937",
    textAlign: "center",
    fontSize: "52px",
    lineHeight: "48px",
  },
  subtitle: {
    marginTop: "8px",
    marginBottom: "32px",
    color: "#6b7280",
    textAlign: "center",
    fontSize: "20px",
  },
  form: {
    display: "grid",
    gap: "18px",
  },
  label: {
    display: "grid",
    gap: "8px",
    color: "#111827",
    fontSize: "15px",
    textAlign: "center",
  },
  input: {
    padding: "14px",
    border: "1px solid #d1d5db",
    borderRadius: "10px",
    fontSize: "15px",
    background: "#3b3b3b",
    color: "white",
  },
  button: {
    marginTop: "10px",
    padding: "14px",
    border: "none",
    borderRadius: "10px",
    background: "#2563eb",
    color: "white",
    fontWeight: "bold",
    cursor: "pointer",
    fontSize: "15px",
  },
  message: {
    marginTop: "20px",
    textAlign: "center",
    color: "#2563eb",
    fontWeight: "bold",
  },
  dashboardPage: {
    minHeight: "100vh",
    background: "#f3f6fb",
    padding: "32px",
    fontFamily: "Arial, sans-serif",
  },
  dashboardHeader: {
    maxWidth: "1100px",
    margin: "0 auto 28px auto",
    padding: "24px",
    borderRadius: "18px",
    background: "white",
    boxShadow: "0 12px 35px rgba(0,0,0,0.06)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dashboardTitle: {
    margin: 0,
    color: "#111827",
    fontSize: "34px",
  },
  dashboardSubtitle: {
    margin: "6px 0 0 0",
    color: "#6b7280",
  },
  logoutButton: {
    padding: "12px 18px",
    border: "none",
    borderRadius: "10px",
    background: "#ef4444",
    color: "white",
    fontWeight: "bold",
    cursor: "pointer",
  },
  grid: {
    maxWidth: "1100px",
    margin: "0 auto",
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
    gap: "18px",
  },
  moduleCard: {
    padding: "22px",
    borderRadius: "18px",
    background: "white",
    boxShadow: "0 12px 35px rgba(0,0,0,0.06)",
  },
  moduleTitle: {
    margin: 0,
    color: "#111827",
    fontSize: "22px",
  },
  moduleDescription: {
    color: "#6b7280",
    minHeight: "44px",
  },
  moduleButton: {
    width: "100%",
    padding: "11px",
    border: "none",
    borderRadius: "10px",
    background: "#2563eb",
    color: "white",
    fontWeight: "bold",
    cursor: "pointer",
  },
};

export default App;