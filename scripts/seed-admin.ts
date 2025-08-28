#!/usr/bin/env tsx
import { db } from "../server/db";
import { users } from "../shared/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";
import crypto from "crypto";

async function createAdminUser() {
  try {
    console.log("🔍 Checking for existing admin user...");
    
    const adminUsername = process.env.ADMIN_USERNAME || 'admin';
    const adminPassword = process.env.ADMIN_PASSWORD || 'password';
    const adminFullname = process.env.ADMIN_FULLNAME || 'Sistem Yöneticisi';
    const adminLocation = process.env.ADMIN_LOCATION || 'Yönetim';

    // Check if admin already exists
    const existingAdmin = await db.select()
      .from(users)
      .where(eq(users.username, adminUsername))
      .limit(1);

    if (existingAdmin.length > 0) {
      console.log("✅ Admin user already exists, skipping creation.");
      return;
    }

    console.log("🔨 Creating admin user...");
    
    // Hash the password
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    
    // Create admin user
    const [newAdmin] = await db.insert(users).values({
      username: adminUsername,
      password: hashedPassword,
      fullName: adminFullname,
      location: adminLocation,
      role: 'central_admin',
      firstLogin: false, // Admin doesn't need to change password on first login
    }).returning();

    console.log(`✅ Admin user created successfully!`);
    console.log(`📝 Username: ${adminUsername}`);
    console.log(`🔑 Password: ${adminPassword}`);
    console.log(`📍 Location: ${adminLocation}`);
    console.log("⚠️  Please change the password after first login for security!");

  } catch (error) {
    console.error("❌ Error creating admin user:", error);
    process.exit(1);
  }
}

// Run if called directly (ES Module compatible)
if (process.argv[1] && process.argv[1].endsWith('seed-admin.ts')) {
  createAdminUser().then(() => {
    console.log("🎉 Database seeding completed!");
    process.exit(0);
  }).catch((error) => {
    console.error("💥 Database seeding failed:", error);
    process.exit(1);
  });
}

export { createAdminUser };
