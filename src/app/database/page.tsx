'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export default function DatabasePage() {
  const [collections, setCollections] = useState<string[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [selectedCollection, setSelectedCollection] = useState<string | null>(null);
  const [selectedDocument, setSelectedDocument] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editingContent, setEditingContent] = useState('');
  const [newDocContent, setNewDocContent] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  // Fetch collections
  const fetchCollections = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/database');
      if (!res.ok) throw new Error('Failed to fetch collections');
      const data = await res.json();
      setCollections(data.collections);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCollections();
  }, []);

  // Fetch documents
  const fetchDocuments = async (collection: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/database?collection=${collection}`);
      if (!res.ok) throw new Error(`Failed to fetch documents for ${collection}`);
      const data = await res.json();
      setDocuments(data.documents);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (selectedCollection) {
      fetchDocuments(selectedCollection);
    } else {
      setDocuments([]);
      setSelectedDocument(null);
    }
  }, [selectedCollection]);

  const handleSelectCollection = (collection: string) => {
    setSelectedCollection(collection);
    setSelectedDocument(null);
    setIsEditing(false);
  };

  const handleSelectDocument = (doc: any) => {
    setSelectedDocument(doc);
    setEditingContent(JSON.stringify(doc, null, 2));
    setIsEditing(false);
  };

  const handleCreateDocument = async () => {
    if (!selectedCollection || !newDocContent) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/database?collection=${selectedCollection}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: newDocContent,
      });
      if (!res.ok) throw new Error('Failed to create document');
      setNewDocContent('');
      setIsCreateDialogOpen(false);
      fetchDocuments(selectedCollection);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateDocument = async () => {
    if (!selectedCollection || !selectedDocument) return;
    setIsLoading(true);
    try {
      const res = await fetch(
        `/api/database?collection=${selectedCollection}&document=${selectedDocument.id}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: editingContent,
        }
      );
      if (!res.ok) throw new Error('Failed to update document');
      const updatedDoc = await res.json();
      setSelectedDocument(updatedDoc);
      setDocuments(docs => docs.map(d => d.id === updatedDoc.id ? updatedDoc : d));
      setIsEditing(false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteDocument = async () => {
    if (!selectedCollection || !selectedDocument) return;
    setIsLoading(true);
    try {
      const res = await fetch(
        `/api/database?collection=${selectedCollection}&document=${selectedDocument.id}`,
        {
          method: 'DELETE',
        }
      );
      if (!res.ok) throw new Error('Failed to delete document');
      setSelectedDocument(null);
      fetchDocuments(selectedCollection);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Database Management</h1>
      {error && <p className="text-red-500 bg-red-100 p-2 rounded-md">{error}</p>}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Collections */}
        <div>
          <h2 className="text-xl font-semibold mb-2">Collections</h2>
          {isLoading && !collections.length && <p>Loading...</p>}
          <ul className="border rounded-lg p-2 bg-background-light">
            {collections.map((col) => (
              <li
                key={col}
                className={`cursor-pointer p-2 rounded-md transition-colors ${selectedCollection === col ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'}`}
                onClick={() => handleSelectCollection(col)}
              >
                {col}
              </li>
            ))}
          </ul>
        </div>

        {/* Documents */}
        <div>
            <div className="flex justify-between items-center mb-2">
                <h2 className="text-xl font-semibold">Documents</h2>
                {selectedCollection && (
                    <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                    <DialogTrigger asChild>
                        <Button size="sm">New Document</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                        <DialogTitle>Create Document in {selectedCollection}</DialogTitle>
                        <DialogDescription>
                            Enter the JSON content for the new document.
                        </DialogDescription>
                        </DialogHeader>
                        <Textarea
                        placeholder='{ "key": "value" }'
                        rows={10}
                        value={newDocContent}
                        onChange={(e) => setNewDocContent(e.target.value)}
                        />
                        <DialogFooter>
                        <Button onClick={handleCreateDocument} disabled={isLoading || !newDocContent}>
                            {isLoading ? 'Creating...' : 'Create'}
                        </Button>
                        </DialogFooter>
                    </DialogContent>
                    </Dialog>
                )}
            </div>
            {isLoading && documents.length === 0 && <p>Loading...</p>}
            {selectedCollection && (
                <ul className="border rounded-lg p-2 h-96 overflow-y-auto bg-background-light">
                {documents.map((doc) => (
                    <li
                    key={doc.id}
                    className={`cursor-pointer p-2 rounded-md transition-colors ${selectedDocument?.id === doc.id ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'}`}
                    onClick={() => handleSelectDocument(doc)}
                    >
                    {doc.id}
                    </li>
                ))}
                </ul>
            )}
        </div>

        {/* Document Details */}
        <div>
          <h2 className="text-xl font-semibold mb-2">Document Details</h2>
          {selectedDocument && (
            <div className="border rounded-lg p-4 bg-background-light">
              {isEditing ? (
                <>
                  <Textarea
                    value={editingContent}
                    onChange={(e) => setEditingContent(e.target.value)}
                    rows={15}
                    className="mb-2"
                  />
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" onClick={() => setIsEditing(false)}>Cancel</Button>
                    <Button onClick={handleUpdateDocument} disabled={isLoading}>
                      {isLoading ? 'Saving...' : 'Save'}
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <div className="h-96 overflow-y-auto bg-gray-100 dark:bg-gray-800 p-2 rounded-md">
                    <pre className="text-sm">{JSON.stringify(selectedDocument, null, 2)}</pre>
                  </div>
                  <div className="flex justify-end gap-2 mt-2">
                    <Button onClick={() => setIsEditing(true)}>Edit</Button>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive">Delete</Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the document `{selectedDocument.id}`.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={handleDeleteDocument} disabled={isLoading}>
                            {isLoading ? 'Deleting...' : 'Delete'}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>

                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
