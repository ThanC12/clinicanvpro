import { useEffect, useMemo, useState } from "react";
import { apiRequest } from "./api/api";
import { PatientsPage } from "./pages/PatientsPage";
import { DoctorsPage } from "./pages/DoctorsPage";
import { AppointmentsPage } from "./pages/AppointmentsPage";
import { ClinicalNotesPage } from "./pages/ClinicalNotesPage";
import { PharmacyPage } from "./pages/PharmacyPage";
import { BillingPage } from "./pages/BillingPage";
import { UsersPage } from "./pages/UsersPage";
import { DashboardPage } from "./pages/DashboardPage";
import "./App.css";

type AuthResponse = {
  userId: string;
  email: string;
  role: string;
  token: string;
};

type AuthState = {
  email: string;
  role: string;
  token: string;
};

type ModuleDefinition = {
  path: string;
  title: string;
  description: string;
  roles: string[];
};

const modules: ModuleDefinition[] = [
  {
    path: "/dashboard",
    title: "Dashboard",
    description: "Ventas del día, rankings y accesos rápidos.",
    roles: ["Admin", "Cajero", "Farmacia"],
  },
  {
    path: "/pacientes",
    title: "Pacientes",
    description: "Datos personales, búsqueda y expediente.",
    roles: ["Admin", "Recepcion", "Doctor", "Enfermeria"],
  },
  {
    path: "/doctores",
    title: "Doctores",
    description: "Médicos, especialidades y disponibilidad base.",
    roles: ["Admin", "Recepcion"],
  },
  {
    path: "/citas",
    title: "Citas",
    description: "Agenda, estados y cambios de horario.",
    roles: ["Admin", "Recepcion", "Doctor", "Enfermeria"],
  },
  {
    path: "/historias-clinicas",
    title: "Historias clínicas",
    description: "Notas de consulta e historial por paciente.",
    roles: ["Admin", "Doctor", "Enfermeria"],
  },
  {
    path: "/farmacia",
    title: "Farmacia",
    description: "Inventario, stock y venta de medicamentos.",
    roles: ["Admin", "Farmacia"],
  },
  {
    path: "/facturacion",
    title: "Facturación",
    description: "Facturas clínicas, detalle e impresión.",
    roles: ["Admin", "Cajero"],
  },
  {
    path: "/usuarios",
    title: "Usuarios",
    description: "Altas, roles y estado de acceso.",
    roles: ["Admin"],
  },
];

function getStoredAuth(): AuthState | null {
  const email = localStorage.getItem("email");
  const role = localStorage.getItem("role");
  const token = localStorage.getItem("token");

  return email && role && token ? { email, role, token } : null;
}

