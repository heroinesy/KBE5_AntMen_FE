import { Payment, PaymentRequestDto } from '../model/types';

const PAYMENT_API_URL = 'http://localhost:9091/api/v1/payments';

export const requestPayment = async (paymentData: PaymentRequestDto, token: string): Promise<Payment> => {
  try {
    const cleanToken = token.replace(/^Bearer\s+/i, '').replace(/\s+/g, '');
    // 필수 데이터 검증
    if (!paymentData.payAmount) {
      throw new Error('결제 금액(payAmount)은 필수입니다.');
    }
    if (!paymentData.reservationId) {
      throw new Error('예약 ID(reservationId)는 필수입니다.');
    }
    if (!paymentData.payMethod) {
      throw new Error('결제 수단(payMethod)은 필수입니다.');
    }

    const response = await fetch(`${PAYMENT_API_URL}/request`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${cleanToken}`
      },
      body: JSON.stringify({
        reservationId: paymentData.reservationId,
        payMethod: paymentData.payMethod,
        payAmount: paymentData.payAmount
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      console.error('Payment Request Error Response:', {
        status: response.status,
        statusText: response.statusText,
        errorData
      });
      throw new Error(errorData?.errorMessage || '결제 요청에 실패했습니다.');
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Payment request error:', error);
    throw error;
  }
};

export const getPaymentInfo = async (paymentId: number, token: string): Promise<Payment> => {
  try {
    const cleanToken = token.replace(/^Bearer\s+/i, '').replace(/\s+/g, '');
    const response = await fetch(`${PAYMENT_API_URL}/${paymentId}`, {
      headers: {
        'Authorization': `Bearer ${cleanToken}`
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      console.error('Get Payment Info Error Response:', {
        status: response.status,
        statusText: response.statusText,
        errorData
      });
      throw new Error(errorData?.errorMessage || '결제 정보를 불러오는데 실패했습니다.');
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Get payment info error:', error);
    throw error;
  }
}; 