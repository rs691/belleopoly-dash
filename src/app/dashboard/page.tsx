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
import { db } from '@/lib/firebase/config';
import {
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
  doc,
  getDoc,
  Timestamp,
} from 'firebase/firestore';

type Scan = {
  id: string;
  businessName: string;
  userName: string;
  timestamp: Date;
};

export default function DashboardPage() {
  const [scans, setScans] = useState<Scan[]>([]);
  const [totalScans, setTotalScans] = useState(0);
  const [activePlayers, setActivePlayers] = useState(0);

  useEffect(() => {
    // Listen for real-time updates on the scans collection
    const q = query(
      collection(db, 'scans'),
      orderBy('timestamp', 'desc'),
      limit(10)
    );

    const unsubscribe = onSnapshot(q, async (querySnapshot) => {
      const newScans = await Promise.all(
        querySnapshot.docs.map(async (scanDoc) => {
          const scanData = scanDoc.data();

          // Fetch business name
          let businessName = 'Unknown Business';
          if (scanData.business_id) {
            const businessRef = doc(db, 'businesses', scanData.business_id);
            const businessSnap = await getDoc(businessRef);
            if (businessSnap.exists()) {
              businessName = businessSnap.data().name;
            }
          }

          // Fetch user name
          let userName = 'Unknown User';
          if (scanData.user_id) {
            // Assuming you have a 'users' collection
            const userRef = doc(db, 'users', scanData.user_id);
            const userSnap = await getDoc(userRef);
            if (userSnap.exists()) {
              // Assuming the user document has a 'name' or 'displayName' field
              userName = userSnap.data().name || userSnap.data().displayName || 'Anonymous';
            }
          }

          const timestamp = scanData.timestamp as Timestamp;

          return {
            id: scanDoc.id,
            businessName,
            userName,
            timestamp: timestamp.toDate(),
          };
        })
      );

      setScans(newScans);

      // Simple logic to update stats - you might want more sophisticated logic
      if(querySnapshot.docs.length > totalScans) {
        setTotalScans(querySnapshot.docs.length);
      }
      const uniquePlayers = new Set(newScans.map(s => s.userName));
      setActivePlayers(uniquePlayers.size);

    });

    // Clean up the listener on unmount
    return () => unsubscribe();
  }, [totalScans]);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Real-time business scan data.</p>
      </header>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Scans Today</CardTitle>
            <ScanLine className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalScans}</div>
            <p className="text-xs text-muted-foreground">Total scans since midnight</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Players</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{activePlayers}</div>
            <p className="text-xs text-muted-foreground">In the last 10 scans</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Feed Status</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Live</div>
            <p className="text-xs text-muted-foreground">
              Monitoring new scans in real-time
            </p>
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
                <TableHead>Business</TableHead>
                <TableHead>Player</TableHead>
                <TableHead className="text-right">Timestamp</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {scans.length > 0 ? (
                scans.map((scan) => (
                  <TableRow key={scan.id}>
                    <TableCell className="font-medium">{scan.businessName}</TableCell>
                    <TableCell>{scan.userName}</TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {formatDistanceToNow(scan.timestamp, { addSuffix: true })}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={3} className="h-24 text-center">
                    No scans yet. Waiting for data...
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
