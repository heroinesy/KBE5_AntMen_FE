import axios from 'axios';
import { AdminCalculationResponseDto, AdminCalculationDetailDto } from './types';
import { getCookie, ADMIN_TOKEN_COOKIE } from '../lib/cookie';

const API_BASE_URL = 'http://localhost:9093/api/v1';

// 정산 API 인스턴스
const calculationApi = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// 요청 인터셉터: 토큰 자동 추가
calculationApi.interceptors.request.use(
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
calculationApi.interceptors.response.use(
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

export const adminCalculationService = {
    // 정산 데이터 조회
    getCalculation: async (): Promise<AdminCalculationResponseDto> => {
        try {
            const response = await calculationApi.get('/admin/calculations');
            return response.data;
        } catch (error: any) {
            if (error.response?.status === 401) {
                throw new Error('토큰이 만료되었습니다. 다시 로그인해주세요.');
            }
            throw error;
        }
    },

    // 정산 상세 정보 조회
    getCalculationDetail: async (calculationId: number): Promise<AdminCalculationDetailDto> => {
        try {
            const response = await calculationApi.get(`/admin/calculations/${calculationId}`);
            return response.data;
        } catch (error: any) {
            if (error.response?.status === 401) {
                throw new Error('토큰이 만료되었습니다. 다시 로그인해주세요.');
            }
            throw error;
        }
    },
};

// 기존 함수명과의 호환성을 위한 export (기존 코드에서 사용 중인 경우)
export const getAdminCalculation = adminCalculationService.getCalculation;