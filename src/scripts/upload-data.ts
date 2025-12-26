// To run this script, execute:
// npx tsx src/scripts/upload-data.ts

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, writeBatch, doc, GeoPoint, Timestamp } from 'firebase/firestore';
import * as fs from 'fs';
import * as path from 'path';

// IMPORTANT: Add your Firebase project configuration here
const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};


const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const configPath = path.resolve(__dirname, '../assets/config.json');

type BusinessData = {
    id: string;
    name: string;
    street: string;
    city: string;
    state: 'NE';
    zip: string;
    category: string;
    latitude: number;
    longitude: number;
    heroImageUrl: string;
    menuUrl: string;
    hours: Record<string, string>;
};

async function uploadData() {
    console.log('Starting data upload...');

    try {
        const configFile = fs.readFileSync(configPath, 'utf-8');
        const config = JSON.parse(configFile);

        const batch = writeBatch(db);

        // 1. Create Organization
        const orgId = 'bellevue-community';
        const orgRef = doc(db, 'organizations', orgId);
        batch.set(orgRef, {
            name: 'Bellevue Community',
            admin_ids: [],
            created_at: Timestamp.now(),
            settings: {
                branding: {
                    primary_color: '#4A90E2',
                    logo_url: ''
                },
                is_active: true
            },
            contactEmail: 'contact@bellevue.com'
        });
        console.log(`Prepared organization: ${orgId}`);

        // 2. Create Businesses
        const businesses: BusinessData[] = config.businesses;
        console.log(`Found ${businesses.length} businesses in config.json`);

        businesses.forEach((business) => {
            const businessRef = doc(db, 'businesses', business.id);
            batch.set(businessRef, {
                org_id: orgId,
                name: business.name,
                location: new GeoPoint(business.latitude, business.longitude),
                details: {
                    address: `${business.street}, ${business.city}, ${business.state} ${business.zip}`,
                    street: business.street,
                    city: business.city,
                    state: business.state,
                    zip: business.zip,
                    phone: '', // Add phone if available
                    hours: business.hours,
                    heroImageUrl: business.heroImageUrl,
                    menuUrl: business.menuUrl
                },
                qr_code_secret: `secret_${business.id}`, // Placeholder secret
                points_per_visit: 10, // Default value
                total_scans: 0, // Default value
                category: business.category,
            });
        });
        console.log('Prepared all businesses for batch write.');


        // Commit the batch
        await batch.commit();
        console.log('-----------------------------------------');
        console.log('✅ Success! All data has been uploaded to Firestore.');
        console.log('-----------------------------------------');

    } catch (error) {
        console.error('❌ Error uploading data:', error);
    }
}

uploadData().then(() => {
    // The script will exit automatically when the async operations are done.
    // We call process.exit() to ensure it terminates in all environments.
    process.exit(0);
}).catch(() => process.exit(1));
