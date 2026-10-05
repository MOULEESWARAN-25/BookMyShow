import { request } from "./client";

const listAdmins = () => request("/super-admin/admins");

const createAdmin = (admin) => request("/super-admin/admins", { method: "POST", body: admin });

const updateAdmin = (adminId, admin) =>
  request(`/super-admin/admins/${adminId}`, { method: "PATCH", body: admin });

const deleteAdmin = (adminId) => request(`/super-admin/admins/${adminId}`, { method: "DELETE" });

const signOutAdmin = (adminId) =>
  request(`/super-admin/admins/${adminId}/revoke-sessions`, { method: "POST" });

export { listAdmins, createAdmin, updateAdmin, deleteAdmin, signOutAdmin };
