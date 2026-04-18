BEGIN;

-- ============================================
-- Users (required by most tables/routes)
-- ============================================

CREATE TABLE IF NOT EXISTS users (
    user_id      SERIAL PRIMARY KEY,
    first_name   VARCHAR(150),
    last_name    VARCHAR(150),
    email        VARCHAR(255) NOT NULL UNIQUE,
    password     TEXT NOT NULL,
    date_created TIMESTAMP NOT NULL DEFAULT NOW(),
    role_id      INTEGER,
    department_id INTEGER,
    is_active    BOOLEAN NOT NULL DEFAULT TRUE
);


CREATE TABLE IF NOT EXISTS roles (
    role_id   SERIAL PRIMARY KEY,
    role_name VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS department (
    department_id   SERIAL PRIMARY KEY,
    department_name VARCHAR(200) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS hra_alignment (
    hra_id   SERIAL PRIMARY KEY,
    hra_name VARCHAR(200) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS hra_subcategory (
    hra_subcat_id    SERIAL PRIMARY KEY,
    hra_id           INTEGER NOT NULL REFERENCES hra_alignment(hra_id),
    subcategory_name VARCHAR(200) NOT NULL
);

CREATE TABLE IF NOT EXISTS statuses (
    status_id   SERIAL PRIMARY KEY,
    status_name VARCHAR(100) NOT NULL UNIQUE
);

-- Add FKs if this migration is applied onto an existing `users` table.
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_role_fk') THEN
        ALTER TABLE users
            ADD CONSTRAINT users_role_fk FOREIGN KEY (role_id) REFERENCES roles(role_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_department_fk') THEN
        ALTER TABLE users
            ADD CONSTRAINT users_department_fk FOREIGN KEY (department_id) REFERENCES department(department_id);
    END IF;
END $$;


CREATE TABLE IF NOT EXISTS research_studies (
    research_id            SERIAL PRIMARY KEY,
    hru_reg_no             VARCHAR(100),
    title                  VARCHAR(500) NOT NULL,
    abstract_summary       TEXT,
    department_id          INTEGER REFERENCES department(department_id),
    hra_id                 INTEGER REFERENCES hra_alignment(hra_id),
    hra_subcat_id          INTEGER REFERENCES hra_subcategory(hra_subcat_id),
    adviser_id             INTEGER REFERENCES users(user_id),
    corresponding_author_id INTEGER REFERENCES users(user_id),
    trb_required           BOOLEAN NOT NULL DEFAULT FALSE,
    current_status_id      INTEGER REFERENCES statuses(status_id),
    date_registered        DATE,
    created_by             INTEGER REFERENCES users(user_id),
    created_at             TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at             TIMESTAMP NOT NULL DEFAULT NOW()
);

-- If `research_studies` already existed, ensure newer columns exist.
ALTER TABLE research_studies ADD COLUMN IF NOT EXISTS title VARCHAR(500);
ALTER TABLE research_studies ADD COLUMN IF NOT EXISTS hru_reg_no VARCHAR(100);
ALTER TABLE research_studies ADD COLUMN IF NOT EXISTS abstract_summary TEXT;
ALTER TABLE research_studies ADD COLUMN IF NOT EXISTS department_id INTEGER;
ALTER TABLE research_studies ADD COLUMN IF NOT EXISTS current_status_id INTEGER;
ALTER TABLE research_studies ADD COLUMN IF NOT EXISTS corresponding_author_id INTEGER;
ALTER TABLE research_studies ADD COLUMN IF NOT EXISTS adviser_id INTEGER;
ALTER TABLE research_studies ADD COLUMN IF NOT EXISTS created_by INTEGER;
ALTER TABLE research_studies ADD COLUMN IF NOT EXISTS date_registered DATE;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'research_studies_department_fk') THEN
        ALTER TABLE research_studies
            ADD CONSTRAINT research_studies_department_fk FOREIGN KEY (department_id) REFERENCES department(department_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'research_studies_status_fk') THEN
        ALTER TABLE research_studies
            ADD CONSTRAINT research_studies_status_fk FOREIGN KEY (current_status_id) REFERENCES statuses(status_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'research_studies_corresponding_author_fk') THEN
        ALTER TABLE research_studies
            ADD CONSTRAINT research_studies_corresponding_author_fk FOREIGN KEY (corresponding_author_id) REFERENCES users(user_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'research_studies_adviser_fk') THEN
        ALTER TABLE research_studies
            ADD CONSTRAINT research_studies_adviser_fk FOREIGN KEY (adviser_id) REFERENCES users(user_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'research_studies_created_by_fk') THEN
        ALTER TABLE research_studies
            ADD CONSTRAINT research_studies_created_by_fk FOREIGN KEY (created_by) REFERENCES users(user_id);
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS research_authors (
    research_author_id SERIAL PRIMARY KEY,
    research_id        INTEGER NOT NULL REFERENCES research_studies(research_id),
    user_id            INTEGER NOT NULL REFERENCES users(user_id),
    author_type        VARCHAR(50)
);



CREATE TABLE IF NOT EXISTS research_documents (
    file_id     SERIAL PRIMARY KEY,
    research_id INTEGER NOT NULL REFERENCES research_studies(research_id),
    uploaded_by INTEGER REFERENCES users(user_id),
    file_name   VARCHAR(255) NOT NULL,
    file_path   VARCHAR(500) NOT NULL,
    file_type   VARCHAR(100),
    upload_date TIMESTAMP NOT NULL DEFAULT NOW(),
    version_no  INTEGER NOT NULL DEFAULT 1,
    is_latest   BOOLEAN NOT NULL DEFAULT TRUE
);

-- ============================================
-- Review Assignment
-- ============================================

CREATE TABLE IF NOT EXISTS review_assignment (
    assignment_id     SERIAL PRIMARY KEY,
    research_id       INTEGER NOT NULL REFERENCES research_studies(research_id),
    reviewer_id       INTEGER REFERENCES users(user_id),
    assigned_by       INTEGER REFERENCES users(user_id),
    date_assigned     TIMESTAMP NOT NULL DEFAULT NOW(),
    review_deadline   DATE,
    tat_days          INTEGER,
    date_completed    TIMESTAMP,
    assignment_status VARCHAR(50)
);

-- ============================================
-- Review Feedback
-- ============================================

CREATE TABLE IF NOT EXISTS review_feedback (
    feedback_id     SERIAL PRIMARY KEY,
    assignment_id   INTEGER NOT NULL REFERENCES review_assignment(assignment_id),
    research_id     INTEGER NOT NULL REFERENCES research_studies(research_id),
    reviewer_id     INTEGER REFERENCES users(user_id),
    feedback_status VARCHAR(50),
    remarks         TEXT,
    recommendation  TEXT,
    feedback_date   TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ============================================
-- TRB Reviews
-- ============================================

CREATE TABLE IF NOT EXISTS trb_reviews (
    trb_review_id SERIAL PRIMARY KEY,
    research_id   INTEGER NOT NULL REFERENCES research_studies(research_id),
    trb_user_id   INTEGER REFERENCES users(user_id),
    trb_status    VARCHAR(50),
    remarks       TEXT,
    review_date   TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ============================================
-- Revision History
-- ============================================

CREATE TABLE IF NOT EXISTS revision_history (
    revision_id      SERIAL PRIMARY KEY,
    research_id      INTEGER NOT NULL REFERENCES research_studies(research_id),
    returned_by      INTEGER REFERENCES users(user_id),
    returned_date    TIMESTAMP,
    revision_notes   TEXT,
    resubmitted_by   INTEGER REFERENCES users(user_id),
    resubmitted_date TIMESTAMP,
    revision_cycle_no INTEGER NOT NULL DEFAULT 1
);

-- ============================================
-- Notification
-- ============================================

CREATE TABLE IF NOT EXISTS notifications (
    notification_id SERIAL PRIMARY KEY,
    research_id     INTEGER REFERENCES research_studies(research_id),
    user_id         INTEGER REFERENCES users(user_id),
    message         TEXT NOT NULL,
    is_read         BOOLEAN NOT NULL DEFAULT FALSE,
    date_sent       TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ============================================
-- Bioinformatics
-- ============================================

CREATE TABLE IF NOT EXISTS bioinformatics (
    bioinfo_id  SERIAL PRIMARY KEY,
    research_id INTEGER NOT NULL REFERENCES research_studies(research_id),
    study_type  VARCHAR(200),
    description TEXT,
    created_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ============================================
-- BioInfo Samples
-- ============================================

CREATE TABLE IF NOT EXISTS bioinfo_samples (
    sample_id       SERIAL PRIMARY KEY,
    bioinfo_id      INTEGER NOT NULL REFERENCES bioinformatics(bioinfo_id),
    sample_code     VARCHAR(100),
    sample_type     VARCHAR(100),
    organism_name   VARCHAR(200),
    collection_date DATE,
    collection_site VARCHAR(200),
    remarks         TEXT
);

-- ============================================
-- BioInfo Tools
-- ============================================

CREATE TABLE IF NOT EXISTS bioinfo_tools (
    tool_id            SERIAL PRIMARY KEY,
    bioinfo_id         INTEGER NOT NULL REFERENCES bioinformatics(bioinfo_id),
    tool_name          VARCHAR(200) NOT NULL,
    tool_version       VARCHAR(50),
    purpose            TEXT,
    parameters         TEXT,
    reference_database VARCHAR(200),
    date_used          DATE
);

-- ============================================
-- BioInfo Datasets
-- ============================================

CREATE TABLE IF NOT EXISTS bioinfo_datasets (
    dataset_id    SERIAL PRIMARY KEY,
    bioinfo_id    INTEGER NOT NULL REFERENCES bioinformatics(bioinfo_id),
    sample_id     INTEGER REFERENCES bioinfo_samples(sample_id),
    dataset_name  VARCHAR(255),
    data_type     VARCHAR(100),
    file_format   VARCHAR(50),
    file_path     VARCHAR(500),
    file_size     BIGINT,
    accession_no  VARCHAR(100),
    upload_date   TIMESTAMP NOT NULL DEFAULT NOW(),
    is_raw_data   BOOLEAN NOT NULL DEFAULT TRUE
);

-- ============================================
-- BioInfo Results
-- ============================================

CREATE TABLE IF NOT EXISTS bioinfo_results (
    bioinfo_id         SERIAL PRIMARY KEY,
    research_id        INTEGER NOT NULL REFERENCES research_studies(research_id),
    study_type         VARCHAR(200),
    organism_name      VARCHAR(200),
    data_type          VARCHAR(100),
    database_source    VARCHAR(200),
    software_tool_used VARCHAR(200),
    file_format        VARCHAR(50),
    accession_no       VARCHAR(100),
    sequence_type      VARCHAR(100),
    notes              TEXT
);

COMMIT;
