import axios from 'axios';
import { 
    CategoryDto, 
    CategoryRequestDto,
    CategoryOptionDto,
    CategoryOptionRequestDto 
} from './types';
import { getCookie, ADMIN_TOKEN_COOKIE } from '../lib/cookie';

const API_BASE_URL = 'http://localhost:9093/api/v1';

// 카테고리 API 인스턴스
const categoryApi = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// 요청 인터셉터: 토큰 자동 추가
categoryApi.interceptors.request.use(
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
categoryApi.interceptors.response.use(
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

export const adminCategoryService = {
    // 카테고리 관련 API
    /**
     * 카테고리 전체 목록 조회
     */
    getCategories: async (): Promise<CategoryDto[]> => {
        try {
            const response = await categoryApi.get('/common/categories');
            return response.data;
        } catch (error: any) {
            if (error.response?.status === 401) {
                throw new Error('토큰이 만료되었습니다. 다시 로그인해주세요.');
            }
            throw error;
        }
    },

    /**
     * 카테고리 단건 조회
     */
    getCategoryById: async (categoryId: number): Promise<CategoryDto> => {
        try {
            const response = await categoryApi.get(`/common/categories/${categoryId}`);
            return response.data;
        } catch (error: any) {
            if (error.response?.status === 401) {
                throw new Error('토큰이 만료되었습니다. 다시 로그인해주세요.');
            }
            throw error;
        }
    },

    /**
     * 새로운 카테고리 추가
     */
    createCategory: async (categoryData: CategoryRequestDto): Promise<CategoryDto> => {
        try {
            const response = await categoryApi.post('/common/categories', categoryData);
            return response.data;
        } catch (error: any) {
            if (error.response?.status === 401) {
                throw new Error('토큰이 만료되었습니다. 다시 로그인해주세요.');
            }
            throw error;
        }
    },

    /**
     * 카테고리 수정
     */
    updateCategory: async (categoryId: number, categoryData: CategoryRequestDto): Promise<CategoryDto> => {
        try {
            const response = await categoryApi.put(`/common/categories/${categoryId}`, categoryData);
            return response.data;
        } catch (error: any) {
            if (error.response?.status === 401) {
                throw new Error('토큰이 만료되었습니다. 다시 로그인해주세요.');
            }
            throw error;
        }
    },

    /**
     * 카테고리 삭제
     */
    deleteCategory: async (categoryId: number): Promise<void> => {
        try {
            await categoryApi.delete(`/common/categories/${categoryId}`);
        } catch (error: any) {
            if (error.response?.status === 401) {
                throw new Error('토큰이 만료되었습니다. 다시 로그인해주세요.');
            }
            throw error;
        }
    },

    // 카테고리 옵션 관련 API
    /**
     * 카테고리 옵션 전체 목록 조회
     */
    getCategoryOptions: async (): Promise<CategoryOptionDto[]> => {
        try {
            const response = await categoryApi.get('/admin/category-options');
            return response.data;
        } catch (error: any) {
            if (error.response?.status === 401) {
                throw new Error('토큰이 만료되었습니다. 다시 로그인해주세요.');
            }
            throw error;
        }
    },

    /**
     * 카테고리 옵션 단건 조회
     */
    getCategoryOptionById: async (coId: number): Promise<CategoryOptionDto> => {
        try {
            const response = await categoryApi.get(`/admin/category-options/${coId}`);
            return response.data;
        } catch (error: any) {
            if (error.response?.status === 401) {
                throw new Error('토큰이 만료되었습니다. 다시 로그인해주세요.');
            }
            throw error;
        }
    },

    /**
     * 새로운 카테고리 옵션 추가
     */
    createCategoryOption: async (optionData: CategoryOptionRequestDto): Promise<CategoryOptionDto> => {
        try {
            const response = await categoryApi.post('/admin/category-options', optionData);
            return response.data;
        } catch (error: any) {
            if (error.response?.status === 401) {
                throw new Error('토큰이 만료되었습니다. 다시 로그인해주세요.');
            }
            throw error;
        }
    },

    /**
     * 카테고리 옵션 수정
     */
    updateCategoryOption: async (coId: number, optionData: CategoryOptionRequestDto): Promise<CategoryOptionDto> => {
        try {
            const response = await categoryApi.put(`/admin/category-options/${coId}`, optionData);
            return response.data;
        } catch (error: any) {
            if (error.response?.status === 401) {
                throw new Error('토큰이 만료되었습니다. 다시 로그인해주세요.');
            }
            throw error;
        }
    },

    /**
     * 카테고리 옵션 삭제
     */
    deleteCategoryOption: async (coId: number): Promise<void> => {
        try {
            await categoryApi.delete(`/admin/category-options/${coId}`);
        } catch (error: any) {
            if (error.response?.status === 401) {
                throw new Error('토큰이 만료되었습니다. 다시 로그인해주세요.');
            }
            throw error;
        }
    },

    /**
     * 특정 카테고리의 옵션들만 조회 (필터링 용도)
     */
    getCategoryOptionsByCategory: async (categoryId: number): Promise<CategoryOptionDto[]> => {
        try {
            const response = await categoryApi.get(`/admin/category-options?categoryId=${categoryId}`);
            return response.data;
        } catch (error: any) {
            if (error.response?.status === 401) {
                throw new Error('토큰이 만료되었습니다. 다시 로그인해주세요.');
            }
            throw error;
        }
    }
}