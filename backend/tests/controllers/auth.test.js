jest.mock("../../models", () => ({
  User: { create: jest.fn(), findOne: jest.fn() },
}));
jest.mock("../../db/redis", () => ({
  get: jest.fn(),
  ttl: jest.fn(),
  del: jest.fn(),
  multi: jest.fn(),
}));
jest.mock("../../utils/session", () => ({
  SESSION_MAX_SECONDS: 12 * 60 * 60,
  createSession: jest.fn(),
  deleteSession: jest.fn(),
}));
jest.mock("../../utils/logger", () => ({ redisLogger: { warn: jest.fn() } }));

const bcrypt = require("bcrypt");
const { User } = require("../../models");
const redis = require("../../db/redis");
const { signup, login } = require("../../controllers/auth");

const fakeRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.set = jest.fn().mockReturnValue(res);
  return res;
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe("signup", () => {
  test("creates a customer with a hashed password", async () => {
    const req = {
      body: {
        name: " Priya ",
        email: "Priya@Example.com",
        password: "Passw0rd1",
      },
    };
    const res = fakeRes();

    await signup(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      message: "User created successfully",
    });

    const savedUser = User.create.mock.calls[0][0];
    expect(savedUser.name).toBe("Priya");
    expect(savedUser.email).toBe("priya@example.com");
    expect(savedUser.role).toBe("user");
    expect(savedUser.password).not.toBe("Passw0rd1");
    expect(await bcrypt.compare("Passw0rd1", savedUser.password)).toBe(true);
  });
});

describe("login", () => {
  test("refuses a wrong password and counts the failed attempt", async () => {
    User.findOne.mockResolvedValue({
      id: 7,
      name: "Priya",
      email: "priya@example.com",
      role: "user",
      password: await bcrypt.hash("Passw0rd1", 4),
    });
    redis.get.mockResolvedValue(null);
    const multi = {
      incr: jest.fn().mockReturnThis(),
      expire: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue([1]),
    };
    redis.multi.mockReturnValue(multi);

    const req = {
      ip: "1.2.3.4",
      body: { email: "priya@example.com", password: "WrongPass1" },
    };
    const res = fakeRes();

    await login(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: "Invalid credentials" });
    expect(multi.incr).toHaveBeenCalledWith(
      "failed_logins:1.2.3.4:priya@example.com",
    );
  });
});
