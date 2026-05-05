import { useEffect, useState } from "react";
import { apiRequest } from "../api/api";

type User = {
  id: string;
  email: string;
  isActive: boolean;
  createdAtUtc: string;
  roles: string[];
};

type Role = {
  id: string;
  name: string;
};

type UsersPageProps = {
  onBack: () => void;
};

export function UsersPage({ onBack }: UsersPageProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedRoles, setSelectedRoles] = useState<Record<string, string>>({});
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState("Recepcion");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function loadData() {
    try {
      setLoading(true);
      setMessage("");

      const usersData = await apiRequest<User[]>("/admin/users");
      const rolesData = await apiRequest<Role[]>("/admin/roles");

      setUsers(usersData);
      setRoles(rolesData);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Error al cargar usuarios y roles");
    } finally {
      setLoading(false);
    }
  }

  function handleRoleChange(userId: string, roleName: string) {
    setSelectedRoles((current) => ({
      ...current,
      [userId]: roleName,
    }));
  }

  async function handleAssignRole(userId: string) {
    const roleName = selectedRoles[userId];

    if (!roleName) {
      setMessage("Seleccione un rol para asignar.");
      return;
    }

    try {
      setMessage("Asignando rol...");

      await apiRequest<void>(
        `/admin/users/${userId}/assign-role/${encodeURIComponent(roleName)}`,
        {
          method: "POST",
        }
      );

      setMessage("Rol asignado correctamente.");
      await loadData();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Error al asignar rol");
    }
  }

  async function handleCreateUser(event: React.FormEvent) {
    event.preventDefault();

    if (!newEmail.trim()) {
      setMessage("Ingrese el correo del usuario.");
      return;
    }

    if (newPassword.length < 6) {
      setMessage("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    try {
      setSaving(true);
      setMessage("Creando usuario...");

      await apiRequest<void>("/admin/users", {
        method: "POST",
        body: JSON.stringify({
          email: newEmail,
          password: newPassword,
          role: newRole,
        }),
      });

      setNewEmail("");
      setNewPassword("");
      setNewRole("Recepcion");
      setMessage("Usuario creado correctamente.");
      await loadData();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Error al crear usuario");
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleUser(user: User) {
    try {
      setMessage(user.isActive ? "Desactivando usuario..." : "Activando usuario...");

      await apiRequest<void>(
        `/admin/users/${user.id}/${user.isActive ? "deactivate" : "activate"}`,
        { method: "POST" }
      );

      setMessage(user.isActive ? "Usuario desactivado." : "Usuario activado.");
      await loadData();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Error al cambiar estado");
    }
  }

  async function handleRemoveRole(userId: string, roleName: string) {
    const confirmed = window.confirm(`¿Quitar rol ${roleName} de este usuario?`);

    if (!confirmed) {
      return;
    }

    try {
      setMessage("Quitando rol...");

      await apiRequest<void>(
        `/admin/users/${userId}/roles/${encodeURIComponent(roleName)}`,
        { method: "DELETE" }
      );

      setMessage("Rol quitado correctamente.");
      await loadData();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Error al quitar rol");
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  return (
    <main style={styles.page}>
      <section style={styles.header}>
        <div>
          <h1 style={styles.title}>Usuarios</h1>
          <p style={styles.subtitle}>Gestión de roles y accesos del sistema</p>
        </div>

        <button style={styles.backButton} onClick={onBack}>
          Volver
        </button>
      </section>

      <section style={styles.card}>
        <h2 style={styles.sectionTitle}>Crear usuario</h2>

        <form style={styles.form} onSubmit={handleCreateUser}>
          <label style={styles.label}>
            Correo
            <input
              style={styles.input}
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              type="email"
              placeholder="usuario@clinica.com"
            />
          </label>

          <label style={styles.label}>
            Contraseña
            <input
              style={styles.input}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              type="password"
              placeholder="Mínimo 6 caracteres"
            />
          </label>

          <label style={styles.label}>
            Rol inicial
            <select
              style={styles.input}
              value={newRole}
              onChange={(e) => setNewRole(e.target.value)}
            >
              {roles.map((role) => (
                <option key={role.id} value={role.name}>
                  {role.name}
                </option>
              ))}
            </select>
          </label>

          <button style={styles.assignButton} type="submit" disabled={saving}>
            {saving ? "Creando..." : "Crear usuario"}
          </button>
        </form>
      </section>

      <section style={styles.card}>
        <h2 style={styles.sectionTitle}>Listado de usuarios</h2>

        {loading && <p>Cargando usuarios y roles...</p>}

        {message && <p style={styles.message}>{message}</p>}

        {!loading && users.length === 0 && <p>No hay usuarios registrados.</p>}

        {!loading && users.length > 0 && (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Correo</th>
                <th style={styles.th}>Estado</th>
                <th style={styles.th}>Roles actuales</th>
                <th style={styles.th}>Fecha registro</th>
                <th style={styles.th}>Rol a asignar</th>
                <th style={styles.th}>Acciones</th>
              </tr>
            </thead>

            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td style={styles.td}>{user.email}</td>

                  <td style={styles.td}>{user.isActive ? "Activo" : "Inactivo"}</td>

                  <td style={styles.td}>
                    <div style={styles.roleList}>
                      {user.roles.length === 0 && <span>Sin roles</span>}
                      {user.roles.map((roleName) => (
                        <button
                          key={roleName}
                          style={styles.roleBadge}
                          onClick={() => handleRemoveRole(user.id, roleName)}
                          title="Quitar rol"
                        >
                          {roleName} ×
                        </button>
                      ))}
                    </div>
                  </td>

                  <td style={styles.td}>
                    {new Date(user.createdAtUtc).toLocaleString()}
                  </td>

                  <td style={styles.td}>
                    <select
                      style={styles.input}
                      value={selectedRoles[user.id] ?? ""}
                      onChange={(e) => handleRoleChange(user.id, e.target.value)}
                    >
                      <option value="">Seleccione rol</option>

                      {roles.map((role) => (
                        <option key={role.id} value={role.name}>
                          {role.name}
                        </option>
                      ))}
                    </select>
                  </td>

                  <td style={styles.td}>
                    <div style={styles.actions}>
                      <button
                        style={styles.assignButton}
                        onClick={() => handleAssignRole(user.id)}
                      >
                        Asignar rol
                      </button>

                      <button
                        style={user.isActive ? styles.deactivateButton : styles.activateButton}
                        onClick={() => handleToggleUser(user)}
                      >
                        {user.isActive ? "Desactivar" : "Activar"}
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
  message: {
    marginTop: "16px",
    color: "#0f766e",
    fontWeight: "bold",
    textAlign: "center",
  },
  form: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr auto",
    gap: "16px",
    alignItems: "end",
  },
  label: {
    display: "grid",
    gap: "8px",
    color: "#374151",
    fontSize: "14px",
    fontWeight: "bold",
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
  input: {
    width: "100%",
    padding: "10px",
    border: "1px solid #d1d5db",
    borderRadius: "10px",
    fontSize: "14px",
    background: "white",
    color: "#111827",
  },
  assignButton: {
    padding: "9px 12px",
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
  roleList: {
    display: "flex",
    gap: "6px",
    flexWrap: "wrap",
  },
  roleBadge: {
    padding: "6px 8px",
    border: "none",
    borderRadius: "999px",
    background: "#ecfdf5",
    color: "#065f46",
    fontWeight: "bold",
    cursor: "pointer",
  },
  activateButton: {
    padding: "9px 12px",
    border: "none",
    borderRadius: "8px",
    background: "#0f766e",
    color: "white",
    fontWeight: "bold",
    cursor: "pointer",
  },
  deactivateButton: {
    padding: "9px 12px",
    border: "none",
    borderRadius: "8px",
    background: "#b91c1c",
    color: "white",
    fontWeight: "bold",
    cursor: "pointer",
  },
};
