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
  onSnapshot,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useToast } from '@/hooks/use-toast';
import { GoogleMap, useLoadScript, Marker } from '@react-google-maps/api';
import { cn } from '@/lib/utils';

type Business = {
  id: string;
  name: string;
  category: string;
  points_per_visit: number;
  qr_code_secret: string;
  address: string;
  lat?: number;
  lng?: number;
};

const businessSchema = z.object({
  name: z.string().min(1, 'Business name is required'),
  category: z.string().min(1, 'Category is required'),
  points_per_visit: z.coerce.number().min(0, 'Points must be a positive number'),
  qr_code_secret: z.string().min(1, 'QR Code Secret is required'),
  address: z.string().min(1, 'Address is required'),
});

const defaultCenter = { lat: 41.15, lng: -95.93 };

export default function BusinessesPage() {
  const { toast } = useToast();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
  const [selectedMapBusiness, setSelectedMapBusiness] = useState<Business | null>(null);
  const [mapCenter, setMapCenter] = useState(defaultCenter);
  const [zoom, setZoom] = useState(12);

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
  });

  const form = useForm<z.infer<typeof businessSchema>>({
    resolver: zodResolver(businessSchema),
    defaultValues: {
      name: '',
      category: '',
      points_per_visit: 10,
      qr_code_secret: '',
      address: '',
    },
  });

  useEffect(() => {
    setLoading(true);
    const businessesCollection = collection(db, 'businesses');
    const q = query(businessesCollection, orderBy('name'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const businessesList = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            name: data.name,
            category: data.category || 'N/A',
            points_per_visit: data.points_per_visit || 0,
            qr_code_secret: data.qr_code_secret || '',
            address: data.address || '',
            lat: data.lat,
            lng: data.lng,
          };
        });
        setBusinesses(businessesList);
        setLoading(false);
      },
      (error) => {
        console.error("Failed to fetch businesses:", error);
        toast({
            variant: "destructive",
            title: "Failed to fetch businesses",
            description: "Could not retrieve business data from Firestore."
        });
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [toast]);


  const handleAdd = () => {
    setSelectedBusiness(null);
    form.reset({
      name: '',
      category: '',
      points_per_visit: 10,
      qr_code_secret: `secret_${Date.now()}`,
      address: '',
    });
    setIsFormOpen(true);
  };

  const handleEdit = (business: Business) => {
    setSelectedBusiness(business);
    form.reset({
      name: business.name,
      category: business.category,
      points_per_visit: business.points_per_visit,
      qr_code_secret: business.qr_code_secret,
      address: business.address
    });
    setIsFormOpen(true);
  };

  const handleDelete = (business: Business) => {
    setSelectedBusiness(business);
    setIsDeleteAlertOpen(true);
  };
  
  const handleRowClick = (business: Business) => {
    if (business.lat && business.lng) {
      setMapCenter({ lat: business.lat, lng: business.lng });
      setZoom(16);
      setSelectedMapBusiness(business);
    } else {
      toast({
        variant: "destructive",
        title: "Location not available",
        description: "This business does not have coordinates to display on the map.",
      });
    }
  };

  const confirmDelete = async () => {
    if (selectedBusiness) {
        try {
            await deleteDoc(doc(db, 'businesses', selectedBusiness.id));
            toast({
                title: 'Business Deleted',
                description: `"${selectedBusiness.name}" has been permanently deleted.`
            });
            // The onSnapshot listener will automatically update the UI
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
    try {
        if (selectedBusiness) {
          // Update
          const dataToUpdate: any = { ...values };
          if (selectedBusiness.address !== values.address) {
            dataToUpdate.lat = null;
            dataToUpdate.lng = null;
          }
          const businessDoc = doc(db, 'businesses', selectedBusiness.id);
          await updateDoc(businessDoc, dataToUpdate);
           toast({
            title: 'Update Successful',
            description: `Data for ${values.name} has been updated. Geocoding may take a moment if address was changed.`,
          });
        } else {
          // Add
          await addDoc(collection(db, 'businesses'), {
            ...values,
            org_id: 'bellevue-community', // Hardcoded for now
            total_scans: 0,
            lat: null, // Ensure lat/lng are null to trigger geocoding
            lng: null,
          });
           toast({
            title: 'Business Added',
            description: `${values.name} has been added. Geocoding may take a moment.`,
          });
        }
        // The onSnapshot listener will automatically update the UI
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
          <CardTitle>Business Map</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] w-full rounded-lg bg-muted flex items-center justify-center">
            {loadError && <div className='text-destructive'>Error loading map</div>}
            {!isLoaded && !loadError && <div className='flex items-center gap-2'><Loader2 className="h-5 w-5 animate-spin" /> <span>Loading Map...</span></div>}
            {isLoaded && (
              <GoogleMap
                mapContainerStyle={{ height: '100%', width: '100%' }}
                center={mapCenter}
                zoom={zoom}
                onDragEnd={() => setSelectedMapBusiness(null)}
                options={{
                  streetViewControl: false,
                  mapTypeControl: false,
                }}
              >
                {businesses.map(biz => (
                  biz.lat && biz.lng && (
                    <Marker 
                      key={biz.id} 
                      position={{ lat: biz.lat, lng: biz.lng }} 
                      title={biz.name}
                      animation={selectedMapBusiness?.id === biz.id ? window.google.maps.Animation.BOUNCE : undefined}
                      onClick={() => handleRowClick(biz)}
                    />
                  )
                ))}
              </GoogleMap>
            )}
          </div>
        </CardContent>
      </Card>

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
                  <TableRow 
                    key={biz.id}
                    onClick={() => handleRowClick(biz)}
                    className={cn('cursor-pointer', { 'bg-muted/50': selectedMapBusiness?.id === biz.id })}
                  >
                    <TableCell className="font-medium">{biz.name}</TableCell>
                    <TableCell>{biz.category}</TableCell>
                    <TableCell>{biz.points_per_visit}</TableCell>
                    <TableCell>{biz.address}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button 
                            aria-haspopup="true" 
                            size="icon" 
                            variant="ghost"
                            onClick={(e) => e.stopPropagation()} // Prevent row click
                          >
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
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., 106 W Main St, Bellevue, NE" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
