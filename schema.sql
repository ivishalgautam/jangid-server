CREATE DATABASE jangid IF NOT EXISTS;

CREATE
OR REPLACE FUNCTION update_updated_at() RETURNS TRIGGER AS $ $ BEGIN NEW.updated_at = NOW();

RETURN NEW;

END;

$ $ LANGUAGE plpgsql;

CREATE TYPE role_type as ENUM('admin', 'supervisor', 'worker');

CREATE TABLE admin(
    id SERIAL PRIMARY KEY,
    fullname VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL,
    role role_type DEFAULT 'admin',
    username VARCHAR(20) NOT NULL,
    password VARCHAR(20) NOT NULL,
    dpassword TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER trigger_update_updated_at BEFORE
UPDATE
    ON admin FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TABLE supervisors(
    id SERIAL PRIMARY KEY,
    fullname VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    is_disabled BOOLEAN DEFAULT false,
    role role_type DEFAULT 'supervisor',
    username VARCHAR(20) NOT NULL,
    password VARCHAR(20) NOT NULL,
    dpassword TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER trigger_update_updated_at BEFORE
UPDATE
    ON supervisors FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TABLE workers(
    id SERIAL PRIMARY KEY,
    fullname VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    is_disabled BOOLEAN DEFAULT false,
    role role_type DEFAULT 'worker',
    username VARCHAR(20) NOT NULL,
    password VARCHAR(20) NOT NULL,
    dpassword TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER trigger_update_updated_at BEFORE
UPDATE
    ON workers FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TABLE sites(
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    supervisor_id INT REFERENCES supervisors(id)
);