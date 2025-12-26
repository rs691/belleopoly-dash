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
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Save } from 'lucide-react';
import { useState } from 'react';

const monopolyTiles = [
  'Go',
  'Mediterranean Avenue',
  'Community Chest (1)',
  'Baltic Avenue',
  'Income Tax',
  'Reading Railroad',
  'Oriental Avenue',
  'Chance (1)',
  'Vermont Avenue',
  'Connecticut Avenue',
  'Jail / Just Visiting',
  'St. Charles Place',
  'Electric Company',
  'States Avenue',
  'Virginia Avenue',
  'Pennsylvania Railroad',
  'St. James Place',
  'Community Chest (2)',
  'Tennessee Avenue',
  'New York Avenue',
  'Free Parking',
  'Kentucky Avenue',
  'Chance (2)',
  'Indiana Avenue',
  'Illinois Avenue',
  'B. & O. Railroad',
  'Atlantic Avenue',
  'Ventnor Avenue',
  'Water Works',
  'Marvin Gardens',
  'Go To Jail',
  'Pacific Avenue',
  'North Carolina Avenue',
  'Community Chest (3)',
  'Pennsylvania Avenue',
  'Short Line',
  'Chance (3)',
  'Park Place',
  'Luxury Tax',
  'Boardwalk',
];

const tileFormSchema = z.object({
  tileName: z.string().min(1, 'Please select a tile.'),
  owner: z.string().optional(),
  rentLevel: z.number().min(0).max(5).default(0),
  specialNotes: z.string().max(160).optional(),
});

export default function TilesPage() {
  const { toast } = useToast();
  const [rentLevel, setRentLevel] = useState([0]);

  const form = useForm<z.infer<typeof tileFormSchema>>({
    resolver: zodResolver(tileFormSchema),
    defaultValues: {
      rentLevel: 0,
    },
  });

  function onSubmit(data: z.infer<typeof tileFormSchema>) {
    console.log('Syncing data to Flutter app:', data);
    toast({
      title: 'Sync Successful',
      description: `Data for ${data.tileName} has been updated.`,
    });
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
          <CardTitle>Edit Tile Properties</CardTitle>
          <CardDescription>
            Select a tile and update its properties. Changes will be reflected
            in the app.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <FormField
                control={form.control}
                name="tileName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tile</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a tile to edit" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {monopolyTiles.map((tile) => (
                          <SelectItem key={tile} value={tile}>
                            {tile}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="owner"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Owner</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Player 1" {...field} />
                    </FormControl>
                    <FormDescription>
                      Assign an owner to this property. Leave blank if unowned.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="rentLevel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Rent Level / Houses (Current: {rentLevel[0]})
                    </FormLabel>
                    <FormControl>
                      <Slider
                        min={0}
                        max={5}
                        step={1}
                        defaultValue={[field.value]}
                        onValueChange={(value) => {
                          field.onChange(value[0]);
                          setRentLevel(value);
                        }}
                      />
                    </FormControl>
                    <FormDescription>
                      0 for base rent, 1-4 for houses, 5 for a hotel.
                    </FormDescription>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="specialNotes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Special Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Any special notes for this tile..."
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit">
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
