CREATE DATABASE jangidstone;

CREATE
OR REPLACE FUNCTION update_updated_at() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW();

RETURN NEW;

END;

$$ LANGUAGE plpgsql;

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
    docs TEXT [],
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
    is_completed BOOLEAN DEFAULT false,
    start_time TIME NOT NULL,
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
    supervisor_id INT NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER trigger_update_updated_at BEFORE
UPDATE
    ON wallet FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TYPE expense_purpose as ENUM('site', 'worker');
CREATE TYPE expense_type as ENUM('machine_tool', 'material', 'miscellaneous', 'food', 'fare', 'payout');

CREATE TABLE expenses(
    id SERIAL PRIMARY KEY,
    amount INT NOT NULL,
    purpose expense_purpose NOT NULL,
    type expense_type NOT NULL,
    comment text,
    site_id INT NOT NULL,
    worker_id INT,
    supervisor_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE attendances(
    id SERIAL PRIMARY KEY,
    hours VARCHAR NOT NULL,
    check_in TIMESTAMP NOT NULL,
    check_out TIMESTAMP NOT NULL,
    worker_id INT NOT NULL,
    site_id INT,
    earned INT NOT NULL,
    time_diff VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE supervisor_attendances(
    id SERIAL PRIMARY KEY,
    hours VARCHAR NOT NULL,
    check_in TIMESTAMP NOT NULL,
    check_out TIMESTAMP NOT NULL,
    supervisor_id INT NOT NULL,
    site_id INT,
    time_diff VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE worker_payouts(
    id SERIAL PRIMARY KEY,
    amount INT NOT NULL,
    worker_id INT NOT NULL,
    site_id INT NOT NULL,
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
    site_id INT NOT NULL,
    created_at DATE DEFAULT CURRENT_DATE
);


CREATE TABLE site_supervisor_map (
    id SERIAL PRIMARY KEY,
    site_id INT NOT NULL UNIQUE,
    supervisor_id INT NOT NULL,
    CONSTRAINT fk_site FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE,
    CONSTRAINT fk_supervisor FOREIGN KEY (supervisor_id) REFERENCES supervisors(id) ON DELETE CASCADE
);

CREATE TABLE supervisor_check_in_out(
    uid TEXT,
    date DATE,
    check_in TIMESTAMP,
    check_out TIMESTAMP,
    supervisor_id INT NOT NULL,
    site_id INT NOT NULL,
    created_at DATE DEFAULT CURRENT_DATE
);

CREATE TABLE bills(
    id SERIAL PRIMARY KEY,
    amount BIGINT NOT NULL,
    site_id INT NOT NULL,
    docs TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_site FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE
);

CREATE TABLE site_transactions(
    id SERIAL PRIMARY KEY,
    amount BIGINT NOT NULL,
    site_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_site FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE
);

CREATE TABLE wallet_transactions(
    id SERIAL PRIMARY KEY,
    mode VARCHAR, 
    amount BIGINT NOT NULL,
    supervisor_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);