import { useEffect, useState } from "react";

// Runs a create, update or delete request and keeps its result message.
// Every admin page needs this, so it lives here once instead of being copied.
const useAction = () => {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  // Success messages hide themselves after a few seconds; errors stay until closed.
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => setMessage(""), 4000);
    return () => clearTimeout(timer);
  }, [message]);

  const run = async (action) => {
    setMessage("");
    setError("");
    setBusy(true);
    try {
      const data = await action();
      setMessage(data.message);
      return data;
    } catch (error) {
      setError(error.message);
      return null;
    } finally {
      setBusy(false);
    }
  };

  const clear = () => {
    setMessage("");
    setError("");
  };

  return { message, error, busy, run, setMessage, setError, clear };
};

export default useAction;
