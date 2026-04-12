-- Optional customer profile photo (data URL or HTTPS URL). Large TEXT for compressed JPEG data URLs.
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_photo_data_url TEXT;
