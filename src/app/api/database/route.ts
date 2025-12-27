import * as admin from 'firebase-admin';
import { NextRequest, NextResponse } from 'next/server';

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  try {
    // The service account key is expected to be in a JSON file
    // that is not checked into source control.
    // For local development, you can download it from the Firebase console.
    const serviceAccount = require('@/assets/serviceAccountKey.json');
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  } catch (error) {
    console.error('Firebase Admin SDK initialization failed', error);
    // This will cause subsequent Firestore operations to fail.
  }
}

const db = admin.firestore();

/**
 * GET /api/database
 * Lists all collections.
 *
 * GET /api/database?collection=<collectionName>
 * Lists all documents in a collection.
 *
 * GET /api/database?collection=<collectionName>&document=<documentId>
 * Gets a single document.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const collectionName = searchParams.get('collection');
  const documentId = searchParams.get('document');

  try {
    if (collectionName) {
      if (documentId) {
        // Get a single document
        const docSnap = await db.collection(collectionName).doc(documentId).get();
        if (!docSnap.exists) {
          return NextResponse.json({ error: 'Document not found' }, { status: 404 });
        }
        return NextResponse.json({ id: docSnap.id, ...docSnap.data() });
      } else {
        // Get all documents in a collection
        const querySnapshot = await db.collection(collectionName).get();
        const documents = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        return NextResponse.json({ documents });
      }
    } else {
      // List all collections
      const collections = await db.listCollections();
      const collectionIds = collections.map((col) => col.id);
      return NextResponse.json({ collections: collectionIds });
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    console.error('Firestore GET Error:', errorMessage);
    return NextResponse.json({ error: `Failed to fetch from Firestore: ${errorMessage}` }, { status: 500 });
  }
}

/**
 * POST /api/database?collection=<collectionName>
 * Creates a new document in the specified collection.
 * The document data should be in the request body as JSON.
 */
export async function POST(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const collectionName = searchParams.get('collection');

  if (!collectionName) {
    return NextResponse.json({ error: 'Collection name is required' }, { status: 400 });
  }

  try {
    const body = await req.json();
    const docRef = await db.collection(collectionName).add(body);
    const docSnap = await docRef.get();
    return NextResponse.json({ id: docSnap.id, ...docSnap.data() }, { status: 201 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    console.error('Firestore POST Error:', errorMessage);
    return NextResponse.json({ error: `Failed to create document: ${errorMessage}` }, { status: 500 });
  }
}

/**
 * PUT /api/database?collection=<collectionName>&document=<documentId>
 * Updates an existing document.
 * The updated document data should be in the request body as JSON.
 */
export async function PUT(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const collectionName = searchParams.get('collection');
  const documentId = searchParams.get('document');

  if (!collectionName || !documentId) {
    return NextResponse.json({ error: 'Collection name and document ID are required' }, { status: 400 });
  }

  try {
    const body = await req.json();
    await db.collection(collectionName).doc(documentId).update(body);
    const docSnap = await db.collection(collectionName).doc(documentId).get();
    return NextResponse.json({ id: docSnap.id, ...docSnap.data() });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    console.error('Firestore PUT Error:', errorMessage);
    return NextResponse.json({ error: `Failed to update document: ${errorMessage}` }, { status: 500 });
  }
}

/**
 * DELETE /api/database?collection=<collectionName>&document=<documentId>
 * Deletes a document.
 */
export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const collectionName = searchParams.get('collection');
  const documentId = searchParams.get('document');

  if (!collectionName || !documentId) {
    return NextResponse.json({ error: 'Collection name and document ID are required' }, { status: 400 });
  }

  try {
    await db.collection(collectionName).doc(documentId).delete();
    return new Response(null, { status: 204 }); // No Content
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    console.error('Firestore DELETE Error:', errorMessage);
    return NextResponse.json({ error: `Failed to delete document: ${errorMessage}` }, { status: 500 });
  }
}
