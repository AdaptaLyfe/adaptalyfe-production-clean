// Quick database connection test for Railway
import { Pool } from '@neondatabase/serverless';

async function testDatabaseConnection() {
  console.log('Testing database connection...');
  console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);
  
  if (!process.env.DATABASE_URL) {
    console.log('❌ No DATABASE_URL environment variable');
    return false;
  }
  
  try {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const result = await pool.query('SELECT NOW()');
    console.log('✅ Database connection successful:', result.rows[0]);
    await pool.end();
    return true;
  } catch (error) {
    console.log('❌ Database connection failed:', error);
    return false;
  }
}

testDatabaseConnection();