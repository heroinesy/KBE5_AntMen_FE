import axios from 'axios';
import { User } from './types';

// const API_BASE_URL = 'http://localhost:9093/api/v1';
const API_BASE_URL = 'http://localhost:9093/api/v1';

const userApi = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

export const userService = {
    // 고객 목록 조회 (전용 API)
    getCustomers: async (name?: string, sortBy?: string, page = 0, size = 20): Promise<any> => {
        const response = await userApi.get('/admin/users/customers', {
            params: { 
                name,  
                sortBy,
                page,
                size
            }
        });
        return response.data;
    },

    // 매니저 목록 조회 (전용 API)
    getManagers: async (name?: string, sortBy?: string, page = 0, size = 20): Promise<any> => {
        const response = await userApi.get('/admin/users/managers', {
            params: { 
                name,  
                sortBy,
                page,
                size
            }
        });
        return response.data;
    },

    // 회원 단건 조회
    getUser: async (userId: number): Promise<User> => {
        const response = await userApi.get(`/admin/users/${userId}`);
        return response.data;
    },

    // 승인 대기 중인 매니저 목록 조회
    getWaitingManagers: async (name?: string, page = 0, size = 20): Promise<any> => {
        const response = await userApi.get('/admin/users/waiting-managers', {
            params: {
                name,
                page,
                size
            }
        });
        return response.data;
    },

    // 매니저 상세 정보 조회 (승인 대기 중인 매니저용)
    getWaitingManagerDetail: async (userId: number): Promise<any> => {
        const response = await userApi.get(`/admin/users/waiting-managers/${userId}`);
        return response.data;
    },

    // 매니저 승인
    approveManager: async (userId: number): Promise<void> => {
        await userApi.post(`/admin/users/${userId}/approve`);
    },

    // 매니저 거절
    rejectManager: async (userId: number, reason: string): Promise<void> => {
        await userApi.post(`/admin/users/${userId}/reject`, null, {
            params: { reason }
        });
    },

    // 블랙리스트 회원 목록 조회
    getBlacklistUsers: async (name?: string, userRole?: string, page = 0, size = 20): Promise<any> => {
        const response = await userApi.get('/admin/users/blacklist', {
            params: {
                name,
                userRole,
                page,
                size
            }
        });
        return response.data;
    },

    // 회원을 블랙리스트에 추가
    addToBlacklist: async (userId: number, reason: string): Promise<void> => {
        await userApi.post(`/admin/users/${userId}/blacklist`, null, {
            params: { reason }
        });
    },

    // 회원을 블랙리스트에서 제거
    removeFromBlacklist: async (userId: number): Promise<void> => {
        await userApi.delete(`/admin/users/${userId}/blacklist`);
    },

    // // 사용자 생성
    // createUser: async (userData: UserRequest): Promise<User> => {
    //     const response = await userApi.post('/admin/users', userData);
    //     return response.data;
    // },

    // // 사용자 수정
    // updateUser: async (id: number, userData: Partial<UserRequest>): Promise<User> => {
    //     const response = await userApi.put(`/admin/users/${id}`, userData);
    //     return response.data;
    // },

    // 사용자 삭제
    deleteUser: async (id: number): Promise<void> => {
        await userApi.delete(`/admin/users/${id}`);
    },

    // 사용자 상태 변경
    updateUserStatus: async (id: number, status: 'active' | 'inactive' | 'suspended'): Promise<User> => {
        const response = await userApi.patch(`/admin/users/${id}/status`, { status });
        return response.data;
    },

    // 수요자별 예약 통계 조회
    getCustomerReservationStatistics: async (userId: number): Promise<any> => {
        try {
            const response = await userApi.get(`/customers/${userId}/reservation-statistics`);
            return response.data;
        } catch (error: any) {
            if (error.response?.status === 401) {
                throw new Error('토큰이 만료되었습니다. 다시 로그인해주세요.');
            }
            throw error;
        }
    },

    // 수요자별 리뷰 정보 조회
    getCustomerReviewInfo: async (userId: number): Promise<any> => {
        try {
            const response = await userApi.get(`/customers/${userId}/review-info`);
            return response.data;
        } catch (error: any) {
            if (error.response?.status === 401) {
                throw new Error('토큰이 만료되었습니다. 다시 로그인해주세요.');
            }
            throw error;
        }
    },

    // 수요자 상세정보 통합 조회 (기본정보 + 예약통계 + 리뷰정보)
    getCustomerDetail: async (userId: number): Promise<any> => {
        try {
            const response = await userApi.get(`/admin/users/customers/${userId}/detail`);
            return response.data;
        } catch (error: any) {
            if (error.response?.status === 401) {
                throw new Error('토큰이 만료되었습니다. 다시 로그인해주세요.');
            }
            throw error;
        }
    },

    // 매니저 상세정보 통합 조회 (기본정보 + 매칭통계 + 근무내역)
    getManagerDetail: async (userId: number): Promise<any> => {
        try {
            const response = await userApi.get(`/admin/users/managers/${userId}/detail`);
            return response.data;
        } catch (error: any) {
            if (error.response?.status === 401) {
                throw new Error('토큰이 만료되었습니다. 다시 로그인해주세요.');
            }
            throw error;
        }
    },
}; 