import { CalculationRequestParams } from '../model/types';

export async function requestCalculation(
  token: string, 
  params: CalculationRequestParams
): Promise<{ message: string }> {
  const url = new URL('http://localhost:9092/api/v1/manager/calculation/request');
  url.searchParams.append('startDate', params.startDate);
  url.searchParams.append('endDate', params.endDate);

  const response = await fetch(url.toString(), {
    method: 'POST',
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