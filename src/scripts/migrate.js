// const admin = require('firebase-admin');
// const fs = require('fs');
// const path = require('path');

// // 1. Initialize Admin SDK (Use your service account key)
// const serviceAccount = require(path.join(__dirname, '../assets/serviceAccountKey.json'));
// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount)
// });

// const db = admin.firestore();

// async function migrate() {
//   const data = JSON.parse(fs.readFileSync(path.join(__dirname, '../assets/config.json'), 'utf8'));
//   const batch = db.batch();

//   // 2. Create Default Organization
//   const orgRef = db.collection('organizations').doc('bellevue-org');
//   batch.set(orgRef, {
//     name: "Bellevue Community",
//     admin_ids: [], // Add your admin UIDs here
//     created_at: admin.firestore.FieldValue.serverTimestamp(),
//     settings: { active_status: true, branding: "default" }
//   });

//   // 3. Migrate Businesses from config.json
//   data.businesses.forEach((biz) => {
//     const bizRef = db.collection('businesses').doc(biz.id);
    
//     batch.set(bizRef, {
//       name: biz.name,
//       org_id: 'bellevue-org', // Link to the org created above
//       location: new admin.firestore.GeoPoint(biz.latitude, biz.longitude), //
//       details: {
//         address: `${biz.street}, ${biz.city}, ${biz.state}`,
//         phone: biz.phone || "N/A",
//         hours: biz.hours,
//         image_url: biz.heroImageUrl
//       },
//       qr_code_secret: `secret_${biz.id}_${Math.random().toString(36).substring(7)}`,
//       points_per_visit: 100,
//       total_scans: 0
//     });
//   });

//   await batch.commit();
//   console.log('✅ Organizations and Businesses migrated successfully!');
// }

// migrate().catch(console.error);