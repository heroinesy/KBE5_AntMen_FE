import { AdminMatchingStatisticsResponseDto } from './types';
import { getCookie, ADMIN_TOKEN_COOKIE } from '../lib/cookie';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:9093/api/v1';

// 매칭 통계 API 인스턴스
const matchingApi = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 요청 인터셉터: 토큰 자동 추가
matchingApi.interceptors.request.use(
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
matchingApi.interceptors.response.use(
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

// 매칭 통계 대시보드 및 매니저 TOP 리스트 조회
export async function fetchAdminMatchingStatistics(): Promise<AdminMatchingStatisticsResponseDto> {
  const response = await matchingApi.get<AdminMatchingStatisticsResponseDto>(
    '/admin/statistics/matchings'
  );
  return response.data;
}
