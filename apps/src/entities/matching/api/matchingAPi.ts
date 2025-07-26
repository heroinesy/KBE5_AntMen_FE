import { customFetch } from '@/shared/api/base'
import {
  ReservationHistoryDto,
  MatchingResponseRequestDto,
  PaginatedMatchingResponse,
  MatchingRequestDto,
  MatchingManagerListResponseDto,
  SortType,
} from '../model/types'

const BASE_URL = 'http://localhost:9092/v1/manager'
const MATCHING_API_URL = 'http://localhost:9091/api/v1/matchings'

class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public statusText: string,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export const getMatchingRequests = async (
  page: number = 0,
  size: number = 5,
): Promise<PaginatedMatchingResponse> => {
  return customFetch<PaginatedMatchingResponse>(
    `${BASE_URL}/matching/list?page=${page}&size=${size}`,
  )
}

export const acceptMatchingRequest = async (
  matchingId: string,
): Promise<void> => {
  return customFetch<void>(`${BASE_URL}/matching/${matchingId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      matchingManagerIsAccept: true,
    }),
  })
}

export const rejectMatchingRequest = async (
  matchingId: string,
  refuseReason: string = '',
): Promise<void> => {
  return customFetch<void>(`${BASE_URL}/matching/${matchingId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      matchingManagerIsAccept: false,
      matchingRefuseReason: refuseReason,
    }),
  })
}

export const respondToMatching = async (
  matchingId: number,
  requestDto: MatchingResponseRequestDto,
): Promise<void> => {
  try {
    const response = await fetch(`${MATCHING_API_URL}/${matchingId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestDto),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => null)
      console.error('Matching Response Error:', {
        status: response.status,
        statusText: response.statusText,
        errorData,
      })
      throw new ApiError(
        errorData?.errorMessage || '매칭 응답에 실패했습니다.',
        response.status,
        response.statusText,
      )
    }

  } catch (error) {
    if (error instanceof ApiError) {
      throw error
    }
    console.error('Matching response error:', error)
    throw new ApiError(
      '서버와 통신하는데 실패했습니다',
      500,
      'Internal Server Error',
    )
  }
}

/**
 * 추천 매니저 리스트 조회 API
 * @param request - 예약 요청 정보
 * @param useDistanceFilter - 거리 필터링 여부
 * @param sortType - 정렬 기준 ("distance" | "recent")
 * @returns Promise<MatchingManagerListResponseDto[]>
 */
export const getRecommendedManagers = async (
  request: MatchingRequestDto,
  useDistanceFilter: boolean = true,
  sortType: SortType = 'distance'
): Promise<MatchingManagerListResponseDto[]> => {
  try {
    const queryParams = new URLSearchParams({
      useDistanceFilter: useDistanceFilter.toString(),
      sortType: sortType,
    })
    
    const response = await fetch(
      `${MATCHING_API_URL}?${queryParams}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      }
    )

    if (!response.ok) {
      const errorData = await response.json().catch(() => null)
      console.error('Get Recommended Managers Error:', {
        status: response.status,
        statusText: response.statusText,
        errorData,
      })
      throw new ApiError(
        errorData?.errorMessage || '추천 매니저 조회에 실패했습니다.',
        response.status,
        response.statusText,
      )
    }

    const data: MatchingManagerListResponseDto[] = await response.json()
    return data

  } catch (error) {
    if (error instanceof ApiError) {
      throw error
    }
    console.error('Get recommended managers error:', error)
    throw new ApiError(
      '서버와 통신하는데 실패했습니다',
      500,
      'Internal Server Error',
    )
  }
}

/**
 * 자동 매칭 API - 상위 3명의 매니저를 자동으로 선택
 * @param request - 예약 요청 정보
 * @returns Promise<MatchingManagerListResponseDto[]> - 최대 3명의 매니저
 */
export const getAutoMatchingManagers = async (
  request: MatchingRequestDto
): Promise<MatchingManagerListResponseDto[]> => {
  try {
    // 매칭 추천 기준 설정을 사용한 자동 매칭
    const queryParams = new URLSearchParams({
      useDistanceFilter: 'true',
      sortType: 'custom',
    })
    
    const response = await fetch(
      `${MATCHING_API_URL}?${queryParams}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      }
    )

    if (!response.ok) {
      const errorData = await response.json().catch(() => null)
      console.error('Auto Matching Error:', {
        status: response.status,
        statusText: response.statusText,
        errorData,
      })
      throw new ApiError(
        errorData?.errorMessage || '자동 매칭에 실패했습니다.',
        response.status,
        response.statusText,
      )
    }

    const data: MatchingManagerListResponseDto[] = await response.json()
    
    // 최대 3명까지만 반환
    return data.slice(0, 3)

  } catch (error) {
    if (error instanceof ApiError) {
      throw error
    }
    console.error('Auto matching error:', error)
    throw new ApiError(
      '자동 매칭 중 오류가 발생했습니다',
      500,
      'Internal Server Error',
    )
  }
}