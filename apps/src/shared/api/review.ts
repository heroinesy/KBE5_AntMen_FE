import { customFetch } from './base'

export type ReviewAuthorType = 'CUSTOMER' | 'MANAGER'

const MANAGER_BASE_URL = 'http://localhost:9092/v1/manager/reviews'
const CUSTOMER_BASE_URL = 'http://localhost:9091/api/v1/customer/reviews'

export interface ReviewRequest {
  reservationId: number
  reviewRating: number
  reviewComment?: string
  reviewAuthor: ReviewAuthorType
}

export interface ReviewResponse {
  reviewId: number
  reviewCustomerId: number
  reviewCustomerName: string
  reviewCustomerProfile: string
  reviewManagerId: number
  reviewManagerName: string
  reviewManagerProfile: string
  reservationId: number
  reviewRating: number
  reviewComment: string
  reviewAuthor: ReviewAuthorType
  reviewDate: string
}

export interface UpdateReviewRequest {
  reviewRating: number
  reviewComment: string
}

// 리뷰 summary 타입
export interface ReviewSummary {
  totalReviews: number
  avgRating: number
}

// 매니저 리뷰 summary API 함수
export async function getManagerReviewSummary(managerId: number | string): Promise<ReviewSummary> {
  const res = await fetch(`http://localhost:9092/v1/manager/reviews/summary/${managerId}`)
  if (!res.ok) {
    return { totalReviews: 0, avgRating: 0 }
  }
  return res.json()
}

// 수요자 리뷰 summary API 함수
export async function getCustomerReviewSummary(customerId: number | string): Promise<ReviewSummary> {
  const res = await fetch(`http://localhost:9091/api/v1/customer/reviews/summary/${customerId}`)
  if (!res.ok) {
    return { totalReviews: 0, avgRating: 0 }
  }
  return res.json()
}

// 매니저 성격 특성 타입
export interface Characteristic {
  id: string
  label: string
  type: 'kind' | 'punctual' | 'thorough'
}

// 매니저 타입 (상세/리스트 공통)
export interface Manager {
  profileImage: string
  name: string
  gender: string
  age: number
  rating: number
  reviewCount: number
  introduction: string
  reviewList: ReviewResponse[]
  characteristics: Characteristic[]
  // 기타 필요한 필드
}

// 매니저용 API 함수들
export const managerApi = {
  /**
   * 매니저가 리뷰를 작성하는 API 함수
   */
  createReview: async (dto: ReviewRequest): Promise<ReviewResponse> => {
    return await customFetch<ReviewResponse>(MANAGER_BASE_URL, {
      method: 'POST',
      body: JSON.stringify(dto),
    })
  },

  /**
   * 매니저가 작성한 리뷰 목록을 조회하는 API 함수
   */
  getMyWrittenReviews: async (): Promise<ReviewResponse[]> => {
    const response = await customFetch<ReviewResponse[]>(`${MANAGER_BASE_URL}/my/written`)
    return response
  },

  /**
   * 매니저가 받은 리뷰 목록을 조회하는 API 함수
   */
  getMyReceivedReviews: async (): Promise<ReviewResponse[]> => {
    const response = await customFetch<ReviewResponse[]>(`${MANAGER_BASE_URL}/my/received`)
    return response
  },

  /**
   * 매니저가 리뷰를 수정하는 API 함수
   */
  updateReview: async (
    reviewId: number,
    dto: UpdateReviewRequest
  ): Promise<ReviewResponse> => {
    return await customFetch<ReviewResponse>(
      `${MANAGER_BASE_URL}/${reviewId}`,
      {
        method: 'PUT',
        body: JSON.stringify(dto),
      }
    )
  },

  /**
   * 매니저가 리뷰를 삭제하는 API 함수
   */
  deleteReview: async (reviewId: number): Promise<void> => {
    await customFetch<void>(
      `${MANAGER_BASE_URL}/${reviewId}`,
      {
        method: 'DELETE',
      }
    )
  },
}

// 수요자용 API 함수들
export const customerApi = {
  /**
   * 수요자가 리뷰를 작성하는 API 함수
   */
  createReview: async (dto: ReviewRequest): Promise<ReviewResponse> => {
    return await customFetch<ReviewResponse>(CUSTOMER_BASE_URL, {
      method: 'POST',
      body: JSON.stringify(dto),
    })
  },

  /**
   * 수요자가 작성한 리뷰 목록을 조회하는 API 함수
   */
  getMyWrittenReviews: async (): Promise<ReviewResponse[]> => {
    const response = await customFetch<ReviewResponse[]>(`${CUSTOMER_BASE_URL}/my/written`)
    return response
  },

  /**
   * 수요자가 리뷰를 수정하는 API 함수
   */
  updateReview: async (
    reviewId: number,
    dto: UpdateReviewRequest
  ): Promise<ReviewResponse> => {
    return await customFetch<ReviewResponse>(
      `${CUSTOMER_BASE_URL}/${reviewId}`,
      {
        method: 'PUT',
        body: JSON.stringify(dto),
      }
    )
  },

  /**
   * 수요자가 리뷰를 삭제하는 API 함수
   */
  deleteReview: async (reviewId: number): Promise<void> => {
    await customFetch<void>(
      `${CUSTOMER_BASE_URL}/${reviewId}`,
      {
        method: 'DELETE',
      }
    )
  },
}