import { Fragment, useEffect, useState } from "react";
import { apiRequest } from "../api/api";
import { pageStyles } from "../styles/pageStyles";

type User = {
  id: string;
  email: string;
  phoneNumber: string;
  hasTemporaryPassword: boolean;
  temporaryPasswordExpiresAtUtc?: string | null;
  isActive: boolean;
  createdAtUtc: string;
  roles: string[];
};

type Role = {
  id: string;
  name: string;
};

type CreateUserResponse = User & {
  temporaryPassword?: string;
  whatsAppSent?: boolean;
};

type TemporaryPasswordResponse = User & {
  temporaryPassword?: string;
  whatsAppSent?: boolean;
};

type UsersPageProps = {
  onBack: () => void;
};

const allowedRoleNames = ["Admin", "Recepcion", "Doctor", "Enfermeria", "Farmacia", "Cajero"];

export function UsersPage({ onBack }: UsersPageProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedRoles, setSelectedRoles] = useState<Record<string, string>>({});
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editPhoneNumber, setEditPhoneNumber] = useState("");
  const [editRoles, setEditRoles] = useState<string[]>([]);
  const [newEmail, setNewEmail] = useState("");
  const [newPhoneNumber, setNewPhoneNumber] = useState("");
  const [newRole, setNewRole] = useState("Recepcion");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  function normalizeUser(user: User): User {
    return {
      ...user,
      roles: [...new Set(user.roles.filter((role) => allowedRoleNames.includes(role)))],
    };
  }

  async function loadData() {
    try {
      setLoading(true);
      setMessage("");

      const usersData = await apiRequest<User[]>("/admin/users");
      const rolesData = await apiRequest<Role[]>("/admin/roles");

      setUsers(usersData.map(normalizeUser));
      setRoles(
        rolesData.filter(
          (role, index, current) =>
            allowedRoleNames.includes(role.name) &&
            current.findIndex((item) => item.name === role.name) === index
        )
      );
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

  function handleStartEdit(user: User) {
    setEditingUserId(user.id);
    setEditPhoneNumber(user.phoneNumber ?? "");
    setEditRoles(user.roles);
    setMessage("");
  }

  function handleCancelEdit() {
    setEditingUserId(null);
    setEditPhoneNumber("");
    setEditRoles([]);
  }

  function handleEditRoleToggle(roleName: string) {
    setEditRoles((current) =>
      current.includes(roleName)
        ? current.filter((role) => role !== roleName)
        : [...current, roleName]
    );
  }

  async function handleSaveUser(userId: string) {
    if (!editPhoneNumber.trim()) {
      setMessage("Ingrese el teléfono/WhatsApp del usuario.");
      return;
    }

    if (editRoles.length === 0) {
      setMessage("Seleccione al menos un rol para el usuario.");
      return;
    }

    try {
      setSaving(true);
      setMessage("Guardando cambios...");

      const updated = await apiRequest<User>(`/admin/users/${userId}`, {
        method: "PUT",
        body: JSON.stringify({
          phoneNumber: editPhoneNumber,
          roles: editRoles,
        }),
      });

      setUsers((current) =>
        current.map((user) => (user.id === userId ? normalizeUser(updated) : user))
      );
      handleCancelEdit();
      setMessage("Usuario actualizado correctamente.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Error al actualizar usuario");
    } finally {
      setSaving(false);
    }
  }

  async function handleCreateUser(event: React.FormEvent) {
    event.preventDefault();

    if (!newEmail.trim()) {
      setMessage("Ingrese el correo del usuario.");
      return;
    }

    if (!newPhoneNumber.trim()) {
      setMessage("Ingrese el teléfono/WhatsApp del usuario.");
      return;
    }

    try {
      setSaving(true);
      setMessage("Creando usuario...");

      const created = await apiRequest<CreateUserResponse>("/admin/users", {
        method: "POST",
        body: JSON.stringify({
          email: newEmail,
          phoneNumber: newPhoneNumber,
          role: newRole,
        }),
      });

      setNewEmail("");
      setNewPhoneNumber("");
      setNewRole("Recepcion");
      setMessage(
        created.whatsAppSent
          ? "Usuario creado. La contraseña temporal fue enviada al WhatsApp y vence en 5 minutos."
          : created.temporaryPassword
          ? `Usuario creado. Contraseña temporal: ${created.temporaryPassword}. Vence en 5 minutos.`
          : "Usuario creado, pero no se confirmó el envío por WhatsApp. Revise la configuración de WhatsApp."
      );
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

  async function handleGenerateTemporaryPassword(user: User) {
    const confirmed = window.confirm(
      `¿Generar una nueva contraseña temporal para ${user.email}? La contraseña anterior dejará de funcionar.`
    );

    if (!confirmed) {
      return;
    }

    try {
      setSaving(true);
      setMessage("Generando y enviando contraseña temporal...");

      const updated = await apiRequest<TemporaryPasswordResponse>(
        `/admin/users/${user.id}/temporary-password`,
        { method: "POST" }
      );

      setUsers((current) =>
        current.map((item) => (item.id === user.id ? normalizeUser(updated) : item))
      );

      setMessage(
        updated.whatsAppSent
          ? "Contraseña temporal enviada al WhatsApp. Vence en 5 minutos."
          : updated.temporaryPassword
          ? `No se pudo confirmar WhatsApp. Contraseña temporal: ${updated.temporaryPassword}. Vence en 5 minutos.`
          : "No se pudo confirmar el envío por WhatsApp. Revise la configuración."
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Error al generar contraseña temporal");
    } finally {
      setSaving(false);
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
        <h2 style={styles.sectionTitle}>Crear usuario con contraseña temporal</h2>

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
            WhatsApp
            <input
              style={styles.input}
              value={newPhoneNumber}
              onChange={(e) => setNewPhoneNumber(e.target.value)}
              placeholder="Ej: 593991234567"
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
            {saving ? "Enviando..." : "Crear y enviar clave"}
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
                <th style={styles.th}>WhatsApp</th>
                <th style={styles.th}>Estado</th>
                <th style={styles.th}>Clave temporal</th>
                <th style={styles.th}>Roles actuales</th>
                <th style={styles.th}>Fecha registro</th>
                <th style={styles.th}>Rol a asignar</th>
                <th style={styles.th}>Acciones</th>
              </tr>
            </thead>

            <tbody>
              {users.map((user) => (
                <Fragment key={user.id}>
                  <tr>
                    <td style={styles.td}>{user.email}</td>

                    <td style={styles.td}>{user.phoneNumber || "Sin WhatsApp"}</td>

                    <td style={styles.td}>{user.isActive ? "Activo" : "Inactivo"}</td>

                    <td style={styles.td}>
                      {user.hasTemporaryPassword
                        ? `Vence ${user.temporaryPasswordExpiresAtUtc ? new Date(user.temporaryPasswordExpiresAtUtc).toLocaleTimeString() : ""}`
                        : "Definitiva"}
                    </td>

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
                          style={styles.editButton}
                          onClick={() => handleStartEdit(user)}
                        >
                          Editar
                        </button>

                        <button
                          style={styles.resetButton}
                          onClick={() => handleGenerateTemporaryPassword(user)}
                          disabled={saving}
                        >
                          Enviar clave
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

                  {editingUserId === user.id && (
                    <tr>
                      <td style={styles.editTd} colSpan={8}>
                        <div style={styles.editPanel}>
                          <label style={styles.label}>
                            WhatsApp
                            <input
                              style={styles.input}
                              value={editPhoneNumber}
                              onChange={(e) => setEditPhoneNumber(e.target.value)}
                              placeholder="Ej: 593991234567"
                            />
                          </label>

                          <div style={styles.editRoles}>
                            {roles.map((role) => (
                              <label key={role.id} style={styles.checkLabel}>
                                <input
                                  type="checkbox"
                                  checked={editRoles.includes(role.name)}
                                  onChange={() => handleEditRoleToggle(role.name)}
                                />
                                {role.name}
                              </label>
                            ))}
                          </div>

                          <div style={styles.actions}>
                            <button
                              style={styles.assignButton}
                              onClick={() => handleSaveUser(user.id)}
                              disabled={saving}
                            >
                              {saving ? "Guardando..." : "Guardar"}
                            </button>

                            <button
                              style={styles.secondaryButton}
                              onClick={handleCancelEdit}
                              disabled={saving}
                            >
                              Cancelar
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  ...pageStyles,
  form: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr auto",
    gap: "16px",
    alignItems: "end",
  },
  assignButton: {
    padding: "9px 12px",
    border: "none",
    borderRadius: "8px",
    background: "#0e9384",
    color: "white",
    fontWeight: "bold",
    cursor: "pointer",
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
    background: "#e7f7f4",
    color: "#0b635d",
    fontWeight: "bold",
    cursor: "pointer",
  },
  activateButton: {
    padding: "9px 12px",
    border: "none",
    borderRadius: "8px",
    background: "#0e9384",
    color: "white",
    fontWeight: "bold",
    cursor: "pointer",
  },
  deactivateButton: {
    padding: "9px 12px",
    border: "none",
    borderRadius: "8px",
    background: "#c2413b",
    color: "white",
    fontWeight: "bold",
    cursor: "pointer",
  },
  secondaryButton: {
    padding: "9px 12px",
    border: "none",
    borderRadius: "8px",
    background: "#61757d",
    color: "white",
    fontWeight: "bold",
    cursor: "pointer",
  },
  resetButton: {
    padding: "9px 12px",
    border: "none",
    borderRadius: "8px",
    background: "#0d6eb8",
    color: "white",
    fontWeight: "bold",
    cursor: "pointer",
  },
  editTd: {
    padding: "0 14px 14px 14px",
    borderBottom: "1px solid #d9e8ee",
    background: "#f8fbfc",
  },
  editPanel: {
    display: "grid",
    gridTemplateColumns: "minmax(220px, 1fr) 2fr auto",
    gap: "16px",
    alignItems: "end",
    padding: "16px",
    border: "1px solid #d9e8ee",
    borderRadius: "10px",
    background: "#ffffff",
  },
  editRoles: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
    alignItems: "center",
  },
  checkLabel: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "8px 10px",
    border: "1px solid #c9dce3",
    borderRadius: "8px",
    background: "#f4f9fb",
    color: "#12323f",
    fontWeight: 700,
  },
};