function App() {
  const [auth, setAuth] = useState<AuthState | null>(() => getStoredAuth());
  const [route, setRoute] = useState(() => window.location.pathname);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("Recepcion");
  const [message, setMessage] = useState("");

  const allowedModules = useMemo(() => {
    if (!auth) return [];
    return modules.filter((module) => module.roles.includes(auth.role));
  }, [auth]);

  useEffect(() => {
    function handlePopState() {
      setRoute(window.location.pathname);
    }

    function handleExpiredSession() {
      setAuth(null);
      setMessage("La sesión expiró. Inicia sesión nuevamente.");
      navigate("/");
    }

    window.addEventListener("popstate", handlePopState);
    window.addEventListener("session-expired", handleExpiredSession);

    return () => {
      window.removeEventListener("popstate", handlePopState);
      window.removeEventListener("session-expired", handleExpiredSession);
    };
  }, []);

  function navigate(path: string) {
    window.history.pushState({}, "", path);
    setRoute(path);
  }

  function persistAuth(data: AuthResponse) {
    localStorage.setItem("token", data.token);
    localStorage.setItem("role", data.role);
    localStorage.setItem("email", data.email);
    setAuth({ email: data.email, role: data.role, token: data.token });
    setMessage("");
    navigate("/");
  }

  async function handleAuth(event: React.FormEvent) {
    event.preventDefault();
    setMessage(authMode === "login" ? "Iniciando sesión..." : "Creando cuenta...");

    try {
      const data = await apiRequest<AuthResponse>(
        authMode === "login" ? "/Auth/login" : "/Auth/register",
        {
          method: "POST",
          body: JSON.stringify(
            authMode === "login"
              ? { email, password }
              : { email, password, role }
          ),
        }
      );

      persistAuth(data);
      setEmail("");
      setPassword("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Error desconocido");
    }
  }

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("email");
    setAuth(null);
    setMessage("");
    navigate("/");
  }

  if (!auth) {
    return (
      <main className="auth-page">
        <section className="auth-card">
          <div className="brand-mark">CP</div>
          <h1>ClinicaProNV</h1>
          <p>Sistema operativo clínico</p>

          <div className="segmented" aria-label="Modo de acceso">
            <button
              className={authMode === "login" ? "active" : ""}
              onClick={() => setAuthMode("login")}
              type="button"
            >
              Ingresar
            </button>
            <button
              className={authMode === "register" ? "active" : ""}
              onClick={() => setAuthMode("register")}
              type="button"
            >
              Registrar
            </button>
          </div>

          <form onSubmit={handleAuth} className="stack-form">
            <label>
              Correo
              <input
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                type="email"
                autoComplete="email"
                required
              />
            </label>

            <label>
              Contraseña
              <input
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                type="password"
                autoComplete={authMode === "login" ? "current-password" : "new-password"}
                required
              />
            </label>

            {authMode === "register" && (
              <label>
                Rol inicial
                <select value={role} onChange={(event) => setRole(event.target.value)}>
                  <option value="Recepcion">Recepción</option>
                  <option value="Doctor">Doctor</option>
                  <option value="Enfermeria">Enfermería</option>
                  <option value="Farmacia">Farmacia</option>
                  <option value="Cajero">Cajero</option>
                </select>
              </label>
            )}

            <button className="primary-button" type="submit">
              {authMode === "login" ? "Iniciar sesión" : "Crear cuenta"}
            </button>
          </form>

          {message && <p className="form-message">{message}</p>}
        </section>
      </main>
    );
  }

  const pageProps = { onBack: () => navigate("/") };
  const selectedModule = modules.find((module) => module.path === route);
  const canAccessRoute =
    route === "/" || allowedModules.some((module) => module.path === route);

  if (!canAccessRoute) {
    return (
      <Shell auth={auth} onLogout={handleLogout} onNavigate={navigate}>
        <section className="panel">
          <h1>Acceso restringido</h1>
          <p>Tu rol no tiene permisos para abrir este módulo.</p>
          <button className="secondary-button" onClick={() => navigate("/")}>
            Volver al inicio
          </button>
        </section>
      </Shell>
    );
  }

  return (
    <Shell auth={auth} onLogout={handleLogout} onNavigate={navigate}>
      {route === "/" && (
        <>
          {allowedModules.some((module) => module.path === "/dashboard") && (
            <DashboardPage onNavigate={navigate} />
          )}

          <section className="dashboard-grid">
            {allowedModules
              .filter((module) => module.path !== "/dashboard")
              .map((module) => (
                <article className="module-card" key={module.path}>
                  <span>{module.title}</span>
                  <p>{module.description}</p>
                  <button onClick={() => navigate(module.path)}>Entrar</button>
                </article>
              ))}
          </section>
        </>
      )}

      {selectedModule?.path === "/dashboard" && <DashboardPage onNavigate={navigate} />}
      {selectedModule?.path === "/pacientes" && <PatientsPage {...pageProps} />}
      {selectedModule?.path === "/doctores" && <DoctorsPage {...pageProps} />}
      {selectedModule?.path === "/citas" && <AppointmentsPage {...pageProps} />}
      {selectedModule?.path === "/historias-clinicas" && (
        <ClinicalNotesPage {...pageProps} />
      )}
      {selectedModule?.path === "/farmacia" && <PharmacyPage {...pageProps} />}
      {selectedModule?.path === "/facturacion" && <BillingPage {...pageProps} />}
      {selectedModule?.path === "/usuarios" && <UsersPage {...pageProps} />}
    </Shell>
  );
}

function Shell({
  auth,
  children,
  onLogout,
  onNavigate,
}: {
  auth: AuthState;
  children: React.ReactNode;
  onLogout: () => void;
  onNavigate: (path: string) => void;
}) {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <button className="brand-button" onClick={() => onNavigate("/")}>
          <span>CP</span>
          <strong>ClinicaProNV</strong>
        </button>

        <nav>
          {modules
            .filter((module) => module.roles.includes(auth.role))
            .map((module) => (
              <button key={module.path} onClick={() => onNavigate(module.path)}>
                {module.title}
              </button>
            ))}
        </nav>
      </aside>

      <main className="content">
        <header className="topbar">
          <div>
            <strong>{auth.email}</strong>
            <span>{auth.role}</span>
          </div>
          <button className="danger-button" onClick={onLogout}>
            Cerrar sesión
          </button>
        </header>

        {children}
      </main>
    </div>
  );
}

export default App;
