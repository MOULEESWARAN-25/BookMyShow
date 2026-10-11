// Where each kind of account starts after logging in.
const HOME_BY_ROLE = {
  user: "/",
  admin: "/admin",
  super_admin: "/super-admin",
};

const homeFor = (role) => HOME_BY_ROLE[role] ?? "/";

export { homeFor };
