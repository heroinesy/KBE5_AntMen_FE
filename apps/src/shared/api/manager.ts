import { ManagerStatus } from '@/entities/manager/types'
import Cookies from 'js-cookie'

// 매니저 정보 응답 타입 (백엔드 DTO에 맞춤)
interface ManagerInfoResponse {
  userLoginId: string
  userPassword: string
  userName: string
  userTel: string
  userEmail: string
  userGender: string
  userBirth: string
  userProfile: string
  managerAddress: string
  managerLatitude: number
  managerLongitude: number
  managerTime: string
  managerFileUrls: Array<{
    id: number
    managerFileUrl: string
    originalFileName: string
    uuidFileName: string
    extension: string
    contentType: string
  }>
  managerStatus: ManagerStatus
  userType: string
}

// 매니저 거절 사유 조회 API
export const getManagerRejectionReason = async (managerId: number): Promise<string | null> => {
  try {
    // 테스트용 데이터가 있으면 우선 사용 (개발 환경)
    const testReason = localStorage.getItem(`test-rejection-reason-${managerId}`)
    if (testReason) {
      return testReason
    }

    // 쿠키에서 실제 토큰 가져오기
    const token = Cookies.get('auth-token')
    
    if (!token) {
      throw new Error('인증 토큰이 없습니다. 다시 로그인해주세요.')
    }

    // 실제 API 호출
    const response = await fetch(`http://localhost:9092/v1/manager/${managerId}/reject-reason`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token, // 쿠키에서 가져온 실제 토큰 사용
      },
      credentials: 'include', // 쿠키 포함
    })
    
    if (!response.ok) {
      if (response.status === 404) {
        // 거절 사유가 없는 경우 (정상적인 상황)
        return null
      }
      throw new Error(`거절 사유 조회 실패: ${response.status}`)
    }
    
    // 응답이 string 타입이므로 직접 반환
    const rejectionReason = await response.text()
    return rejectionReason || null
    
  } catch (error) {
    console.error('거절 사유 조회 중 오류:', error)
    return null
  }
}

// 매니저 상태 조회 API
// 매니저 상세 정보 조회 API (재신청용)
export const getManagerInfo = async (): Promise<ManagerInfoResponse> => {
  try {
    // 쿠키에서 실제 토큰 가져오기
    const token = Cookies.get('auth-token')
    console.log('🔑 사용할 토큰:', token)
    
    if (!token) {
      throw new Error('인증 토큰이 없습니다. 다시 로그인해주세요.')
    }
    
    console.log('🌐 API 호출:', 'http://localhost:9092/v1/manager/me')
    
    const response = await fetch(`http://localhost:9092/v1/manager/me`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token, // 쿠키에서 가져온 실제 토큰 사용
      },
      credentials: 'include', // 쿠키 포함
    })
    
    console.log('📡 응답 상태:', response.status, response.statusText)
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ API 에러 응답:', errorText)
      throw new Error(`매니저 정보 조회 실패: ${response.status} - ${errorText}`)
    }
    
    const managerInfo = await response.json()
    console.log('✅ API 응답 데이터:', managerInfo)
    return managerInfo
    
  } catch (error) {
    console.error('매니저 정보 조회 중 오류:', error)
    throw error
  }
}

// 매니저 정보 수정 API (재신청용 - 기존 데이터 덮어쓰기)
export const updateManagerInfo = async (formData: FormData): Promise<void> => {
  try {
    // 쿠키에서 실제 토큰 가져오기
    const token = Cookies.get('auth-token')
    
    if (!token) {
      throw new Error('인증 토큰이 없습니다. 다시 로그인해주세요.')
    }
    
    const response = await fetch(`http://localhost:9092/v1/manager/reapply`, {
      method: 'PUT',
      body: formData,
      // FormData 사용 시 Content-Type 헤더는 자동 설정됨
      headers: {
        'Authorization': token, // 쿠키에서 가져온 실제 토큰 사용
      },
      credentials: 'include', // 쿠키 포함
    })
    
    if (!response.ok) {
      throw new Error(`매니저 정보 수정 실패: ${response.status}`)
    }
    
    console.log('✅ 매니저 정보 수정 완료')
    
  } catch (error) {
    console.error('❌ 매니저 정보 수정 중 오류:', error)
    throw error
  }
}

export const getManagerStatus = async (managerId: number): Promise<ManagerStatus | null> => {
  try {
    // 쿠키에서 실제 토큰 가져오기
    const token = Cookies.get('auth-token')
    console.log('🔑 매니저 상태 조회용 토큰:', token)
    
    if (!token) {
      throw new Error('인증 토큰이 없습니다. 다시 로그인해주세요.')
    }

    // 실제 API 호출 - 매니저 정보에서 상태 추출
    console.log('🌐 매니저 상태 API 호출:', `http://localhost:9092/v1/manager/me`)
    
    const response = await fetch(`http://localhost:9092/v1/manager/me`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token, // 쿠키에서 가져온 실제 토큰 사용
      },
      credentials: 'include', // 쿠키 포함
    })
    
    console.log('📡 매니저 상태 응답:', response.status, response.statusText)
    
    if (!response.ok) {
      if (response.status === 404) {
        console.warn('매니저 정보가 없습니다')
        return null
      }
      const errorText = await response.text()
      console.error('❌ 매니저 상태 API 에러:', errorText)
      throw new Error(`매니저 상태 조회 실패: ${response.status} - ${errorText}`)
    }
    
    const managerInfo = await response.json()
    console.log('✅ 매니저 정보 응답:', managerInfo)
    
    // 매니저 정보에서 상태 추출
    const status = managerInfo.managerStatus as ManagerStatus
    console.log('🎯 추출된 매니저 상태:', status)
    
    return status || null
    
  } catch (error) {
    console.error('매니저 상태 조회 중 오류:', error)
    throw error // 에러를 다시 던져서 호출하는 곳에서 처리할 수 있도록
  }
} 