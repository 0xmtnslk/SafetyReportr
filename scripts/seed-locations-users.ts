#!/usr/bin/env tsx
import { db } from "../server/db";
import { users, locations } from "../shared/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";

async function seedLocationsAndUsers() {
  try {
    console.log("🏥 Starting locations and users seeding...");

    // 1. Create locations first
    console.log("📍 Creating locations...");
    
    const [topkapiLiv] = await db.insert(locations).values({
      name: "İstinye Üniversite Topkapı Liv Hastanesi",
      address: "Maltepe Mahallesi, Teyyareci Sami Sk. No:3, 34010 Zeytinburnu/İstanbul",
      type: "hospital"
    }).returning();
    
    const [medicalParkGop] = await db.insert(locations).values({
      name: "İstinye Üniversitesi MedicalPark GOP Hastanesi", 
      address: "Merkez Mahallesi, Çukurçeşme Cd. No:57 D:59, 34250 Gaziosmanpaşa/İstanbul",
      type: "hospital"
    }).returning();
    
    const [mlpcareMerkez] = await db.insert(locations).values({
      name: "MLPCARE Merkez",
      address: "Defterdar Mahallesi, Otakçılar Cd. No:78, 34050 Eyüpsultan/İstanbul",
      type: "medical_center"
    }).returning();

    console.log("✅ Locations created successfully");

    // 2. Check if central admin exists
    const existingAdmin = await db.select()
      .from(users)
      .where(eq(users.role, "central_admin"))
      .limit(1);

    let centralAdminId;
    if (existingAdmin.length === 0) {
      // Create central admin first
      const [centralAdmin] = await db.insert(users).values({
        username: "central_admin",
        password: await bcrypt.hash("password", 10),
        fullName: "Merkez Yönetim",
        role: "central_admin",
        position: "Sistem Yöneticisi",
        firstLogin: false
      }).returning();
      centralAdminId = centralAdmin.id;
      console.log("👤 Central admin created");
    } else {
      centralAdminId = existingAdmin[0].id;
      console.log("👤 Central admin already exists");
    }

    // 3. Create safety specialists for each location
    console.log("👨‍⚕️ Creating safety specialists and other users...");

    // Topkapı Liv - İş Güvenliği Uzmanı
    await db.insert(users).values({
      username: "metin.salik",
      password: await bcrypt.hash("password", 10),
      fullName: "Metin Salık",
      role: "safety_specialist",
      position: "İş Güvenliği Uzmanı",
      locationId: topkapiLiv.id,
      createdBy: centralAdminId
    });

    // MedicalPark GOP - İş Güvenliği Uzmanı
    await db.insert(users).values({
      username: "bugra.torlak",
      password: await bcrypt.hash("password", 10),
      fullName: "Buğra Torlak",
      role: "safety_specialist", 
      position: "İş Güvenliği Uzmanı",
      locationId: medicalParkGop.id,
      createdBy: centralAdminId
    });

    // MLPCARE Merkez - Management Users
    await db.insert(users).values({
      username: "murat.bakal",
      password: await bcrypt.hash("MuratBakal2024!", 10),
      fullName: "Murat Bakal",
      role: "location_manager",
      position: "Yönetim Kullanıcısı",
      locationId: mlpcareMerkez.id,
      createdBy: centralAdminId
    });

    await db.insert(users).values({
      username: "sifa.harmankoy",
      password: await bcrypt.hash("SifaHarmankoy2024!", 10),
      fullName: "Şifa Harmanköy",
      role: "location_manager",
      position: "Yönetim Kullanıcısı", 
      locationId: mlpcareMerkez.id,
      createdBy: centralAdminId
    });

    // Responsible Manager - Technical Services Manager  
    await db.insert(users).values({
      username: "ahmet.yilmaz",
      password: await bcrypt.hash("AhmetYilmaz2024!", 10),
      fullName: "Ahmet Yılmaz",
      role: "responsible_manager",
      position: "Teknik Hizmetler Müdürü",
      locationId: topkapiLiv.id, // Assign to Topkapı Liv
      createdBy: centralAdminId
    });
    
    // Occupational Physician - Add to Topkapı Liv
    await db.insert(users).values({
      username: "dr.ayse.kaya",
      password: await bcrypt.hash("DrAyseKaya2024!", 10),
      fullName: "Dr. Ayşe Kaya",
      role: "occupational_physician",
      position: "İşyeri Hekimi",
      locationId: topkapiLiv.id, // Assign to Topkapı Liv
      createdBy: centralAdminId
    });
    
    // Occupational Physician - Add to MedicalPark GOP  
    await db.insert(users).values({
      username: "dr.mehmet.ozkan",
      password: await bcrypt.hash("DrMehmetOzkan2024!", 10),
      fullName: "Dr. Mehmet Özkan", 
      role: "occupational_physician",
      position: "İşyeri Hekimi",
      locationId: medicalParkGop.id, // Assign to GOP
      createdBy: centralAdminId
    });

    console.log("✅ All users created successfully!");

    // Display created data
    console.log("\n📋 Created Locations:");
    console.log(`1. ${topkapiLiv.name}`);
    console.log(`   ${topkapiLiv.address}`);
    console.log(`2. ${medicalParkGop.name}`);
    console.log(`   ${medicalParkGop.address}`);
    console.log(`3. ${mlpcareMerkez.name}`);
    console.log(`   ${mlpcareMerkez.address}`);

    console.log("\n👥 Created Users:");
    console.log("• Central Admin: central_admin / Admin2024!medicalisg");
    console.log("• Metin Salık (İş Güvenliği Uzmanı): metin.salik / MetinSalik2024!");
    console.log("• Buğra Torlak (İş Güvenliği Uzmanı): bugra.torlak / BugraTorlak2024!");
    console.log("• Murat Bakal (Yönetim): murat.bakal / MuratBakal2024!");
    console.log("• Şifa Harmanköy (Yönetim): sifa.harmankoy / SifaHarmankoy2024!");
    console.log("• Ahmet Yılmaz (Sorumlu Müdür): ahmet.yilmaz / AhmetYilmaz2024!");
    console.log("• Dr. Ayşe Kaya (İşyeri Hekimi): dr.ayse.kaya / DrAyseKaya2024!");
    console.log("• Dr. Mehmet Özkan (İşyeri Hekimi): dr.mehmet.ozkan / DrMehmetOzkan2024!");

  } catch (error) {
    console.error("❌ Error seeding locations and users:", error);
    process.exit(1);
  }
}

// Run if called directly
if (process.argv[1] && process.argv[1].endsWith('seed-locations-users.ts')) {
  seedLocationsAndUsers().then(() => {
    console.log("🎉 Locations and users seeding completed!");
    process.exit(0);
  }).catch((error) => {
    console.error("💥 Locations and users seeding failed:", error);
    process.exit(1);
  });
}

export { seedLocationsAndUsers };