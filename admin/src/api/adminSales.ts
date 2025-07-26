import axios from 'axios';
import { AdminSalesSummaryResponseDto } from './types';
import { getCookie, ADMIN_TOKEN_COOKIE } from '../lib/cookie';

const API_BASE_URL = 'http://localhost:9093/api/v1';

// 매출 API 인스턴스
const salesApi = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// 요청 인터셉터: 토큰 자동 추가
salesApi.interceptors.request.use(
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
salesApi.interceptors.response.use(
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

export const adminSalesService = {
    // 매출 요약 정보 조회
    getSalesSummary: async (): Promise<AdminSalesSummaryResponseDto> => {
        try {
            const response = await salesApi.get('/admin/sales');
            return response.data;
        } catch (error: any) {
            if (error.response?.status === 401) {
                throw new Error('토큰이 만료되었습니다. 다시 로그인해주세요.');
            }
            throw error;
        }
    },
}