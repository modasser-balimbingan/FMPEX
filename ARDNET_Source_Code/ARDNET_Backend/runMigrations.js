const pool = require('./src/config/database');
const fs = require('fs');
const path = require('path');

async function runMigrations() {
  try {
    console.log('🔧 Starting database migrations...\n');

    // Read and execute the migration SQL file
    const migrationPath = path.join(__dirname, 'migrations', '001_create_listings_table.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');

    console.log('📝 Running migration: 001_create_listings_table.sql');
    await pool.query(sql);
    console.log('✅ Migration completed successfully!\n');

    console.log('📊 Tables created:');
    const result = await pool.query(
      `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;`
    );
    result.rows.forEach(row => {
      console.log(`   • ${row.table_name}`);
    });

    console.log('\n✨ Database setup complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

runMigrations();
