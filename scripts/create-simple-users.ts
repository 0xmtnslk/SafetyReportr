#!/usr/bin/env tsx
import { db } from "../server/db";
import { users } from "../shared/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";

async function createSimpleUsers() {
  try {
    console.log("🔧 Creating simple test users...");
    
    const testUsers = [
      {
        username: "admin",
        password: "password", 
        fullName: "Admin Kullanıcı",
        role: "central_admin"
      },
      {
        username: "uzman",
        password: "password",
        fullName: "Test Uzman", 
        role: "safety_specialist"
      },
      {
        username: "test",
        password: "password",
        fullName: "Test Kullanıcı",
        role: "user"
      }
    ];

    for (const user of testUsers) {
      // Check if user exists
      const existing = await db.select()
        .from(users)
        .where(eq(users.username, user.username))
        .limit(1);

      if (existing.length === 0) {
        // Create new user
        const hashedPassword = await bcrypt.hash(user.password, 10);
        
        await db.insert(users).values({
          username: user.username,
          password: hashedPassword,
          fullName: user.fullName,
          role: user.role as any,
          firstLogin: false
        });
        
        console.log(`✅ Created user: ${user.username} / ${user.password}`);
      } else {
        console.log(`⏭️ User ${user.username} already exists`);
      }
    }

    console.log("🎉 Simple users creation completed!");

  } catch (error) {
    console.error("❌ Error creating simple users:", error);
    process.exit(1);
  }
}

// Run if called directly
if (process.argv[1] && process.argv[1].endsWith('create-simple-users.ts')) {
  createSimpleUsers().then(() => {
    console.log("✅ Done!");
    process.exit(0);
  }).catch((error) => {
    console.error("💥 Failed:", error);
    process.exit(1);
  });
}

export { createSimpleUsers };