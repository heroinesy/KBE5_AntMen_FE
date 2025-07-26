import axios from 'axios';
import { AdminReviewStatisticsResponseDto } from './types';
import { getCookie, ADMIN_TOKEN_COOKIE } from '../lib/cookie';

const API_BASE_URL = 'http://localhost:9093/api/v1';

// 만족도 통계 API 인스턴스
const reviewApi = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// 요청 인터셉터: 토큰 자동 추가
reviewApi.interceptors.request.use(
    (config) => {
        let token = getCookie(ADMIN_TOKEN_COOKIE);
        if (!token) {
            token = localStorage.getItem('adminToken');
        }
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// 응답 인터셉터: 401 에러 시 로그인 페이지로 리다이렉트
reviewApi.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            alert('토큰이 만료되었습니다. 다시 로그인해주세요.');
            localStorage.removeItem('adminUser');
            localStorage.removeItem('adminToken');
            document.cookie = `${ADMIN_TOKEN_COOKIE}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
            window.location.href = '/admin/login';
        }
        return Promise.reject(error);
    }
);

export const adminReviewService = {
    // 만족도 통계 조회
    getReviewStatistics: async (topN: number = 3): Promise<AdminReviewStatisticsResponseDto> => {
        try {
            const response = await reviewApi.get(`/admin/statistics/reviews?topN=${topN}`);
            return response.data;
        } catch (error: any) {
            if (error.response?.status === 401) {
                throw new Error('토큰이 만료되었습니다. 다시 로그인해주세요.');
            }
            throw error;
        }
    },
};
