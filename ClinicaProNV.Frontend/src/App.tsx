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
  mustChangePassword: boolean;
  temporaryPasswordExpiresAtUtc?: string | null;
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
  icon: string;
};

const modules: ModuleDefinition[] = [
  {
    path: "/dashboard",
    title: "Dashboard",
    description: "Ventas del día, rankings y accesos rápidos.",
    roles: ["Admin", "Cajero", "Farmacia"],
    icon: "▦",
  },
  {
    path: "/pacientes",
    title: "Pacientes",
    description: "Datos personales, búsqueda y expediente.",
    roles: ["Admin", "Recepcion", "Doctor", "Enfermeria"],
    icon: "+",
  },
  {
    path: "/doctores",
    title: "Doctores",
    description: "Médicos, especialidades y disponibilidad base.",
    roles: ["Admin", "Recepcion"],
    icon: "DR",
  },
  {
    path: "/citas",
    title: "Citas",
    description: "Agenda, estados y cambios de horario.",
    roles: ["Admin", "Recepcion", "Doctor", "Enfermeria"],
    icon: "□",
  },
  {
    path: "/historias-clinicas",
    title: "Historias clínicas",
    description: "Notas de consulta e historial por paciente.",
    roles: ["Admin", "Doctor", "Enfermeria"],
    icon: "HC",
  },
  {
    path: "/farmacia",
    title: "Farmacia",
    description: "Inventario, stock y venta de medicamentos.",
    roles: ["Admin", "Farmacia"],
    icon: "Rx",
  },
  {
    path: "/facturacion",
    title: "Facturación",
    description: "Facturas clínicas, detalle e impresión.",
    roles: ["Admin", "Cajero"],
    icon: "$",
  },
  {
    path: "/usuarios",
    title: "Usuarios",
    description: "Altas, roles y estado de acceso.",
    roles: ["Admin"],
    icon: "U",
  },
];

