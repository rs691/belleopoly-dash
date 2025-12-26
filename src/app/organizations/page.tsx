'use client';

import { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
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
} from '@/components/ui/alert-dialog';

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';

import { MoreHorizontal, PlusCircle, Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  Timestamp,
  query,
  orderBy,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

type Organization = {
  id: string;
  name: string;
  contactEmail: string;
  createdAt: Date;
};

const orgSchema = z.object({
  name: z.string().min(1, 'Organization name is required'),
  contactEmail: z.string().email('Invalid email address'),
});

export default function OrganizationsPage() {
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);

  const form = useForm<z.infer<typeof orgSchema>>({
    resolver: zodResolver(orgSchema),
    defaultValues: {
      name: '',
      contactEmail: '',
    },
  });

  const fetchOrgs = async () => {
    setLoading(true);
    const orgsCollection = collection(db, 'organizations');
    const q = query(orgsCollection, orderBy('created_at', 'desc'));
    const orgsSnapshot = await getDocs(q);
    const orgsList = orgsSnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name,
        contactEmail: data.contactEmail || '',
        createdAt: (data.created_at as Timestamp).toDate(),
      };
    });
    setOrgs(orgsList);
    setLoading(false);
  };

  useEffect(() => {
    fetchOrgs();
  }, []);

  const handleAdd = () => {
    setSelectedOrg(null);
    form.reset({ name: '', contactEmail: '' });
    setIsFormOpen(true);
  };

  const handleEdit = (org: Organization) => {
    setSelectedOrg(org);
    form.reset({ name: org.name, contactEmail: org.contactEmail });
    setIsFormOpen(true);
  };

  const handleDelete = (org: Organization) => {
    setSelectedOrg(org);
    setIsDeleteAlertOpen(true);
  };

  const confirmDelete = async () => {
    if (selectedOrg) {
      await deleteDoc(doc(db, 'organizations', selectedOrg.id));
      await fetchOrgs();
    }
    setIsDeleteAlertOpen(false);
    setSelectedOrg(null);
  };

  const onSubmit = async (values: z.infer<typeof orgSchema>) => {
    if (selectedOrg) {
      // Update
      const orgDoc = doc(db, 'organizations', selectedOrg.id);
      await updateDoc(orgDoc, values);
    } else {
      // Add
      await addDoc(collection(db, 'organizations'), {
        ...values,
        created_at: Timestamp.now(),
        admin_ids: [],
        settings: {},
      });
    }
    await fetchOrgs();
    setIsFormOpen(false);
    setSelectedOrg(null);
  };

  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Organizations</h1>
          <p className="text-muted-foreground">
            Manage your partner organizations.
          </p>
        </div>
        <Button onClick={handleAdd}>
          <PlusCircle className="mr-2" />
          Add Organization
        </Button>
      </header>

      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Contact Email</TableHead>
                  <TableHead>Created At</TableHead>
                  <TableHead>
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orgs.map((org) => (
                  <TableRow key={org.id}>
                    <TableCell className="font-medium">{org.name}</TableCell>
                    <TableCell>{org.contactEmail}</TableCell>
                    <TableCell>
                      {format(org.createdAt, 'PPP')}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button aria-haspopup="true" size="icon" variant="ghost">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Toggle menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onSelect={() => handleEdit(org)}>
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onSelect={() => handleDelete(org)}
                            className="text-destructive"
                          >
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedOrg ? 'Edit' : 'Add'} Organization
            </DialogTitle>
            <DialogDescription>
              {selectedOrg
                ? 'Update the details of the organization.'
                : 'Enter the details for the new organization.'}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Organization Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Bellevue Community" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="contactEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="e.g., contact@example.com"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="outline">
                    Cancel
                  </Button>
                </DialogClose>
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={isDeleteAlertOpen}
        onOpenChange={setIsDeleteAlertOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              organization &quot;{selectedOrg?.name}&quot;.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
