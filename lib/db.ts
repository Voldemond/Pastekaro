import { sql } from '@vercel/postgres';

export { sql };

// Helper function to initialize database tables
export async function initDatabase() {
  try {
    // Create users table
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    await sql`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`;

    // Create pastes table
    await sql`
      CREATE TABLE IF NOT EXISTS pastes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        package_id UUID,
        order_in_package INTEGER DEFAULT 0,
        ttl_seconds INTEGER,
        max_views INTEGER,
        view_count INTEGER DEFAULT 0,
        is_public BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    await sql`CREATE INDEX IF NOT EXISTS idx_pastes_user_id ON pastes(user_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_pastes_package_id ON pastes(package_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_pastes_created_at ON pastes(created_at DESC)`;

    // Create packages table
    await sql`
      CREATE TABLE IF NOT EXISTS packages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        is_public BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    await sql`CREATE INDEX IF NOT EXISTS idx_packages_user_id ON packages(user_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_packages_created_at ON packages(created_at DESC)`;

    console.log('✅ Database initialized successfully');
  } catch (error) {
    console.error('❌ Database initialization error:', error);
    throw error;
  }
}