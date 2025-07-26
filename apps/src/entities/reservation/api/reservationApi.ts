import { Reservation, ReservationHistory, ReservationStatus } from '../model/types';
import { customFetch } from '@/shared/api/base';
import { useAuthStore } from '@/shared/stores/authStore'

const BASE_URL = 'http://localhost:9092/v1/manager/reservations';

class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public statusText: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export const getMyReservations = async (token: string): Promise<Reservation[]> => {
  try {
    const data = await customFetch<Reservation[]>(BASE_URL, {
      headers: {
        Authorization: token,
      },
      cache: 'no-store',
    });
    return data;
  } catch (error: any) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(
      '서버와 통신하는데 실패했습니다',
      500,
      'Internal Server Error'
    );
  }
}

export async function getReservationDetail(id: number, token: string): Promise<ReservationHistory> {
  try {
    const data = await customFetch<ReservationHistory>(`${BASE_URL}/${id}/history`, {
      headers: {
        Authorization: token,
      },
    });
    return data;
  } catch (error: any) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(
      '서버와 통신하는데 실패했습니다',
      500,
      'Internal Server Error'
    );
  }
}

export async function changeReservationStatus(
  id: number,
  status: ReservationStatus,
  token: string
): Promise<void> {
  try {
    await customFetch<void>(`${BASE_URL}/${id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: token,
      },
      body: JSON.stringify({ status }),
    });
  } catch (error: any) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(
      '서버와 통신하는데 실패했습니다',
      500,
      'Internal Server Error'
    );
  }
}

export const checkIn = async (
  reservationId: number,
  token: string,
): Promise<void> => {
  await customFetch<void>(
    `${BASE_URL}/${reservationId}/checkin`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: token,
      },
    },
  )
}

export const checkOut = async (
  reservationId: number,
  data: { comment: string },
  token: string,
): Promise<void> => {
  await customFetch<void>(
    `${BASE_URL}/${reservationId}/check-out`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: token,
      },
      body: JSON.stringify(data),
    },
  )
}

export interface ReservationComment {
  reservationId: number
  checkinAt: string | null
  checkoutAt: string | null
  comment: string | null
}

export const getReservationComment = async (
  reservationId: number,
  token: string,
): Promise<ReservationComment> => {
  return customFetch<ReservationComment>(
    `${BASE_URL}/${reservationId}/comment`,
    {
      headers: {
        Authorization: token,
      },
    },
  )
}

export const getRecommendDuration = async (
  addressId: number,
  token?: string,
): Promise<number> => {
  try {
    const headers: Record<string, string> = {};
    if (token) {
      headers.Authorization = token;
    }

    const data = await customFetch<number>(
      `http://localhost:9091/recommend-duration?address_id=${addressId}`,
      {
        headers,
        cache: 'no-store',
      }
    );
    return data;
  } catch (error: any) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(
      '추천 기간을 가져오는데 실패했습니다',
      500,
      'Internal Server Error'
    );
  }
} 