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
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  GeoPoint,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useToast } from '@/hooks/use-toast';

type Business = {
  id: string;
  name: string;
  category: string;
  points_per_visit: number;
  qr_code_secret: string;
  details: {
    street?: string;
    city?: string;
  };
};

const businessSchema = z.object({
  name: z.string().min(1, 'Business name is required'),
  category: z.string().min(1, 'Category is required'),
  points_per_visit: z.coerce.number().min(0, 'Points must be a positive number'),
  street: z.string().optional(),
  city: z.string().optional(),
  qr_code_secret: z.string().min(1, 'QR Code Secret is required'),
});

export default function BusinessesPage() {
  const { toast } = useToast();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);

  const form = useForm<z.infer<typeof businessSchema>>({
    resolver: zodResolver(businessSchema),
    defaultValues: {
      name: '',
      category: '',
      points_per_visit: 10,
      street: '',
      city: '',
      qr_code_secret: '',
    },
  });

  const fetchBusinesses = async () => {
    setLoading(true);
    try {
      const businessesCollection = collection(db, 'businesses');
      const q = query(businessesCollection, orderBy('name'));
      const businessesSnapshot = await getDocs(q);
      const businessesList = businessesSnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name,
          category: data.category || 'N/A',
          points_per_visit: data.points_per_visit || 0,
          qr_code_secret: data.qr_code_secret || '',
          details: data.details || {},
        };
      });
      setBusinesses(businessesList);
    } catch (error) {
        console.error("Failed to fetch businesses:", error);
        toast({
            variant: "destructive",
            title: "Failed to fetch businesses",
            description: "Could not retrieve business data from Firestore."
        })
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    fetchBusinesses();
  }, []);

  const handleAdd = () => {
    setSelectedBusiness(null);
    form.reset({
      name: '',
      category: '',
      points_per_visit: 10,
      street: '',
      city: '',
      qr_code_secret: `secret_${Date.now()}`
    });
    setIsFormOpen(true);
  };

  const handleEdit = (business: Business) => {
    setSelectedBusiness(business);
    form.reset({
      name: business.name,
      category: business.category,
      points_per_visit: business.points_per_visit,
      street: business.details?.street || '',
      city: business.details?.city || '',
      qr_code_secret: business.qr_code_secret,
    });
    setIsFormOpen(true);
  };

  const handleDelete = (business: Business) => {
    setSelectedBusiness(business);
    setIsDeleteAlertOpen(true);
  };

  const confirmDelete = async () => {
    if (selectedBusiness) {
        try {
            await deleteDoc(doc(db, 'businesses', selectedBusiness.id));
            toast({
                title: 'Business Deleted',
                description: `"${selectedBusiness.name}" has been permanently deleted.`
            });
            await fetchBusinesses();
        } catch(error) {
             console.error("Failed to delete business:", error);
            toast({
                variant: "destructive",
                title: "Deletion Failed",
                description: "Could not delete the business from Firestore."
            })
        }
    }
    setIsDeleteAlertOpen(false);
    setSelectedBusiness(null);
  };

  const onSubmit = async (values: z.infer<typeof businessSchema>) => {
    const dataToSave = {
        name: values.name,
        category: values.category,
        points_per_visit: values.points_per_visit,
        qr_code_secret: values.qr_code_secret,
        'details.street': values.street,
        'details.city': values.city,
    };

    try {
        if (selectedBusiness) {
          // Update
          const businessDoc = doc(db, 'businesses', selectedBusiness.id);
          await updateDoc(businessDoc, dataToSave);
           toast({
            title: 'Update Successful',
            description: `Data for ${values.name} has been updated.`,
          });
        } else {
          // Add
          await addDoc(collection(db, 'businesses'), {
            ...values,
            'details.street': values.street,
            'details.city': values.city,
            org_id: 'bellevue-community', // Hardcoded for now
            location: new GeoPoint(41.15, -95.93), // Placeholder
            total_scans: 0,
          });
           toast({
            title: 'Business Added',
            description: `${values.name} has been added to the list.`,
          });
        }
        await fetchBusinesses();
        setIsFormOpen(false);
        setSelectedBusiness(null);
    } catch (error) {
        console.error("Failed to save business:", error);
        toast({
            variant: "destructive",
            title: "Save Failed",
            description: "Could not save business data to Firestore."
        })
    }
  };

  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Businesses</h1>
          <p className="text-muted-foreground">
            Manage business locations and game properties.
          </p>
        </div>
        <Button onClick={handleAdd}>
          <PlusCircle className="mr-2" />
          Add Business
        </Button>
      </header>

      <Card>
        <CardHeader>
            <CardTitle>Business List</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Points</TableHead>
                   <TableHead>Address</TableHead>
                  <TableHead>
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {businesses.map((biz) => (
                  <TableRow key={biz.id}>
                    <TableCell className="font-medium">{biz.name}</TableCell>
                    <TableCell>{biz.category}</TableCell>
                    <TableCell>{biz.points_per_visit}</TableCell>
                    <TableCell>{biz.details?.street}, {biz.details?.city}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button aria-haspopup="true" size="icon" variant="ghost">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Toggle menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onSelect={() => handleEdit(biz)}>
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onSelect={() => handleDelete(biz)}
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
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {selectedBusiness ? 'Edit' : 'Add'} Business
            </DialogTitle>
            <DialogDescription>
              {selectedBusiness
                ? 'Update the details of the business.'
                : 'Enter the details for the new business.'}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Business Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Stella's Bar & Grill" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., Restaurant"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <FormField
                    control={form.control}
                    name="street"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Street Address</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., 106 W Main St" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>City</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Bellevue" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                    control={form.control}
                    name="points_per_visit"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Points Per Visit</FormLabel>
                        <FormControl>
                        <Input
                            type="number"
                            {...field}
                        />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="qr_code_secret"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>QR Code Secret</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
               </div>
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
              business &quot;{selectedBusiness?.name}&quot;.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
