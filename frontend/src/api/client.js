import { getToken, clearSession } from "../utils/session";

const SERVER_DOWN_MESSAGE =
  "Could not reach the server. Is the backend running?";

const send = async (path, { method = "GET", body, headers = {} } = {}) => {
  const token = getToken();

  let response;
  try {
    response = await fetch(`/api${path}`, {
      method,
      headers: {
        ...(body !== undefined && { "Content-Type": "application/json" }),
        ...(token && { Authorization: `Bearer ${token}` }),
        ...headers,
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new Error(SERVER_DOWN_MESSAGE);
  }

  if (response.status === 401 && token) {
    clearSession();
    window.location.href = "/login?expired=true";
  }

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    // 502, 503 and 504 come from the dev proxy when the backend is not running.
    if (!data.message && response.status >= 502) {
      throw new Error(SERVER_DOWN_MESSAGE);
    }
    throw new Error(
      data.message || `Request failed with status ${response.status}`,
    );
  }
  return response;
};

const request = async (path, options) => {
  const response = await send(path, options);
  return response.json().catch(() => ({}));
};

const download = async (path, fallbackName) => {
  const response = await send(path);
  const fileName =
    response.headers
      .get("Content-Disposition")
      ?.match(/filename="(.+)"/)?.[1] ?? fallbackName;
  const fileUrl = URL.createObjectURL(await response.blob());
  const link = document.createElement("a");
  link.href = fileUrl;
  link.download = fileName;
  link.click();
  // Free the file's memory once the browser has started the download.
  setTimeout(() => URL.revokeObjectURL(fileUrl), 1000);
};

const toQuery = (params) => {
  const query = new URLSearchParams();
  for (const [name, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") {
      query.set(name, value);
    }
  }
  const text = query.toString();
  return text ? `?${text}` : "";
};

export { request, download, toQuery };
