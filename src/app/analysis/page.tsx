'use client';

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, BrainCircuit, AlertCircle, Lightbulb, FileText } from 'lucide-react';
import { performAnalysis } from '@/app/actions/analysis';

type AnalysisResult = {
  analysisSummary: string;
  suggestedImprovements: string;
};

const historicalDataPlaceholder = JSON.stringify(
  [
    { tile: 'Boardwalk', scans: 150, period: 'last_week' },
    { tile: 'Park Place', scans: 145, period: 'last_week' },
    { tile: 'St. Charles Place', scans: 80, period: 'last_week' },
    { tile: 'Jail', scans: 250, period: 'last_week' },
  ],
  null,
  2
);

const currentDataPlaceholder = JSON.stringify(
  [
    { tile: 'Boardwalk', scans: 5, period: 'current_game' },
    { tile: 'Park Place', scans: 3, period: 'current_game' },
    { tile: 'Jail', scans: 30, period: 'current_game' },
    { tile: 'Go', scans: 40, period: 'current_game' },
  ],
  null,
  2
);

export default function AnalysisPage() {
  const [historicalData, setHistoricalData] = useState(
    historicalDataPlaceholder
  );
  const [currentData, setCurrentData] = useState(currentDataPlaceholder);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await performAnalysis({
        historicalScanData: historicalData,
        currentScanData: currentData,
      });

      if (response.success && response.data) {
        setResult(response.data);
      } else {
        throw new Error(response.error || 'An unknown error occurred.');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Scan Trend Analysis</h1>
        <p className="text-muted-foreground">
          Use AI to analyze scan data and suggest game improvements.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Analysis Input</CardTitle>
          <CardDescription>
            Provide historical and current scan data in JSON format.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="historicalData">Historical Scan Data</Label>
                <Textarea
                  id="historicalData"
                  value={historicalData}
                  onChange={(e) => setHistoricalData(e.target.value)}
                  className="min-h-[200px] font-mono text-xs"
                  placeholder="Paste historical JSON data here..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="currentData">Current Scan Data</Label>
                <Textarea
                  id="currentData"
                  value={currentData}
                  onChange={(e) => setCurrentData(e.target.value)}
                  className="min-h-[200px] font-mono text-xs"
                  placeholder="Paste current game JSON data here..."
                />
              </div>
            </div>
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Analysis Failed</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <Button type="submit" disabled={loading}>
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <BrainCircuit className="mr-2 h-4 w-4" />
              )}
              Analyze Trends
            </Button>
          </form>
        </CardContent>
      </Card>
      
      {loading && (
        <div className="flex flex-col items-center justify-center space-y-4 rounded-lg border border-dashed p-12 text-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-muted-foreground">AI is analyzing the data... this may take a moment.</p>
        </div>
      )}

      {result && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold tracking-tight">Analysis Results</h2>
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  Analysis Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{result.analysisSummary}</p>
              </CardContent>
            </Card>
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-primary" />
                  Suggested Improvements
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{result.suggestedImprovements}</p>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
