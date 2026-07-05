-- (profiles, uploads, activity feed)

ALTER TABLE bookings ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS certificate_url VARCHAR(255);
