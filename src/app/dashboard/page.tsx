'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Eye, Users, ScanLine } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';

type Scan = {
  id: string;
  property: string;
  player: string;
  timestamp: Date;
  status: 'Completed' | 'Pending' | 'Failed';
};

const initialScans: Scan[] = [
  {
    id: '1',
    property: 'Boardwalk',
    player: 'Player 1',
    timestamp: new Date(Date.now() - 1000 * 60 * 2),
    status: 'Completed',
  },
  {
    id: '2',
    property: 'Park Place',
    player: 'Player 2',
    timestamp: new Date(Date.now() - 1000 * 60 * 5),
    status: 'Completed',
  },
  {
    id: '3',
    property: 'St. Charles Place',
    player: 'Player 3',
    timestamp: new Date(Date.now() - 1000 * 60 * 10),
    status: 'Failed',
  },
];

const properties = [
  'Mediterranean Avenue',
  'Baltic Avenue',
  'Reading Railroad',
  'Oriental Avenue',
  'Vermont Avenue',
  'Connecticut Avenue',
  'Jail',
  'Virginia Avenue',
  'Pennsylvania Railroad',
  'St. James Place',
  'Tennessee Avenue',
  'New York Avenue',
  'Free Parking',
  'Kentucky Avenue',
  'Indiana Avenue',
  'B. & O. Railroad',
  'Atlantic Avenue',
  'Ventnor Avenue',
  'Water Works',
  'Marvin Gardens',
  'Go to Jail',
  'Pacific Avenue',
  'North Carolina Avenue',
  'Short Line',
  'Pennsylvania Avenue',
  'Go',
];

export default function DashboardPage() {
  const [scans, setScans] = useState<Scan[]>(initialScans);

  useEffect(() => {
    const interval = setInterval(() => {
      const newScan: Scan = {
        id: `${Date.now()}-${Math.random()}`, // Create a more unique ID
        property:
          properties[Math.floor(Math.random() * properties.length)],
        player: `Player ${Math.floor(Math.random() * 4) + 1}`,
        timestamp: new Date(),
        status: 'Completed',
      };
      setScans((prevScans) => [newScan, ...prevScans].slice(0, 10));
    }, 5000); // Add a new scan every 5 seconds

    return () => clearInterval(interval);
  }, []);

  const getStatusBadgeVariant = (
    status: Scan['status']
  ): 'default' | 'secondary' | 'destructive' => {
    switch (status) {
      case 'Completed':
        return 'default';
      case 'Pending':
        return 'secondary';
      case 'Failed':
        return 'destructive';
      default:
        return 'default';
    }
  };

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome to the Monopoly Admin Center.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Scans</CardTitle>
            <ScanLine className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,234</div>
            <p className="text-xs text-muted-foreground">+20.1% from last month</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Players</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+4</div>
            <p className="text-xs text-muted-foreground">Current game session</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Live Feed</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Real-time</div>
            <p className="text-xs text-muted-foreground">Monitoring new scans</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Real-time Scan Feed</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Property</TableHead>
                <TableHead>Player</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Timestamp</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {scans.map((scan) => (
                <TableRow key={scan.id}>
                  <TableCell className="font-medium">{scan.property}</TableCell>
                  <TableCell>{scan.player}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(scan.status)}>
                      {scan.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {formatDistanceToNow(scan.timestamp, { addSuffix: true })}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
