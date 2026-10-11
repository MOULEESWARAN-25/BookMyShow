import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Building2, CalendarDays, Pencil, Plus, Save, Trash2, X } from "lucide-react";
import { createTheatre, listMyTheatres, updateTheatre, deleteTheatre } from "../../api/theatre";
import useAction from "../../hooks/useAction";
import Loading from "../../components/Loading";
import Message from "../../components/Message";
import Toasts from "../../components/Toasts";

const Theatres = () => {
  const [theatres, setTheatres] = useState([]);
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const { message, error, busy, run, clear } = useAction();

  const loadTheatres = async () => {
    try {
      const data = await listMyTheatres();
      setTheatres(data.theatres);
      setLoadError("");
    } catch (error) {
      setLoadError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTheatres();
  }, []);

  const handleCreate = async (event) => {
    event.preventDefault();
    const data = await run(() => createTheatre(name, city));
    if (data) {
      setName("");
      setCity("");
      await loadTheatres();
    }
  };

  const handleSave = async () => {
    const data = await run(() => updateTheatre(editing.id, editing.name, editing.city));
    if (data) {
      setEditing(null);
      await loadTheatres();
    }
  };

  const handleDelete = async (theatre) => {
    if (!window.confirm(`Delete ${theatre.name}?`)) return;

    const data = await run(() => deleteTheatre(theatre.id));
    if (data) {
      await loadTheatres();
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1>My theatres</h1>
        <p className="muted">Add your theatres, then open one to manage its shows and seats.</p>
      </div>

      <div className="panel">
        <h3 className="icon-text">
          <Plus /> Add a theatre
        </h3>
        <form onSubmit={handleCreate} className="search-bar">
          <input placeholder="Theatre name" value={name} onChange={(event) => setName(event.target.value)} required />
          <input placeholder="City" value={city} onChange={(event) => setCity(event.target.value)} required />
          <button type="submit" disabled={busy}>
            <Plus /> Add theatre
          </button>
        </form>
      </div>

      <h2 className="icon-text">
        <Building2 /> Your theatres
      </h2>
      {loading && <Loading />}
      {loadError && <Message type="error">{loadError}</Message>}
      {!loading && !loadError && theatres.length === 0 && (
        <div className="empty-state">
          <Building2 />
          <p>You have no theatres yet. Add your first one above.</p>
        </div>
      )}

      {theatres.length > 0 && (
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>City</th>
              <th className="number">Upcoming shows</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {theatres.map((theatre) =>
              editing?.id === theatre.id ? (
                <tr key={theatre.id}>
                  <td>
                    <input
                      value={editing.name}
                      onChange={(event) => setEditing({ ...editing, name: event.target.value })}
                    />
                  </td>
                  <td>
                    <input
                      value={editing.city}
                      onChange={(event) => setEditing({ ...editing, city: event.target.value })}
                    />
                  </td>
                  <td className="number">{theatre.upcomingShows}</td>
                  <td className="actions">
                    <button onClick={handleSave} disabled={busy}>
                      <Save /> Save
                    </button>
                    <button className="secondary" onClick={() => setEditing(null)}>
                      <X /> Cancel
                    </button>
                  </td>
                </tr>
              ) : (
                <tr key={theatre.id}>
                  <td>{theatre.name}</td>
                  <td>{theatre.city}</td>
                  <td className="number">{theatre.upcomingShows}</td>
                  <td className="actions">
                    <Link to={`/admin/theatres/${theatre.id}`} className="button-link">
                      <CalendarDays /> Shows
                    </Link>
                    <button className="secondary" onClick={() => setEditing(theatre)}>
                      <Pencil /> Edit
                    </button>
                    <button className="danger" onClick={() => handleDelete(theatre)} disabled={busy}>
                      <Trash2 /> Delete
                    </button>
                  </td>
                </tr>
              ),
            )}
          </tbody>
        </table>
      )}

      <Toasts message={message} error={error} onClose={clear} />
    </div>
  );
};

export default Theatres;
