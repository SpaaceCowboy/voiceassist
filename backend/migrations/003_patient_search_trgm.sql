-- Speed up leading-% ILIKE searches on patients.
-- Without pg_trgm + GIN, queries like `phone ILIKE '%555%'` always seq-scan.

CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS patients_full_name_trgm_idx
    ON patients USING gin (full_name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS patients_phone_trgm_idx
    ON patients USING gin (phone gin_trgm_ops);

CREATE INDEX IF NOT EXISTS patients_email_trgm_idx
    ON patients USING gin (email gin_trgm_ops);
