'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Save, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { collection, getDocs, doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

type Business = {
  id: string;
  name: string;
  details: {
    street: string;
    city: string;
    state: 'NE';
    zip: string;
    hours: Record<string, string>;
    heroImageUrl: string;
    menuUrl: string;
  };
  points_per_visit: number;
  total_scans: number;
  qr_code_secret: string;
  org_id: string;
};

const tileFormSchema = z.object({
  business_id: z.string().min(1, 'Please select a business.'),
  name: z.string().min(1, 'Business name is required.'),
  street: z.string().min(1, 'Street is required.'),
  city: z.string().min(1, 'City is required.'),
  points_per_visit: z.coerce.number().min(0, 'Points must be non-negative.'),
  qr_code_secret: z.string().min(1, 'QR code secret is required.'),
  notes: z.string().optional(),
});

export default function TilesPage() {
  const { toast } = useToast();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);

  const form = useForm<z.infer<typeof tileFormSchema>>({
    resolver: zodResolver(tileFormSchema),
    defaultValues: {
      business_id: '',
      name: '',
      street: '',
      city: '',
      points_per_visit: 0,
      qr_code_secret: '',
      notes: '',
    },
  });

  const fetchBusinesses = async () => {
    setLoading(true);
    const businessesSnapshot = await getDocs(collection(db, 'businesses'));
    const businessesList = businessesSnapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as Business[];
    setBusinesses(businessesList);
    setLoading(false);
  };

  useEffect(() => {
    fetchBusinesses();
  }, []);

  const handleTileChange = async (businessId: string) => {
    if (!businessId) {
      form.reset();
      setSelectedBusiness(null);
      return;
    }
    const business = businesses.find(b => b.id === businessId);
    if(business) {
      setSelectedBusiness(business);
      form.reset({
        business_id: business.id,
        name: business.name,
        street: business.details.street,
        city: business.details.city,
        points_per_visit: business.points_per_visit,
        qr_code_secret: business.qr_code_secret,
        notes: '', // Notes are not stored in the DB in this schema
      });
    }
  };

  async function onSubmit(data: z.infer<typeof tileFormSchema>) {
    if (!selectedBusiness) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No business selected.',
      });
      return;
    }

    const businessDocRef = doc(db, 'businesses', data.business_id);
    const updatedData = {
      name: data.name,
      'details.street': data.street,
      'details.city': data.city,
      points_per_visit: data.points_per_visit,
      qr_code_secret: data.qr_code_secret,
    };
    
    await updateDoc(businessDocRef, updatedData);

    toast({
      title: 'Sync Successful',
      description: `Data for ${data.name} has been updated.`,
    });
    
    // Refetch to ensure local state is up-to-date
    fetchBusinesses();
  }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">
          Business / Tile Manager
        </h1>
        <p className="text-muted-foreground">
          Manage business markers and sync data to the game.
        </p>
      </header>
      <Card>
        <CardHeader>
          <CardTitle>Edit Business Properties</CardTitle>
          <CardDescription>
            Select a business to edit its properties. Changes will be
            synced to Firestore.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
             <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <FormField
                control={form.control}
                name="business_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Business</FormLabel>
                    <Select
                      onValueChange={(value) => {
                        field.onChange(value);
                        handleTileChange(value);
                      }}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a business to edit" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {businesses.map((business) => (
                          <SelectItem key={business.id} value={business.id}>
                            {business.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              { selectedBusiness && (
                <>
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                     <FormField
                      control={form.control}
                      name="points_per_visit"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Points Per Visit</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} />
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
                   <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Internal Notes</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Internal notes for this business (not saved to DB)..."
                            className="resize-none"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          These notes are for admin reference only and will not be saved.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="mr-2 h-4 w-4" />
                    )}
                    Save Changes
                  </Button>
                </>
              )}
            </form>
          </Form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
