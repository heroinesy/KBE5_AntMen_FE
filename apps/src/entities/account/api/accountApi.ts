import { customFetch } from '@/shared/api/base';
import type { 
  UserGender, 
  CustomerProfile, 
  ManagerProfile, 
  UserProfile 
} from '../model/types';

const MANAGER_BASE_URL = 'http://localhost:9092/v1/manager';
const CUSTOMER_BASE_URL = 'http://localhost:9091/customers';

// 수요자 업데이트 요청 DTO
interface CustomerUpdateRequest {
  userName: string;
  userTel: string;
  userEmail: string;
  userBirth: string;
}

// 매니저 업데이트 요청 DTO
interface ManagerUpdateRequest {
  userName: string;
  userTel: string;
  userEmail: string;
  userBirth: string;
  managerAddress: string;
  managerLatitude: number;
  managerLongitude: number;
  managerTime: string;
  userType: string;
}

// 매니저용 API 함수들
export const managerApi = {
  getProfile: () => 
    customFetch<ManagerProfile>(`${MANAGER_BASE_URL}/me`),

  updateProfile: async (data: Partial<ManagerUpdateRequest>, files?: { profileImage?: File, identityFiles?: File[] }) => {
    // 프로필 이미지나 신분증 파일만 업데이트하는 경우
    if (Object.keys(data).length === 0 && files) {
      const formData = new FormData();

      if (files.profileImage) {
        formData.append('userProfile', files.profileImage);
        const response = await fetch(`${MANAGER_BASE_URL}/me/profile`, {
          method: 'PUT',
          body: formData,
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error('프로필 이미지 업로드에 실패했습니다');
        }
      }

      if (files.identityFiles) {
        files.identityFiles.forEach(file => {
          formData.append('managerFileUrls', file);
        });
        const response = await fetch(`${MANAGER_BASE_URL}/me/files`, {
          method: 'PUT',
          body: formData,
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error('신분증 파일 업로드에 실패했습니다');
        }
      }

      return managerApi.getProfile(); // 업데이트된 프로필 정보 반환
    }

    // 일반 정보 업데이트
    return customFetch<ManagerProfile>(`${MANAGER_BASE_URL}/me`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  updateProfileImage: async (imageFile: File) => {
    const formData = new FormData();
    formData.append('userProfile', imageFile);
    
    const response = await fetch(`${MANAGER_BASE_URL}/me/profile`, {
      method: 'PUT',
      body: formData,
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('프로필 이미지 업로드에 실패했습니다');
    }
  },
};

// 수요자용 API 함수들
export const customerApi = {
  getProfile: () => 
    customFetch<CustomerProfile>(`${CUSTOMER_BASE_URL}/me`),

  updateProfile: (data: CustomerUpdateRequest) =>
    customFetch<CustomerProfile>(`${CUSTOMER_BASE_URL}/me`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  updateProfileImage: async (imageFile: File) => {
    const formData = new FormData();
    formData.append('userProfile', imageFile);
    
    const response = await fetch(`${CUSTOMER_BASE_URL}/me/profile`, {
      method: 'PUT',
      body: formData,
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('프로필 이미지 업로드에 실패했습니다');
    }
  },
}; 