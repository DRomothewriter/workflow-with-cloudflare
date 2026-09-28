-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL
);

-- Insert sample records
INSERT INTO users (name, email) VALUES ('Diego Romo', 'diego@ejemplo.com');
INSERT INTO users (name, email) VALUES ('Usuario ITESO', 'iteso@ejemplo.com');