const authAccessItems = [
  {
    label: "Pacientes",
    description: "Recepción, médico o enfermería",
    roles: ["Admin", "Recepcion", "Doctor", "Enfermeria"],
  },
  {
    label: "Farmacia",
    description: "Inventario y ventas",
    roles: ["Admin", "Farmacia"],
  },
  {
    label: "Reportes",
    description: "Indicadores y control",
    roles: ["Admin", "Cajero", "Farmacia"],
  },
  {
    label: "Caja",
    description: "Cobros y facturación",
    roles: ["Admin", "Cajero"],
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
  const [authMode, setAuthMode] = useState<"login" | "forceChange">("login");
  const [pendingAuth, setPendingAuth] = useState<AuthResponse | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [currentTemporaryPassword, setCurrentTemporaryPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [selectedAccess, setSelectedAccess] = useState(authAccessItems[0]);
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
    setMessage("Iniciando sesión...");

    try {
      const data = await apiRequest<AuthResponse>("/Auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });

      if (
        selectedAccess &&
        !selectedAccess.roles.includes(data.role)
      ) {
        setMessage(`Este usuario tiene rol ${data.role}. Debe ingresar por ${selectedAccess.label}.`);
        return;
      }

      if (data.mustChangePassword) {
        setPendingAuth(data);
        setCurrentTemporaryPassword(password);
        setAuthMode("forceChange");
        setMessage("Tu clave es temporal. Crea una contraseña personal para continuar.");
        return;
      }

      persistAuth(data);
      setEmail("");
      setPassword("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Error desconocido");
    }
  }

  async function handleChangeTemporaryPassword(event: React.FormEvent) {
    event.preventDefault();

    if (!pendingAuth) {
      setAuthMode("login");
      setMessage("Vuelve a iniciar sesión con la clave temporal.");
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setMessage("La confirmación no coincide con la nueva contraseña.");
      return;
    }

    setMessage("Guardando contraseña personal...");

    try {
      await apiRequest<void>("/Auth/change-my-temporary-password", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${pendingAuth.token}`,
        },
        body: JSON.stringify({
          currentPassword: currentTemporaryPassword,
          newPassword,
        }),
      });

      persistAuth({ ...pendingAuth, mustChangePassword: false });
      setPassword("");
      setCurrentTemporaryPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
      setPendingAuth(null);
      setAuthMode("login");
      setEmail("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Error al cambiar contraseña");
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
        <section className="auth-stage">
          <div className="auth-welcome">
            <img className="auth-welcome-logo" src="/clininova-logo.png" alt="CLININOVA" />
            <h1>Bienvenido</h1>
            <p>Sistema integral de gestión clínica</p>

            <div className="auth-feature-grid" aria-label="Módulos principales">
              {authAccessItems.map((item) => (
                <button
                  key={item.label}
                  className={selectedAccess.label === item.label ? "active" : ""}
                  type="button"
                  onClick={() => {
                    setSelectedAccess(item);
                    setAuthMode("login");
                    setPendingAuth(null);
                    setMessage("");
                  }}
                >
                  <strong>{item.label}</strong>
                  <small>{item.description}</small>
                </button>
              ))}
            </div>
          </div>

          <section className="auth-card">
            <img className="auth-logo" src="/clininova-logo.png" alt="CLININOVA" />
            <h2>
              {authMode === "login"
                ? `Ingreso ${selectedAccess.label}`
                : "Crear contraseña personal"}
            </h2>
            <p>
              {authMode === "login"
                ? "Accede con el usuario y la clave entregada por el sistema"
                : `La clave temporal vence ${pendingAuth?.temporaryPasswordExpiresAtUtc ? new Date(pendingAuth.temporaryPasswordExpiresAtUtc).toLocaleTimeString() : "en pocos minutos"}`}
            </p>

            {authMode === "login" && (
            <form onSubmit={handleAuth} className="stack-form">
              <label>
                Correo electrónico
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
                  autoComplete="current-password"
                  required
                />
              </label>

              <button className="primary-button" type="submit">
                Iniciar sesión
              </button>
            </form>
            )}

            {authMode === "forceChange" && (
            <form onSubmit={handleChangeTemporaryPassword} className="stack-form">
              <label>
                Usuario
                <input
                  value={pendingAuth?.email ?? email}
                  type="email"
                  readOnly
                  required
                />
              </label>

              <label>
                Nueva contraseña personal
                <input
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  type="password"
                  autoComplete="new-password"
                  minLength={6}
                  required
                />
              </label>

              <label>
                Confirmar nueva contraseña
                <input
                  value={confirmNewPassword}
                  onChange={(event) => setConfirmNewPassword(event.target.value)}
                  type="password"
                  autoComplete="new-password"
                  minLength={6}
                  required
                />
              </label>

              <button className="primary-button" type="submit">
                Entrar con mi nueva contraseña
              </button>
            </form>
            )}

            {message && <p className="form-message">{message}</p>}
          </section>
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
      <Shell auth={auth} currentRoute={route} onLogout={handleLogout} onNavigate={navigate}>
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
    <Shell auth={auth} currentRoute={route} onLogout={handleLogout} onNavigate={navigate}>
      {route === "/" && (
        <>
          <WorkflowOverview role={auth.role} onNavigate={navigate} />

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

const patientFlowSteps = [
  {
    title: "Recepción",
    detail: "Buscar por cédula, registrar si no existe y generar código de espera.",
    path: "/pacientes",
    roles: ["Admin", "Recepcion"],
  },
  {
    title: "Triaje",
    detail: "Enfermería toma signos vitales y deja listo el paciente para consulta.",
    path: "/historias-clinicas",
    roles: ["Admin", "Enfermeria"],
  },
  {
    title: "Asignación",
    detail: "El sistema asigna doctor y el médico llama al paciente.",
    path: "/citas",
    roles: ["Admin", "Recepcion", "Doctor", "Enfermeria"],
  },
  {
    title: "Consulta médica",
    detail: "Registrar dolencias, diagnóstico, tratamiento e historia clínica.",
    path: "/historias-clinicas",
    roles: ["Admin", "Doctor"],
  },
  {
    title: "Receta",
    detail: "El doctor genera la receta y queda asociada a la cédula del paciente.",
    path: "/historias-clinicas",
    roles: ["Admin", "Doctor"],
  },
  {
    title: "Farmacia",
    detail: "Buscar por cédula, ver receta, entregar o imprimir medicamentos.",
    path: "/farmacia",
    roles: ["Admin", "Farmacia"],
  },
  {
    title: "Finalización",
    detail: "Cerrar la atención cuando farmacia o caja completan el proceso.",
    path: "/facturacion",
    roles: ["Admin", "Cajero", "Farmacia"],
  },
];

function WorkflowOverview({
  role,
  onNavigate,
}: {
  role: string;
  onNavigate: (path: string) => void;
}) {
  return (
    <section className="workflow-panel" aria-label="Flujo de atención del paciente">
      <div className="workflow-head">
        <div>
          <span>Flujo de atención</span>
          <h1>Paciente desde recepción hasta farmacia</h1>
        </div>
      </div>

      <div className="workflow-steps">
        {patientFlowSteps.map((step, index) => (
          <article className="workflow-step" key={step.title}>
            <span className="workflow-number">{index + 1}</span>
            <div>
              <h2>{step.title}</h2>
              <p>{step.detail}</p>
            </div>
            {step.roles.includes(role) ? (
              <button type="button" onClick={() => onNavigate(step.path)}>
                Abrir
              </button>
            ) : (
              <span className="workflow-role-note">Otro rol</span>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}

function Shell({
  auth,
  children,
  currentRoute,
  onLogout,
  onNavigate,
}: {
  auth: AuthState;
  children: React.ReactNode;
  currentRoute: string;
  onLogout: () => void;
  onNavigate: (path: string) => void;
}) {
  const [menuExpanded, setMenuExpanded] = useState(true);
  const allowedModules = modules.filter((module) => module.roles.includes(auth.role));

  return (
    <div className={`app-shell ${menuExpanded ? "" : "menu-collapsed"}`}>
      <aside className="sidebar" aria-label="Menú principal">
        <div className="sidebar-head">
          <button className="brand-button" onClick={() => onNavigate("/")}>
            <img src="/clininova-logo.png" alt="" />
            <span>
              <strong>CLININOVA</strong>
              <small>Gestión clínica</small>
            </span>
          </button>

          <button
            className="menu-toggle"
            type="button"
            aria-label={menuExpanded ? "Contraer menú" : "Desplegar menú"}
            onClick={() => setMenuExpanded((current) => !current)}
          >
            {menuExpanded ? "‹" : "›"}
          </button>
        </div>

        <nav>
          {allowedModules.map((module) => (
            <button
              key={module.path}
              className={currentRoute === module.path ? "active" : ""}
              onClick={() => onNavigate(module.path)}
              title={module.title}
            >
              <span className="nav-icon">{module.icon}</span>
              <span className="nav-copy">
                <strong>{module.title}</strong>
                <small>{module.description}</small>
              </span>
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
