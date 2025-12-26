'use server';

import { analyzeScanTrends, AnalyzeScanTrendsInput } from '@/ai/flows/analyze-scan-trends';

export async function performAnalysis(input: AnalyzeScanTrendsInput) {
  try {
    const result = await analyzeScanTrends(input);
    return { success: true, data: result };
  } catch (error) {
    console.error('Analysis failed:', error);
    return { success: false, error: 'Failed to perform analysis.' };
  }
}
