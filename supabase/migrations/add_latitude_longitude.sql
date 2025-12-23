-- Add latitude and longitude columns to records table
ALTER TABLE records 
ADD COLUMN IF NOT EXISTS latitude NUMERIC(10, 8),
ADD COLUMN IF NOT EXISTS longitude NUMERIC(11, 8);

-- Add index for location-based queries
CREATE INDEX IF NOT EXISTS idx_records_location ON records(latitude, longitude);

-- Add comment for documentation
COMMENT ON COLUMN records.latitude IS '위도 (WGS84 좌표계)';
COMMENT ON COLUMN records.longitude IS '경도 (WGS84 좌표계)';

