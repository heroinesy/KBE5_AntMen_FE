import { CalculationHistoryItem } from '../model/types';

export interface CalculationSummaryParams {
  startDate: string; // yyyy-MM-dd
  EndDate: string;   // yyyy-MM-dd
}

export interface CalculationSummaryResponse {
  totalAmount: number;
  list: CalculationHistoryItem[];
}

export async function getCalculationSummary(
  token: string, 
  params: CalculationSummaryParams
): Promise<CalculationSummaryResponse> {
  const url = new URL('http://localhost:9092/api/v1/manager/calculation/my/summary');
  url.searchParams.append('startDate', params.startDate);
  url.searchParams.append('EndDate', params.EndDate);

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      'Authorization': `${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
  }

  return response.json();
} 