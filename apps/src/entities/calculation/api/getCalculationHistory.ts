import { CalculationHistoryItem } from '../model/types';

export async function getCalculationHistory(token: string): Promise<CalculationHistoryItem[]> {
  const response = await fetch('http://localhost:9092/api/v1/manager/calculation/history', {
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