// SPDX-License-Identifier: AGPL-3.0-only
import { beforeEach, describe, expect, it, vi } from "vitest";

const authMock = vi.fn();
const findUniqueMock = vi.fn();
const redirectMock = vi.fn((url: string) => {
  throw new Error(`REDIRECT:${url}`);
});

vi.mock("@/lib/auth", () => ({ auth: () => authMock() }));
vi.mock("@/lib/db", () => ({
  db: { admin: { findUnique: (args: unknown) => findUniqueMock(args) } },
}));
vi.mock("next/navigation", () => ({ redirect: (url: string) => redirectMock(url) }));

const { requireAdminApi, requireAdminPage } = await import("../require-admin");

const activeEditor = {
  id: "a1",
  email: "editor@example.org",
  name: "Editor",
  role: "EDITOR",
  isActive: true,
};

beforeEach(() => {
  authMock.mockReset();
  findUniqueMock.mockReset();
  redirectMock.mockClear();
});

describe("requireAdminApi", () => {
  it("(a) returns 401 without a session", async () => {
    authMock.mockResolvedValue(null);
    const guard = await requireAdminApi();
    expect(guard.ok).toBe(false);
    if (!guard.ok) expect(guard.response.status).toBe(401);
    expect(findUniqueMock).not.toHaveBeenCalled();
  });

  it("(b) returns 401 for a session-like object without user", async () => {
    authMock.mockResolvedValue({ message: "There was a problem with the server configuration." });
    const guard = await requireAdminApi();
    expect(guard.ok).toBe(false);
    if (!guard.ok) expect(guard.response.status).toBe(401);
    expect(findUniqueMock).not.toHaveBeenCalled();
  });

  it("returns 401 when auth() throws", async () => {
    authMock.mockRejectedValue(new Error("UntrustedHost"));
    const guard = await requireAdminApi();
    expect(guard.ok).toBe(false);
    if (!guard.ok) expect(guard.response.status).toBe(401);
  });

  it("returns 401 for a user without a string email", async () => {
    authMock.mockResolvedValue({ user: { email: 42 } });
    const guard = await requireAdminApi();
    expect(guard.ok).toBe(false);
    if (!guard.ok) expect(guard.response.status).toBe(401);
  });

  it("(c) returns 401 when the admin is deactivated in the DB", async () => {
    authMock.mockResolvedValue({ user: { email: activeEditor.email } });
    findUniqueMock.mockResolvedValue({ ...activeEditor, isActive: false });
    const guard = await requireAdminApi();
    expect(guard.ok).toBe(false);
    if (!guard.ok) expect(guard.response.status).toBe(401);
  });

  it("returns 401 when the admin no longer exists", async () => {
    authMock.mockResolvedValue({ user: { email: activeEditor.email } });
    findUniqueMock.mockResolvedValue(null);
    const guard = await requireAdminApi();
    expect(guard.ok).toBe(false);
    if (!guard.ok) expect(guard.response.status).toBe(401);
  });

  it("(d) returns 403 for an EDITOR when SUPER_ADMIN is required, even if the token claims otherwise", async () => {
    authMock.mockResolvedValue({ user: { email: activeEditor.email, role: "SUPER_ADMIN" } });
    findUniqueMock.mockResolvedValue(activeEditor);
    const guard = await requireAdminApi({ role: "SUPER_ADMIN" });
    expect(guard.ok).toBe(false);
    if (!guard.ok) expect(guard.response.status).toBe(403);
  });

  it("(e) returns the admin for an active admin", async () => {
    authMock.mockResolvedValue({ user: { email: activeEditor.email } });
    findUniqueMock.mockResolvedValue(activeEditor);
    const guard = await requireAdminApi();
    expect(guard).toEqual({
      ok: true,
      admin: { id: "a1", email: activeEditor.email, name: "Editor", role: "EDITOR" },
    });
    expect(findUniqueMock).toHaveBeenCalledWith(
      expect.objectContaining({ where: { email: activeEditor.email } }),
    );
  });

  it("allows an active SUPER_ADMIN when the role is required", async () => {
    authMock.mockResolvedValue({ user: { email: "boss@example.org" } });
    findUniqueMock.mockResolvedValue({ ...activeEditor, email: "boss@example.org", role: "SUPER_ADMIN" });
    const guard = await requireAdminApi({ role: "SUPER_ADMIN" });
    expect(guard.ok).toBe(true);
  });
});

describe("requireAdminPage", () => {
  it("redirects to the login page without a valid admin", async () => {
    authMock.mockResolvedValue({ message: "error" });
    await expect(requireAdminPage()).rejects.toThrow("REDIRECT:/admin/login");
  });

  it("redirects to the dashboard when the role is missing", async () => {
    authMock.mockResolvedValue({ user: { email: activeEditor.email } });
    findUniqueMock.mockResolvedValue(activeEditor);
    await expect(requireAdminPage({ role: "SUPER_ADMIN" })).rejects.toThrow(/^REDIRECT:\/admin$/);
  });

  it("returns the admin when allowed", async () => {
    authMock.mockResolvedValue({ user: { email: activeEditor.email } });
    findUniqueMock.mockResolvedValue(activeEditor);
    await expect(requireAdminPage()).resolves.toMatchObject({ id: "a1", role: "EDITOR" });
    expect(redirectMock).not.toHaveBeenCalled();
  });
});
