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
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';

const COLLECTION_NAME = 'businesses';

export default function BusinessesPage() {
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [selectedBusiness, setSelectedBusiness] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingBusiness, setEditingBusiness] = useState<any | null>(null);

  const fetchBusinesses = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/database?collection=${COLLECTION_NAME}`);
      if (!res.ok) throw new Error('Failed to fetch businesses');
      const data = await res.json();
      setBusinesses(data.documents);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBusinesses();
  }, []);

  const handleCreateBusiness = async () => {
    if (!editingBusiness) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/database?collection=${COLLECTION_NAME}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingBusiness),
      });
      if (!res.ok) throw new Error('Failed to create business');
      setIsCreateDialogOpen(false);
      setEditingBusiness(null);
      fetchBusinesses();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateBusiness = async () => {
    if (!editingBusiness) return;
    setIsLoading(true);
    try {
      const res = await fetch(
        `/api/database?collection=${COLLECTION_NAME}&document=${editingBusiness.id}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(editingBusiness),
        }
      );
      if (!res.ok) throw new Error('Failed to update business');
      setIsEditDialogOpen(false);
      setEditingBusiness(null);
      fetchBusinesses();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteBusiness = async (businessId: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(
        `/api/database?collection=${COLLECTION_NAME}&document=${businessId}`,
        {
          method: 'DELETE',
        }
      );
      if (!res.ok) throw new Error('Failed to delete business');
      fetchBusinesses();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const openCreateDialog = () => {
    setEditingBusiness({ name: '', address: '', phone: '' });
    setIsCreateDialogOpen(true);
  };

  const openEditDialog = (business: any) => {
    setSelectedBusiness(business);
    setEditingBusiness({ ...business });
    setIsEditDialogOpen(true);
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!editingBusiness) return;
    const { name, value } = e.target;
    setEditingBusiness({ ...editingBusiness, [name]: value });
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Businesses</h1>
        <Button onClick={openCreateDialog}>Add Business</Button>
      </div>
      {error && <p className="text-red-500 bg-red-100 p-2 rounded-md">{error}</p>}
      {isLoading && <p>Loading...</p>}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Address</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {businesses.map((business) => (
              <TableRow key={business.id}>
                <TableCell>{business.name}</TableCell>
                <TableCell>{business.address}</TableCell>
                <TableCell>{business.phone}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" onClick={() => openEditDialog(business)}>Edit</Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm">Delete</Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete the business `{business.name}`.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDeleteBusiness(business.id)}>Delete</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Business</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Input name="name" placeholder="Name" value={editingBusiness?.name || ''} onChange={handleFormChange} />
            <Input name="address" placeholder="Address" value={editingBusiness?.address || ''} onChange={handleFormChange} />
            <Input name="phone" placeholder="Phone" value={editingBusiness?.phone || ''} onChange={handleFormChange} />
          </div>
          <DialogFooter>
            <Button onClick={() => setIsCreateDialogOpen(false)} variant="ghost">Cancel</Button>
            <Button onClick={handleCreateBusiness}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Business</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Input name="name" placeholder="Name" value={editingBusiness?.name || ''} onChange={handleFormChange} />
            <Input name="address" placeholder="Address" value={editingBusiness?.address || ''} onChange={handleFormChange} />
            <Input name="phone" placeholder="Phone" value={editingBusiness?.phone || ''} onChange={handleFormChange} />
          </div>
          <DialogFooter>
            <Button onClick={() => setIsEditDialogOpen(false)} variant="ghost">Cancel</Button>
            <Button onClick={handleUpdateBusiness}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
