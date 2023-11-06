CREATE DATABASE jangidstone;

CREATE
OR REPLACE FUNCTION update_updated_at() RETURNS TRIGGER AS $ $ BEGIN NEW.updated_at = NOW();

RETURN NEW;

END;

$ $ LANGUAGE plpgsql;

CREATE TYPE role_type as ENUM('admin', 'supervisor', 'worker');

CREATE TABLE admin(
    id SERIAL PRIMARY KEY,
    fullname VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    role role_type DEFAULT 'admin',
    username VARCHAR(20) NOT NULL UNIQUE,
    password VARCHAR(20) NOT NULL,
    hpassword TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER trigger_update_updated_at BEFORE
UPDATE
    ON admin FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TABLE supervisors(
    id SERIAL PRIMARY KEY,
    fullname VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    phone VARCHAR(20) NOT NULL UNIQUE,
    is_disabled BOOLEAN DEFAULT false,
    role role_type DEFAULT 'supervisor',
    username VARCHAR(20) NOT NULL UNIQUE,
    password VARCHAR(20) NOT NULL,
    hpassword TEXT NOT NULL,
    is_present BOOLEAN DEFAULT false,
    profile_img TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER trigger_update_updated_at BEFORE
UPDATE
    ON supervisors FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TABLE workers(
    id SERIAL PRIMARY KEY,
    fullname VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL UNIQUE,
    role role_type DEFAULT 'worker',
    docs TEXT [],
    profile_img TEXT,
    username VARCHAR(20) NOT NULL UNIQUE,
    password VARCHAR(20) NOT NULL,
    hpassword TEXT NOT NULL,
    supervisor_id varchar(100),
    site_assigned varchar(100),
    daily_wage_salary INT NOT NULL,
    address TEXT,
    is_present BOOLEAN DEFAULT false,
    is_disabled BOOLEAN DEFAULT false,
    total_working_hours INT DEFAULT 0,
    total_payout INT DEFAULT 0,
    total_paid INT DEFAULT 0,
    pending_payout INT DEFAULT 0,
    lat text,
    long text,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER trigger_update_updated_at BEFORE
UPDATE
    ON workers FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TABLE sites(
    id SERIAL PRIMARY KEY,
    site_name TEXT NOT NULL,
    owner_name VARCHAR(100) NOT NULL,
    owner_contact VARCHAR(100) NOT NULL,
    address TEXT NOT NULL,
    image TEXT NOT NULL,
    total_budget INT DEFAULT 0,
    budget_left INT DEFAULT 0,
    supervisor_id INT REFERENCES supervisors(id),
    is_completed BOOLEAN DEFAULT false,
    start_time TIME NOT NULL,
    --16:00:00
    end_time TIME NOT NULL,
    lat text,
    long text,
    radius INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER trigger_update_updated_at BEFORE
UPDATE
    ON sites FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TABLE wallet(
    id SERIAL PRIMARY KEY,
    amount INT NOT NULL,
    supervisor_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER trigger_update_updated_at BEFORE
UPDATE
    ON wallet FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TYPE expense_type as ENUM('site', 'worker');

CREATE TABLE expenses(
    id SERIAL PRIMARY KEY,
    amount INT NOT NULL,
    purpose expense_type NOT NULL,
    site_id INT NOT NULL,
    worker_id INT
);

CREATE TABLE attendances(
    id SERIAL PRIMARY KEY,
    date DATE DEFAULT CURRENT_DATE,
    hours VARCHAR NOT NULL,
    check_in TIMESTAMP NOT NULL,
    check_out TIMESTAMP NOT NULL,
    worker_id INT NOT NULL,
    earned INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE worker_payouts(
    id SERIAL PRIMARY KEY,
    amount INT NOT NULL,
    worker_id INT NOT NULL,
    supervisor_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE site_payouts(
    id SERIAL PRIMARY KEY,
    amount INT NOT NULL,
    site_id INT NOT NULL,
    supervisor_id INT NOT NULL,
    comment text NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE check_in_out(
    uid TEXT,
    date DATE,
    check_in TIMESTAMP,
    check_out TIMESTAMP,
    worker_id INT NOT NULL,
    created_at DATE DEFAULT CURRENT_DATE
);