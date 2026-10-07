import { afterEach, describe, expect, it, vi } from "vitest";
import { requireAdminAuthentication, requireRole, ROLES } from "./rbac.js";

afterEach(() => vi.unstubAllEnvs());

function responseMock() {
  const response = {
    statusCode: 200,
    body: null,
    headers: {},
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
    type() {
      return this;
    },
    send(body) {
      this.body = body;
      return this;
    },
    setHeader(name, value) {
      this.headers[name] = value;
      return this;
    },
  };
  return response;
}

function adminRequest(identity, password, ip) {
  const authorization = `Basic ${Buffer.from(`${identity}:${password}`).toString("base64")}`;
  return {
    ip,
    socket: { remoteAddress: ip },
    get(name) {
      return name.toLowerCase() === "authorization" ? authorization : "";
    },
  };
}

describe("role-based access control", () => {
  it("allows an authenticated administrator through the admin role guard", () => {
    const next = vi.fn();
    const response = responseMock();

    requireRole(ROLES.ADMIN)({ auth: { role: ROLES.ADMIN } }, response, next);

    expect(next).toHaveBeenCalledOnce();
    expect(response.statusCode).toBe(200);
  });

  it("rejects customer and anonymous principals from admin-only routes", () => {
    const next = vi.fn();
    const forbidden = responseMock();
    const unauthorized = responseMock();

    requireRole(ROLES.ADMIN)({ auth: { role: ROLES.CUSTOMER } }, forbidden, next);
    requireRole(ROLES.ADMIN)({}, unauthorized, next);

    expect(forbidden.statusCode).toBe(403);
    expect(unauthorized.statusCode).toBe(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("requires real credentials in development and accepts both configured identifiers", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("ADMIN_EMAIL", "admin@example.test");
    vi.stubEnv("ADMIN_PHONE", "081234567890");
    vi.stubEnv("ADMIN_USERNAME", "");
    vi.stubEnv("ADMIN_PASSWORD", "A-long-admin-password-2026!");

    for (const [index, identity] of ["admin@example.test", "+6281234567890"].entries()) {
      const request = adminRequest(identity, "A-long-admin-password-2026!", `rbac-test-${index}`);
      const response = responseMock();
      const next = vi.fn();

      requireAdminAuthentication(request, response, next);

      expect(next).toHaveBeenCalledOnce();
      expect(request.auth).toEqual({ role: ROLES.ADMIN, subject: identity });
      expect(request.adminName).toBe(identity);
    }
  });

  it("fails closed when admin credentials are missing or invalid", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("ADMIN_EMAIL", "");
    vi.stubEnv("ADMIN_PHONE", "");
    vi.stubEnv("ADMIN_NUMBER", "");
    vi.stubEnv("ADMIN_USERNAME", "");
    vi.stubEnv("ADMIN_PASSWORD", "");
    const noCredentials = responseMock();
    const noCredentialsNext = vi.fn();
    requireAdminAuthentication(
      adminRequest("admin", "password", "rbac-no-config"),
      noCredentials,
      noCredentialsNext,
    );
    expect(noCredentials.statusCode).toBe(503);
    expect(noCredentialsNext).not.toHaveBeenCalled();

    vi.stubEnv("ADMIN_EMAIL", "admin@example.test");
    vi.stubEnv("ADMIN_PASSWORD", "A-long-admin-password-2026!");
    const invalid = responseMock();
    const invalidNext = vi.fn();
    requireAdminAuthentication(
      adminRequest("admin@example.test", "wrong-password", "rbac-invalid"),
      invalid,
      invalidNext,
    );
    expect(invalid.statusCode).toBe(401);
    expect(invalid.headers["WWW-Authenticate"]).toContain("Basic");
    expect(invalidNext).not.toHaveBeenCalled();
  });
});
