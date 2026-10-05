import { useEffect, useState } from "react";
import { LogOut, Pencil, Plus, ShieldCheck, Trash2, UserCog, X } from "lucide-react";
import { createAdmin, deleteAdmin, listAdmins, signOutAdmin, updateAdmin } from "../../api/superAdmin";
import useAction from "../../hooks/useAction";
import Loading from "../../components/Loading";
import Message from "../../components/Message";
import Toasts from "../../components/Toasts";
import { formatDate } from "../../utils/format";

const EMPTY_FORM = { name: "", email: "", password: "" };

const SuperAdmin = () => {
  const [admins, setAdmins] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const { message, error, busy, run, clear } = useAction();

  const loadAdmins = async () => {
    try {
      const data = await listAdmins();
      setAdmins(data.admins);
      setLoadError("");
    } catch (error) {
      setLoadError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdmins();
  }, []);

  const stopEditing = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const data = await run(() => (editing ? updateAdmin(editing.id, form) : createAdmin(form)));
    if (data) {
      stopEditing();
      await loadAdmins();
    }
  };

  const startEditing = (admin) => {
    setEditing(admin);
    setForm({ name: admin.name, email: admin.email, password: "" });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (admin) => {
    if (!window.confirm(`Delete ${admin.name}'s admin account?`)) return;

    const data = await run(() => deleteAdmin(admin.id));
    if (data) {
      await loadAdmins();
    }
  };

  const handleSignOut = (admin) => {
    if (window.confirm(`Sign ${admin.name} out of every device?`)) {
      run(() => signOutAdmin(admin.id));
    }
  };

  const updateField = (field) => (event) => setForm({ ...form, [field]: event.target.value });

  return (
    <div>
      <div className="page-header">
        <h1>Owner panel</h1>
        <p className="muted">
          Create theatre owner accounts and manage their access.
        </p>
      </div>

      <div className="panel">
        <h3 className="icon-text">
          {editing ? <Pencil /> : <Plus />} {editing ? `Edit ${editing.name}` : "Add a theatre owner"}
        </h3>
        <form className="form grid-form" onSubmit={handleSubmit}>
          <label>
            Name
            <input value={form.name} onChange={updateField("name")} required />
          </label>
          <label>
            Email
            <input type="email" value={form.email} onChange={updateField("email")} required />
          </label>
          <label>
            {editing ? "New password (leave empty to keep it)" : "Password"}
            <input
              type="password"
              value={form.password}
              onChange={updateField("password")}
              required={!editing}
              minLength="8"
            />
          </label>
          <div className="form-actions">
            <button type="submit" disabled={busy}>
              {editing ? <Pencil /> : <Plus />} {editing ? "Save changes" : "Add owner"}
            </button>
            {editing && (
              <button type="button" className="secondary" onClick={stopEditing}>
                <X /> Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="section-header">
        <div>
          <h2 className="icon-text">
            <UserCog /> Theatre owners
          </h2>
          <p className="muted">
            An owner with theatres or movies cannot be deleted, because those keep booking history.
          </p>
        </div>
      </div>
      {loading && <Loading />}
      {loadError && <Message type="error">{loadError}</Message>}
      {!loading && !loadError && admins.length === 0 && (
        <div className="empty-state">
          <ShieldCheck />
          <p>No theatre owners yet. Add the first one above.</p>
        </div>
      )}
      {admins.length > 0 && (
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th className="number">Theatres</th>
              <th className="number">Movies</th>
              <th>Joined</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {admins.map((admin) => {
              const ownsData = admin.theatres > 0 || admin.movies > 0;
              return (
                <tr key={admin.id}>
                  <td>{admin.name}</td>
                  <td>{admin.email}</td>
                  <td className="number">{admin.theatres}</td>
                  <td className="number">{admin.movies}</td>
                  <td>{formatDate(admin.createdAt)}</td>
                  <td className="actions">
                    <button className="secondary" onClick={() => startEditing(admin)}>
                      <Pencil /> Edit
                    </button>
                    <button className="secondary" onClick={() => handleSignOut(admin)} disabled={busy}>
                      <LogOut /> Sign out
                    </button>
                    <button
                      className="danger"
                      onClick={() => handleDelete(admin)}
                      disabled={busy || ownsData}
                    >
                      <Trash2 /> Delete
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      <Toasts message={message} error={error} onClose={clear} />
    </div>
  );
};

export default SuperAdmin;
