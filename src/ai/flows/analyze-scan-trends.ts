'use server';

/**
 * @fileOverview An AI-powered analysis tool to identify unusual scan activities across the Monopoly board.
 *
 * - analyzeScanTrends - A function that handles the analysis of scan trends.
 * - AnalyzeScanTrendsInput - The input type for the analyzeScanTrends function.
 * - AnalyzeScanTrendsOutput - The return type for the analyzeScanTrends function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeScanTrendsInputSchema = z.object({
  historicalScanData: z
    .string()
    .describe('Historical scan data in JSON format.'),
  currentScanData: z.string().describe('Current scan data in JSON format.'),
});
export type AnalyzeScanTrendsInput = z.infer<typeof AnalyzeScanTrendsInputSchema>;

const AnalyzeScanTrendsOutputSchema = z.object({
  analysisSummary: z.string().describe('A summary of the scan trend analysis.'),
  suggestedImprovements: z
    .string()
    .describe('Suggestions for game improvements based on the analysis.'),
});
export type AnalyzeScanTrendsOutput = z.infer<typeof AnalyzeScanTrendsOutputSchema>;

export async function analyzeScanTrends(input: AnalyzeScanTrendsInput): Promise<AnalyzeScanTrendsOutput> {
  return analyzeScanTrendsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeScanTrendsPrompt',
  input: {schema: AnalyzeScanTrendsInputSchema},
  output: {schema: AnalyzeScanTrendsOutputSchema},
  prompt: `You are an expert Monopoly game analyst.

You are provided with historical scan data and current scan data from a Monopoly game.
Your task is to analyze the data, identify any unusual scan activities, and suggest areas for game improvements.

Historical Scan Data: {{{historicalScanData}}}
Current Scan Data: {{{currentScanData}}}

Analyze the data and provide a summary of the scan trend analysis, as well as suggestions for game improvements.
`,
});

const analyzeScanTrendsFlow = ai.defineFlow(
  {
    name: 'analyzeScanTrendsFlow',
    inputSchema: AnalyzeScanTrendsInputSchema,
    outputSchema: AnalyzeScanTrendsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
