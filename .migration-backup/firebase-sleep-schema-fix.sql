-- Firebase Database Schema Fix for Sleep Tracking
-- Run this SQL on your Firebase/production database to fix sleep session saving

-- Step 1: Drop existing TIME columns
ALTER TABLE sleep_sessions DROP COLUMN IF EXISTS bedtime;
ALTER TABLE sleep_sessions DROP COLUMN IF EXISTS sleep_time;
ALTER TABLE sleep_sessions DROP COLUMN IF EXISTS wake_time;

-- Step 2: Add new TIMESTAMP columns
ALTER TABLE sleep_sessions ADD COLUMN bedtime TIMESTAMP;
ALTER TABLE sleep_sessions ADD COLUMN sleep_time TIMESTAMP;
ALTER TABLE sleep_sessions ADD COLUMN wake_time TIMESTAMP;

-- Step 3: Verify the changes
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'sleep_sessions' 
AND column_name IN ('bedtime', 'sleep_time', 'wake_time')
ORDER BY column_name;