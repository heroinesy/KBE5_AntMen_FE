import axios from 'axios';
import { AdminLoginRequest, AdminLoginResponse, AdminChangePasswordRequest, Admin, BoardRequestDto, ReservationMatchingListDto, ManualMatchingRequest, ReservationMatchingResponse, ReservationCancelRequest, ReservationCancelResponse, ReservationAdminResponse } from './types';
import { getCookie, ADMIN_TOKEN_COOKIE } from '../lib/cookie';

const API_BASE_URL = 'http://localhost:9093/api/v1';
const API_BASE_URL_9090 = 'http://localhost:9090/api/v1';
// const API_BASE_URL = 'http://localhost:9093/api/v1';
// const API_BASE_URL_9090 = 'http://localhost:9090/api/v1';

// 관리자 API 인스턴스
export const adminApi = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// 9090 포트용 API 인스턴스 (공지 상세 조회용)
const adminApi9090 = axios.create({
    baseURL: API_BASE_URL_9090,
    headers: {
        'Content-Type': 'application/json',
    },
});

// JWT 토큰 디코드 유틸리티 (현재 사용되지 않음)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const decodeJWT = (token: string) => {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        return JSON.parse(jsonPayload);
    } catch (error) {
        return null;
    }
};

// 요청 인터셉터: 토큰 자동 추가
adminApi.interceptors.request.use(
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
adminApi.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // 비밀번호 변경 API의 경우 자동 리다이렉트 하지 않음
            const isPasswordChangeRequest = error.config?.url?.includes('/change-password');
            
            if (!isPasswordChangeRequest) {
                // 토큰이 만료되었거나 유효하지 않은 경우
                alert('토큰이 만료되었습니다. 다시 로그인해주세요.');
                localStorage.removeItem('adminUser');
                localStorage.removeItem('adminToken');
                document.cookie = `${ADMIN_TOKEN_COOKIE}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
                window.location.href = '/admin/login';
            }
        }
        return Promise.reject(error);
    }
);

// 9090 포트용 API 인스턴스에도 인터셉터 추가
adminApi9090.interceptors.request.use(
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

adminApi9090.interceptors.response.use(
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

export const adminService = {
    // 관리자 로그인
    login: async (credentials: AdminLoginRequest): Promise<AdminLoginResponse> => {
        const response = await adminApi.post('/admin/auth/login', credentials);
        return response.data;
    },

    // 관리자 정보 조회
    getProfile: async (): Promise<Admin> => {
        try {
            const response = await adminApi.get('/admin/auth/profile');
            return response.data;
        } catch (error: any) {
            if (error.response?.status === 401) {
                throw new Error('토큰이 만료되었습니다. 다시 로그인해주세요.');
            }
            throw error;
        }
    },

    // 관리자 비밀번호 변경
    changePassword: async (data: AdminChangePasswordRequest): Promise<void> => {
        try {
            const response = await adminApi.post('/admin/auth/change-password', {
                currentPassword: data.currentPassword,
                newPassword: data.newPassword,
                confirmPassword: data.confirmPassword
            });
            
            return response.data;
        } catch (error: any) {
            if (error.response?.status === 401) {
                const errorMessage = error.response?.data?.message || error.response?.data || 'invalid token';
                
                if (errorMessage.includes('token') || errorMessage.includes('인증')) {
                    throw new Error('토큰이 만료되었습니다. 다시 로그인해주세요.');
                } else if (errorMessage.includes('비밀번호')) {
                    throw new Error('현재 비밀번호가 올바르지 않습니다.');
                } else {
                    throw new Error('토큰이 만료되었습니다. 다시 로그인해주세요.');
                }
            } else if (error.response?.status === 400) {
                const errorMessage = error.response?.data?.message || '잘못된 요청입니다.';
                throw new Error(errorMessage);
            } else {
                throw new Error('비밀번호 변경 중 오류가 발생했습니다.');
            }
        }
    },

    // 토큰 갱신
    refreshToken: async (refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> => {
        const response = await adminApi.post('/admin/auth/refresh', { refreshToken });
        return response.data;
    },

    // 로그아웃
    logout: async (): Promise<void> => {
        try {
            await adminApi.post('/admin/auth/logout');
        } catch (error) {
            // 로그아웃 요청이 실패해도 클라이언트에서는 로그아웃 처리
        } finally {
            // 로컬 스토리지와 쿠키 정리
            localStorage.removeItem('adminUser');
            localStorage.removeItem('adminToken');
            document.cookie = `${ADMIN_TOKEN_COOKIE}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
        }
    },

    // 관리자 목록 조회 (시스템 관리자만 가능)
    getAdmins: async (): Promise<Admin[]> => {
        const response = await adminApi.get('/admin/auth/admins');
        return response.data;
    },

    // 통합 공지사항 생성 (카테고리에 따라 엔드포인트 변경) - 9090 포트로 통일
    createNotice: async (data: BoardRequestDto): Promise<void> => {
        try {
            // boardType에 따라 엔드포인트 동적 설정
            const endpoint = `/board/${data.boardType}`;
            const response = await adminApi9090.post(endpoint, data);
            return response.data;
        } catch (error: any) {
            if (error.response?.status === 401) {
                throw new Error('토큰이 만료되었습니다. 다시 로그인해주세요.');
            }
            throw error;
        }
    },

    // 게시판 목록 조회 - 9093 포트
    getNotices: async (boardType: string): Promise<any[]> => {
        try {
            const endpoint = `/board/${boardType}`;
            const response = await adminApi.get(endpoint);
            return response.data;
        } catch (error: any) {
            if (error.response?.status === 401) {
                throw new Error('토큰이 만료되었습니다. 다시 로그인해주세요.');
            }
            throw error;
        }
    },

    // 특정 게시글 조회 - 9090 포트
    getNotice: async (boardId: number): Promise<any> => {
        try {
            const endpoint = `/board/${boardId}`;
            const response = await adminApi9090.get(endpoint);
            return response.data;
        } catch (error: any) {
            if (error.response?.status === 401) {
                throw new Error('토큰이 만료되었습니다. 다시 로그인해주세요.');
            }
            throw error;
        }
    },



    // 게시글 삭제 - 9090 포트
    deleteNotice: async (boardId: number): Promise<void> => {
        try {
            const endpoint = `/board/${boardId}`;
            const response = await adminApi9090.delete(endpoint);
            return response.data;
        } catch (error: any) {
            if (error.response?.status === 401) {
                throw new Error('토큰이 만료되었습니다. 다시 로그인해주세요.');
            }
            throw error;
        }
    },

    // 통합 게시판 목록 조회 - 전체 데이터 반환
    getBoardList: async (
        usertype: string,
        boardType: string,
        name?: string,
        sortBy?: string
    ): Promise<any[]> => {
        try {
            const endpoint = `/admin/board/list/${usertype}/${boardType}`;
            const params: any = {};

            if (name) {
                params.name = name;
            }
            if (sortBy) {
                params.sortBy = sortBy;
            }

            const response = await adminApi.get(endpoint, { params });
            return response.data;
        } catch (error: any) {
            if (error.response?.status === 401) {
                throw new Error('토큰이 만료되었습니다. 다시 로그인해주세요.');
            }
            throw error;
        }
    },









    // 댓글 작성 - 9090 포트
    createBoardComment: async (boardId: number, content: string, parentId?: number | null): Promise<void> => {
        try {
            const requestBody: any = {
                content: content
            };

            if (parentId !== undefined && parentId !== null) {
                requestBody.parentId = parentId;
            }

            const response = await adminApi9090.post(`/board/comment/${boardId}`, requestBody);
            return response.data;
        } catch (error: any) {
            console.error('댓글 작성 에러:', error.response?.data);
            if (error.response?.status === 401) {
                throw new Error('토큰이 만료되었습니다. 다시 로그인해주세요.');
            }
            throw error;
        }
    },

    // 게시판 수정 - 9090 포트
    updateBoard: async (boardId: number, data: any): Promise<void> => {
        try {
            const response = await adminApi9090.put(`/board/${boardId}`, data);
            return response.data;
        } catch (error: any) {
            if (error.response?.status === 401) {
                throw new Error('토큰이 만료되었습니다. 다시 로그인해주세요.');
            }
            throw error;
        }
    },

    // 게시판 삭제 - 9090 포트
    deleteBoard: async (boardId: number): Promise<void> => {
        try {
            const response = await adminApi9090.delete(`/board/${boardId}`);
            return response.data;
        } catch (error: any) {
            if (error.response?.status === 401) {
                throw new Error('토큰이 만료되었습니다. 다시 로그인해주세요.');
            }
            throw error;
        }
    },

    // 댓글 삭제 - 9090 포트
    deleteBoardComment: async (boardId: number, commentId: number): Promise<void> => {
        try {
            const response = await adminApi9090.delete(`/board/${boardId}/${commentId}`);
            return response.data;
        } catch (error: any) {
            if (error.response?.status === 401) {
                throw new Error('토큰이 만료되었습니다. 다시 로그인해주세요.');
            }
            throw error;
        }
    },

    // 댓글 수정 - 9090 포트
    updateBoardComment: async (boardId: number, commentId: number, content: string): Promise<void> => {
        try {
            const response = await adminApi9090.put(`/board/${boardId}/${commentId}`, { content });
            return response.data;
        } catch (error: any) {
            if (error.response?.status === 401) {
                throw new Error('토큰이 만료되었습니다. 다시 로그인해주세요.');
            }
            throw error;
        }
    },

    // 매칭 전 예약 목록 조회
    getReservationMatchingList: async (
        matchingStatus?: string,
        searchName?: string,
        category?: string,
        reservatedStartDate?: string,
        reservatedEndDate?: string
    ): Promise<ReservationMatchingResponse> => {
        try {
            const params: any = {};
            if (matchingStatus) params.matchingStatus = matchingStatus;
            if (searchName) params.searchName = searchName;
            if (category) params.category = category;
            if (reservatedStartDate) params.reservatedStartDate = reservatedStartDate;
            if (reservatedEndDate) params.reservatedEndDate = reservatedEndDate;

            const response = await adminApi.get('/admin/reservations/about-matching', { params });
            return response.data;
        } catch (error: any) {
            if (error.response?.status === 401) {
                throw new Error('토큰이 만료되었습니다. 다시 로그인해주세요.');
            }
            throw error;
        }
    },

    // 예약 현황 조회
    getReservationStatus: async (
        reservationStatus?: string,
        searchName?: string,
        category?: string,
        startDate?: string,
        endDate?: string
    ): Promise<ReservationAdminResponse> => {
        try {
            const params: any = {};
            if (reservationStatus) params.reservationStatus = reservationStatus;
            if (searchName) params.searchName = searchName;
            if (category) params.category = category;
            if (startDate) params.startDate = startDate;
            if (endDate) params.endDate = endDate;

            const response = await adminApi.get('/admin/reservations', { params });
            return response.data;
        } catch (error: any) {
            if (error.response?.status === 401) {
                throw new Error('토큰이 만료되었습니다. 다시 로그인해주세요.');
            }
            throw error;
        }
    },

    // 수동 매칭 요청
    createManualMatching: async (data: ManualMatchingRequest): Promise<void> => {
        try {
            const response = await adminApi.post('/admin/matching/manual', data);
            return response.data;
        } catch (error: any) {
            if (error.response?.status === 401) {
                throw new Error('토큰이 만료되었습니다. 다시 로그인해주세요.');
            }
            throw error;
        }
    },

    // 매칭 재시도
    retryMatching: async (reservationId: string): Promise<void> => {
        try {
            const response = await adminApi.post(`/admin/matching/retry/${reservationId}`);
            return response.data;
        } catch (error: any) {
            if (error.response?.status === 401) {
                throw new Error('토큰이 만료되었습니다. 다시 로그인해주세요.');
            }
            throw error;
        }
    },

    // 예약 취소
    cancelReservation: async (reservationId: string, data: ReservationCancelRequest): Promise<void> => {
        try {
            await adminApi.patch(`/admin/reservations/${reservationId}/status`, data);
        } catch (error: any) {
            if (error.response?.status === 401) {
                throw new Error('토큰이 만료되었습니다. 다시 로그인해주세요.');
            }
            throw error;
        }
    },

    // 예약 상세 정보 조회
    getReservationDetail: async (id: string): Promise<any> => {
        try {
            const response = await adminApi.get(`/admin/reservations/${id}/detail`);
            return response.data;
        } catch (error: any) {
            if (error.response?.status === 401) {
                throw new Error('토큰이 만료되었습니다. 다시 로그인해주세요.');
            }
            throw error;
        }
    },

    // 고객 수락 API
    acceptMatching: async (matchingId: string): Promise<void> => {
        try {
            const response = await adminApi.put(`/admin/reservations/matching/${matchingId}/accept`);
            return response.data;
        } catch (error: any) {
            if (error.response?.status === 401) {
                throw new Error('토큰이 만료되었습니다. 다시 로그인해주세요.');
            }
            throw error;
        }
    },

    // 관리자가 매니저 대신 수락 API (매니저가 응답하지 않은 경우)
    adminAcceptMatching: async (matchingId: string): Promise<void> => {
        try {
            const response = await adminApi.put(`/admin/reservations/matching/${matchingId}/admin-accept`);
            return response.data;
        } catch (error: any) {
            if (error.response?.status === 401) {
                throw new Error('토큰이 만료되었습니다. 다시 로그인해주세요.');
            }
            throw error;
        }
    },

    // 매칭 요청 보내기 API
    sendMatchingRequest: async (matchingId: string): Promise<void> => {
        try {
            const response = await adminApi.put('/admin/reservations/matching-request', matchingId);
            return response.data;
        } catch (error: any) {
            if (error.response?.status === 401) {
                throw new Error('토큰이 만료되었습니다. 다시 로그인해주세요.');
            }
            throw error;
        }
    },

    // 매니저 변경 API (새 엔드포인트)
    changeManager: async (reservationId: number, managerId: number): Promise<void> => {
        try {
            await axios.put(
                `${API_BASE_URL}/admin/reservations/managerChange`,
                reservationId,
                {
                    params: { managerId },
                    headers: { 'Content-Type': 'application/json' },
                }
            );
        } catch (error: any) {
            if (error.response?.status === 401) {
                throw new Error('토큰이 만료되었습니다. 다시 로그인해주세요.');
            }
            throw error;
        }
    },

    // 자동 추천 새 후보 생성 API
    createAutoCandidate: async (reservationId: string): Promise<void> => {
        try {
            const response = await adminApi.put('/admin/reservations/add-matching/auto', reservationId);
            return response.data;
        } catch (error: any) {
            if (error.response?.status === 401) {
                throw new Error('토큰이 만료되었습니다. 다시 로그인해주세요.');
            }
            throw error;
        }
    },

    // 직접 지정 새 후보 생성 API
    createManualCandidate: async (reservationId: string, managerId: string): Promise<void> => {
        try {
            const response = await adminApi.put('/admin/reservations/add-matching', reservationId, {
                params: { managerId }
            });
            return response.data;
        } catch (error: any) {
            if (error.response?.status === 401) {
                throw new Error('토큰이 만료되었습니다. 다시 로그인해주세요.');
            }
            throw error;
        }
    },

    // 매니저 검색 API
    searchManagers: async (searchTerm: string): Promise<any[]> => {
        try {
            const response = await adminApi.get('/admin/managers/search', {
                params: { searchTerm }
            });
            return response.data;
        } catch (error: any) {
            if (error.response?.status === 401) {
                throw new Error('토큰이 만료되었습니다. 다시 로그인해주세요.');
            }
            throw error;
        }
    },
}; 