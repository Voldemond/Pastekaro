import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function POST(request: NextRequest) {
    try {
        // Check admin secret for security
        const secret = request.nextUrl.searchParams.get('secret');
        const adminSecret = process.env.ADMIN_SECRET || 'unknown';

        if (secret !== adminSecret) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Drop all tables
        await sql`DROP TABLE IF EXISTS pastes CASCADE`;
        await sql`DROP TABLE IF EXISTS packages CASCADE`;
        await sql`DROP TABLE IF EXISTS users CASCADE`;

        // Recreate with correct schema
        await sql`
      CREATE TABLE users (
        id VARCHAR(255) PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

        await sql`CREATE INDEX idx_users_email ON users(email)`;

        await sql`
      CREATE TABLE packages (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        is_public BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

        await sql`CREATE INDEX idx_packages_user_id ON packages(user_id)`;

        await sql`
      CREATE TABLE pastes (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        package_id VARCHAR(255) REFERENCES packages(id) ON DELETE SET NULL,
        order_in_package INTEGER DEFAULT 0,
        ttl_seconds INTEGER,
        max_views INTEGER,
        view_count INTEGER DEFAULT 0,
        is_public BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

        await sql`CREATE INDEX idx_pastes_user_id ON pastes(user_id)`;
        await sql`CREATE INDEX idx_pastes_package_id ON pastes(package_id)`;

        return NextResponse.json({
            success: true,
            message: 'Database reset and recreated successfully'
        });
    } catch (error: any) {
        console.error('Reset DB error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to reset database' },
            { status: 500 }
        );
    }
}