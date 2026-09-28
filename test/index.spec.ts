import { describe, it, expect, vi } from "vitest";
import worker from "../src/index";

describe("Worker with D1 Database", () => {
	it("queries the database and returns users in GET /", async () => {
		const mockUsers = [{ id: 1, name: "Diego Romo", email: "diego@ejemplo.com" }];
		const mockDb = {
			prepare: vi.fn().mockReturnValue({
				all: vi.fn().mockResolvedValue({ results: mockUsers }),
			}),
		} as unknown as D1Database;

		const mockEnv = {
			p6: mockDb,
		};

		const request = new Request("http://example.com");
		const ctx = {
			waitUntil: vi.fn(),
			passThroughOnException: vi.fn(),
		} as unknown as ExecutionContext;

		const response = await worker.fetch(request, mockEnv, ctx);
		const data = await response.json();

		expect(response.status).toBe(200);
		expect(data).toEqual(mockUsers);
	});

	it("creates a new user in POST /users", async () => {
		const newUser = { id: 2, name: "Ana Perez", email: "ana@ejemplo.com" };
		const mockDb = {
			prepare: vi.fn().mockReturnValue({
				bind: vi.fn().mockReturnValue({
					first: vi.fn().mockResolvedValue(newUser),
				}),
			}),
		} as unknown as D1Database;

		const mockEnv = {
			p6: mockDb,
		};

		const request = new Request("http://example.com/users", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ name: "Ana Perez", email: "ana@ejemplo.com" }),
		});
		const ctx = {
			waitUntil: vi.fn(),
			passThroughOnException: vi.fn(),
		} as unknown as ExecutionContext;

		const response = await worker.fetch(request, mockEnv, ctx);
		const data = (await response.json()) as { success: boolean; user: typeof newUser };

		expect(response.status).toBe(201);
		expect(data.success).toBe(true);
		expect(data.user).toEqual(newUser);
	});
});
