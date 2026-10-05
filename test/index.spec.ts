import { describe, it, expect, vi } from "vitest";
import worker from "../src/index";

describe("Worker with D1 Database", () => {
	const createMockCtx = () =>
		({
			waitUntil: vi.fn(),
			passThroughOnException: vi.fn(),
		}) as unknown as ExecutionContext;

	describe("GET /", () => {
		it("queries the database and returns users", async () => {
			const mockUsers = [{ id: 1, name: "Diego Romo", email: "diego@ejemplo.com" }];
			const mockDb = {
				prepare: vi.fn().mockReturnValue({
					all: vi.fn().mockResolvedValue({ results: mockUsers }),
				}),
			} as unknown as D1Database;

			const mockEnv = { p6: mockDb };
			const request = new Request("http://example.com/");
			const ctx = createMockCtx();

			const response = await worker.fetch(request, mockEnv, ctx);
			const data = await response.json();

			expect(response.status).toBe(200);
			expect(data).toEqual(mockUsers);
		});
	});

	describe("POST /users", () => {
		it("creates a new user successfully", async () => {
			const newUser = { id: 2, name: "Ana Perez", email: "ana@ejemplo.com" };
			const mockDb = {
				prepare: vi.fn().mockReturnValue({
					bind: vi.fn().mockReturnValue({
						first: vi.fn().mockResolvedValue(newUser),
					}),
				}),
			} as unknown as D1Database;

			const mockEnv = { p6: mockDb };
			const request = new Request("http://example.com/users", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ name: "Ana Perez", email: "ana@ejemplo.com" }),
			});
			const ctx = createMockCtx();

			const response = await worker.fetch(request, mockEnv, ctx);
			const data = (await response.json()) as { success: boolean; user: typeof newUser };

			expect(response.status).toBe(201);
			expect(data.success).toBe(true);
			expect(data.user).toEqual(newUser);
		});

		it("creates a user successfully on root POST /", async () => {
			const newUser = { id: 3, name: "Carlos Lopez", email: "carlos@ejemplo.com" };
			const mockDb = {
				prepare: vi.fn().mockReturnValue({
					bind: vi.fn().mockReturnValue({
						first: vi.fn().mockResolvedValue(newUser),
					}),
				}),
			} as unknown as D1Database;

			const mockEnv = { p6: mockDb };
			const request = new Request("http://example.com/", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ name: "Carlos Lopez", email: "carlos@ejemplo.com" }),
			});
			const ctx = createMockCtx();

			const response = await worker.fetch(request, mockEnv, ctx);
			const data = (await response.json()) as { success: boolean; user: typeof newUser };

			expect(response.status).toBe(201);
			expect(data.success).toBe(true);
			expect(data.user).toEqual(newUser);
		});

		it("returns 400 when name or email is missing", async () => {
			const mockDb = {} as unknown as D1Database;
			const mockEnv = { p6: mockDb };
			const ctx = createMockCtx();

			const requestMissingEmail = new Request("http://example.com/users", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ name: "Diego" }),
			});

			const responseMissingEmail = await worker.fetch(requestMissingEmail, mockEnv, ctx);
			expect(responseMissingEmail.status).toBe(400);
			const dataMissingEmail = (await responseMissingEmail.json()) as { error: string };
			expect(dataMissingEmail.error).toBe("name and email are required");

			const requestMissingName = new Request("http://example.com/users", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ email: "diego@test.com" }),
			});

			const responseMissingName = await worker.fetch(requestMissingName, mockEnv, ctx);
			expect(responseMissingName.status).toBe(400);
			const dataMissingName = (await responseMissingName.json()) as { error: string };
			expect(dataMissingName.error).toBe("name and email are required");
		});
	});

	describe("DELETE /users/:id", () => {
		it("deletes a user successfully with valid id", async () => {
			const runMock = vi.fn().mockResolvedValue({ success: true });
			const mockDb = {
				prepare: vi.fn().mockReturnValue({
					bind: vi.fn().mockReturnValue({
						run: runMock,
					}),
				}),
			} as unknown as D1Database;

			const mockEnv = { p6: mockDb };
			const request = new Request("http://example.com/users/10", {
				method: "DELETE",
			});
			const ctx = createMockCtx();

			const response = await worker.fetch(request, mockEnv, ctx);
			const data = (await response.json()) as { success: boolean; message: string };

			expect(response.status).toBe(200);
			expect(data.success).toBe(true);
			expect(data.message).toBe("User 10 deleted");
			expect(mockDb.prepare).toHaveBeenCalledWith("DELETE FROM users WHERE id = ?");
		});

		it("returns 400 when id is not a number", async () => {
			const mockDb = {} as unknown as D1Database;
			const mockEnv = { p6: mockDb };
			const request = new Request("http://example.com/users/invalid-id", {
				method: "DELETE",
			});
			const ctx = createMockCtx();

			const response = await worker.fetch(request, mockEnv, ctx);
			const data = (await response.json()) as { error: string };

			expect(response.status).toBe(400);
			expect(data.error).toBe("Invalid user id");
		});
	});

	describe("Error Handling", () => {
		it("returns 500 when database throws an error", async () => {
			const mockDb = {
				prepare: vi.fn().mockImplementation(() => {
					throw new Error("Database connection failure");
				}),
			} as unknown as D1Database;

			const mockEnv = { p6: mockDb };
			const request = new Request("http://example.com/");
			const ctx = createMockCtx();

			const response = await worker.fetch(request, mockEnv, ctx);
			const data = (await response.json()) as { error: string };

			expect(response.status).toBe(500);
			expect(data.error).toBe("Database connection failure");
		});
	});
});
