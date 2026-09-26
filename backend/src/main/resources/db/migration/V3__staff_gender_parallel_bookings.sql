-- Roster metadata: optional gender label + concurrent booking capacity per stylist.
ALTER TABLE staff_members ADD COLUMN gender VARCHAR(32);

ALTER TABLE staff_members ADD COLUMN parallel_bookings_max INTEGER NOT NULL DEFAULT 1;
