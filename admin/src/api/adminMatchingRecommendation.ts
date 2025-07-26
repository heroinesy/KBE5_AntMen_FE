import { 
  MatchingRecommendationSettingsRequestDto, 
  MatchingRecommendationSettingsResponseDto 
} from '../types/matchingRecommendation';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:9093';

// 현재 매칭 추천 기준 설정 조회
export const getCurrentMatchingRecommendationSettings = async (): Promise<MatchingRecommendationSettingsResponseDto> => {
  const response = await fetch(`${API_BASE_URL}/api/admin/matching-recommendation/settings`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
    },
  });

  if (!response.ok) {
    throw new Error('매칭 추천 기준 설정 조회에 실패했습니다.');
  }

  return response.json();
};

// 매칭 추천 기준 설정 저장
export const saveMatchingRecommendationSettings = async (
  settings: MatchingRecommendationSettingsRequestDto
): Promise<MatchingRecommendationSettingsResponseDto> => {
  const response = await fetch(`${API_BASE_URL}/api/admin/matching-recommendation/settings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
    },
    body: JSON.stringify(settings),
  });

  if (!response.ok) {
    throw new Error('매칭 추천 기준 설정 저장에 실패했습니다.');
  }

  return response.json();
};

// 매칭 추천 기준 설정 기본값으로 초기화
export const resetMatchingRecommendationSettings = async (): Promise<MatchingRecommendationSettingsResponseDto> => {
  const response = await fetch(`${API_BASE_URL}/api/admin/matching-recommendation/settings/reset`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
    },
  });

  if (!response.ok) {
    throw new Error('매칭 추천 기준 설정 초기화에 실패했습니다.');
  }

  return response.json();
};

// 매칭 추천 기준 설정 히스토리 조회
export const getMatchingRecommendationSettingsHistory = async (): Promise<MatchingRecommendationSettingsResponseDto[]> => {
  const response = await fetch(`${API_BASE_URL}/api/admin/matching-recommendation/settings/history`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
    },
  });

  if (!response.ok) {
    throw new Error('매칭 추천 기준 설정 히스토리 조회에 실패했습니다.');
  }

  return response.json();
};

// 특정 설정 활성화
export const activateMatchingRecommendationSettings = async (settingsId: number): Promise<MatchingRecommendationSettingsResponseDto> => {
  const response = await fetch(`${API_BASE_URL}/api/admin/matching-recommendation/settings/${settingsId}/activate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
    },
  });

  if (!response.ok) {
    throw new Error('매칭 추천 기준 설정 활성화에 실패했습니다.');
  }

  return response.json();
};

// 특정 설정 삭제
export const deleteMatchingRecommendationSettings = async (settingsId: number): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/api/admin/matching-recommendation/settings/${settingsId}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
    },
  });

  if (!response.ok) {
    throw new Error('매칭 추천 기준 설정 삭제에 실패했습니다.');
  }
}; 