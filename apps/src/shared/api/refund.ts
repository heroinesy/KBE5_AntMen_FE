import { customFetch } from './base'

const REFUND_API_URL = 'http://localhost:9091/api/v1/customer/refunds'

// 환불 요청 DTO
export interface RefundRequestDto {
  reservationId: number
  refundReason: string
  refundAmount: number
}

/**
 * 고객 환불 요청 API
 * @param refundData - 환불 요청 데이터
 */
export const requestRefund = async (refundData: RefundRequestDto): Promise<void> => {
  return customFetch<void>(REFUND_API_URL, {
    method: 'POST',
    body: JSON.stringify(refundData),
  })
} 