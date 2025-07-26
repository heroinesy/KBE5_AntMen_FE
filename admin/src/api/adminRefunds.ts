import axios from 'axios';
import { AdminRefundResponseDto, AdminRefundStatisticsResponseDto, AdminRefundReasonDto, AdminRefundCustomerTopDto, AdminRefundManagerTopDto } from './types';
import { getCookie, ADMIN_TOKEN_COOKIE } from '../lib/cookie';

const API_BASE_URL = 'http://localhost:9093/api/v1';

// 환불 API 인스턴스
const refundsApi = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// 요청 인터셉터: 토큰 자동 추가
refundsApi.interceptors.request.use(
    (config) => {
        // 쿠키와 localStorage 둘 다 확인
        let token = getCookie(ADMIN_TOKEN_COOKIE);
        if (!token) {
            token = localStorage.getItem('adminToken');
        }
        
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// 응답 인터셉터: 401 에러 시 로그인 페이지로 리다이렉트
refundsApi.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // 토큰이 만료되었거나 유효하지 않은 경우
            alert('토큰이 만료되었습니다. 다시 로그인해주세요.');
            localStorage.removeItem('adminUser');
            localStorage.removeItem('adminToken');
            document.cookie = `${ADMIN_TOKEN_COOKIE}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
            window.location.href = '/admin/login';
        }
        return Promise.reject(error);
    }
);

export const adminRefundsService = {
    // 모든 환불 요청 목록 조회
    getAllRefunds: async (): Promise<AdminRefundResponseDto[]> => {
        try {
            const response = await refundsApi.get('/admin/refunds');
            return response.data;
        } catch (error: any) {
            if (error.response?.status === 401) {
                throw new Error('토큰이 만료되었습니다. 다시 로그인해주세요.');
            }
            throw error;
        }
    },

    // 대기중인 환불 요청 목록 조회
    getWaitingRefunds: async (): Promise<AdminRefundResponseDto[]> => {
        try {
            const response = await refundsApi.get('/admin/refunds/waiting');
            return response.data;
        } catch (error: any) {
            if (error.response?.status === 401) {
                throw new Error('토큰이 만료되었습니다. 다시 로그인해주세요.');
            }
            throw error;
        }
    },

    // 환불 통계 조회
    getRefundStatistics: async (): Promise<AdminRefundStatisticsResponseDto> => {
        try {
            const response = await refundsApi.get('/admin/statistics/refunds');
            return response.data;
        } catch (error: any) {
            if (error.response?.status === 401) {
                throw new Error('토큰이 만료되었습니다. 다시 로그인해주세요.');
            }
            throw error;
        }
    },

    // 환불 사유 분포 조회
    getRefundReasons: async (): Promise<AdminRefundReasonDto[]> => {
        try {
            const response = await refundsApi.get('/admin/statistics/refunds/reasons');
            return response.data;
        } catch (error: any) {
            if (error.response?.status === 401) {
                throw new Error('토큰이 만료되었습니다. 다시 로그인해주세요.');
            }
            throw error;
        }
    },

    // 상위 환불 사유 조회
    getTopRefundReasons: async (topCount: number = 5): Promise<AdminRefundReasonDto[]> => {
        try {
            const response = await refundsApi.get(`/admin/statistics/refunds/reasons/top?topCount=${topCount}`);
            return response.data;
        } catch (error: any) {
            if (error.response?.status === 401) {
                throw new Error('토큰이 만료되었습니다. 다시 로그인해주세요.');
            }
            throw error;
        }
    },

    // 자동환불 세부 사유 조회
    getAutoRefundDetails: async (): Promise<AdminRefundReasonDto[]> => {
        try {
            const response = await refundsApi.get('/admin/statistics/refunds/reasons/auto-refund-details');
            return response.data;
        } catch (error: any) {
            if (error.response?.status === 401) {
                throw new Error('토큰이 만료되었습니다. 다시 로그인해주세요.');
            }
            throw error;
        }
    },
    
    // 사용자별 환불률 TOP3 조회
    getRefundCustomerTop: async (): Promise<AdminRefundCustomerTopDto[]> => {
        try {
            const response = await refundsApi.get('/admin/statistics/refunds/customers/top');
            return response.data;
        } catch (error: any) {
            if (error.response?.status === 401) {
                throw new Error('토큰이 만료되었습니다. 다시 로그인해주세요.');
            }
            throw error;
        }
    },

    // 매니저별 환불금액 TOP3 조회
    getRefundManagerTop: async (): Promise<AdminRefundManagerTopDto[]> => {
        try {
            const response = await refundsApi.get('/admin/statistics/refunds/managers/top');
            return response.data;
        } catch (error: any) {
            if (error.response?.status === 401) {
                throw new Error('토큰이 만료되었습니다. 다시 로그인해주세요.');
            }
            throw error;
        }
    },

    // 환불 승인
    approveRefund: async (payId: number): Promise<void> => {
        try {
            await refundsApi.put(`/admin/refunds/${payId}/approve`);
        } catch (error: any) {
            if (error.response?.status === 401) {
                throw new Error('토큰이 만료되었습니다. 다시 로그인해주세요.');
            }
            throw error;
        }
    },

    // 환불 거절
    rejectRefund: async (payId: number): Promise<void> => {
        try {
            await refundsApi.put(`/admin/refunds/${payId}/reject`);
        } catch (error: any) {
            if (error.response?.status === 401) {
                throw new Error('토큰이 만료되었습니다. 다시 로그인해주세요.');
            }
            throw error;
        }
    },
};