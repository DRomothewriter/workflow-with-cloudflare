export interface Env {
	p6: D1Database;
}

export default {
	async fetch(request, env, ctx): Promise<Response> {
		const url = new URL(request.url);

		try {
			// POST /users -> Crear un nuevo usuario
			if (request.method === "POST" && (url.pathname === "/users" || url.pathname === "/")) {
				const body = await request.json() as { name?: string; email?: string };
				if (!body.name || !body.email) {
					return Response.json({ error: "name and email are required" }, { status: 400 });
				}
				const created = await this.createUser(env.p6, body.name, body.email);
				return Response.json({ success: true, user: created }, { status: 201 });
			}

			// DELETE /users/:id -> Eliminar un usuario
			if (request.method === "DELETE" && url.pathname.startsWith("/users/")) {
				const id = parseInt(url.pathname.split("/")[2], 10);
				if (isNaN(id)) {
					return Response.json({ error: "Invalid user id" }, { status: 400 });
				}
				await this.deleteUser(env.p6, id);
				return Response.json({ success: true, message: `User ${id} deleted` });
			}

			// GET por defecto -> Consultar y retornar usuarios de la BD (como en la diapositiva)
			const data = await this.queryDatabase(env.p6);
			return Response.json(data);
		} catch (error: any) {
			return Response.json({ error: error.message }, { status: 500 });
		}
	},

	// Método para leer la base de datos (Slide 12)
	async queryDatabase(db: D1Database) {
		const { results } = await db.prepare("SELECT * FROM users").all();
		return results;
	},

	// Métodos CRUD adicionales (Slide 15)
	async createUser(db: D1Database, name: string, email: string) {
		const result = await db.prepare("INSERT INTO users (name, email) VALUES (?, ?) RETURNING *")
			.bind(name, email)
			.first();
		return result;
	},

	async deleteUser(db: D1Database, id: number) {
		await db.prepare("DELETE FROM users WHERE id = ?")
			.bind(id)
			.run();
	}
} satisfies ExportedHandler<Env>;
