// components/LoginOrigin.tsx

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Cookies from 'js-cookie'
import { useAuthStore } from '@/shared/stores/authStore'
import { useSecureAuth } from '@/shared/hooks/useSecureAuth'
import { jwtDecode } from 'jwt-decode'

type UserRole = 'CUSTOMER' | 'MANAGER' | 'ADMIN'

interface LoginFormData {
  userLoginId: string
  userPassword: string
}

interface LoginResponse {
  success: boolean
  token?: string
  managerStatus?: 'WAITING' | 'APPROVED' | 'REJECTED' | 'REAPPLY' // 백엔드 enum과 매핑
  message?: string
}

interface JwtPayload {
  sub: string // userId (JWT 표준은 'sub'를 subject/id로 사용)
  userRole: string // CUSTOMER | MANAGER | ADMIN
  exp: number // 만료 시간
  iat: number // 발급 시간
}

// 역할 값이 유효한지 검증하는 타입 가드
function isValidUserRole(role: string): role is UserRole {
  return ['CUSTOMER', 'MANAGER', 'ADMIN'].includes(role)
}

export function useLoginOrigin() {
  const [isLoading, setIsLoading] = useState(false)
  const [loginError, setLoginError] = useState<string | null>(null)
  const router = useRouter()
  const { login: loginToStore, fetchMatchingRequestCount } = useAuthStore()

  const login = async (data: LoginFormData) => {
    // console.log('Login attempt with:', data)

    // 이전 에러 메시지 초기화
    setLoginError(null)

    try {
      setIsLoading(true)

      const response = await fetch('http://localhost:9090/api/v1/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userLoginId: data.userLoginId,
          userPassword: data.userPassword,
        }),
      })

      if (!response.ok) {
        // 서버에서 내려주는 에러 메시지 추출 시도
        let errorMessage = '로그인에 실패했습니다.'
        
        try {
          const errorBody = await response.json()
          if (errorBody && errorBody.message) {
            errorMessage = errorBody.message
          }
        } catch (e) {
          // JSON 파싱 실패 시 상태 코드별 메시지 제공
          console.log('에러 응답 JSON 파싱 실패, 상태 코드로 메시지 결정:', response.status)
        }

        // 서버 메시지가 없거나 기본 메시지인 경우 상태 코드별 구체적 메시지 제공
        if (!errorMessage || errorMessage === '로그인에 실패했습니다.') {
          switch (response.status) {
            case 400: case 401: case 403:
              errorMessage = '아이디 또는 비밀번호를 확인해주세요.'
              break
            case 404:
              errorMessage = '존재하지 않는 계정입니다.'
              break
            case 500:
              errorMessage = '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'
              break
            case 502:
            case 503:
            case 504:
              errorMessage = '서버 점검 중입니다. 잠시 후 다시 시도해주세요.'
              break
            default:
              errorMessage = `로그인에 실패했습니다. (오류 코드: ${response.status})`
          }
        }
        
        setLoginError(errorMessage)
        return { success: false, error: errorMessage }
      }

      const result: LoginResponse = await response.json()
      // console.log('✅ 서버 응답:', result)
      
      // 매니저 상태 로깅
      if (result.managerStatus) {
        console.log('👔 매니저 상태:', result.managerStatus)
      }

      if (result.success && result.token) {
        // 1. JWT 토큰 디코딩
        const decodedToken = jwtDecode<JwtPayload>(result.token)
        // console.log('✅ 토큰 디코딩 결과:', decodedToken)

        // 2. userRole 검증
        if (!isValidUserRole(decodedToken.userRole)) {
          throw new Error('토큰에 포함된 사용자 역할이 유효하지 않습니다.')
        }

        // 3. JWT에서 추출한 정보로 Zustand 스토어에 저장할 사용자 객체 구성
        const user = {
          userId: parseInt(decodedToken.sub),
          userRole: decodedToken.userRole, // 타입이 UserRole로 보장됨
          managerStatus: result.managerStatus || null, // 🆕 백엔드에서 직접 제공하는 매니저 상태
        }
        
        // console.log('👤 생성된 사용자 객체:', user)

        // 4. Zustand 스토어에 로그인 정보 저장
        await loginToStore(user, result.token)
        console.log('💾 authStore 저장 완료')

        // 5. 쿠키에 토큰 저장 (7일 만료)
        const formattedToken = formatTokenForServer(result.token)
        Cookies.set('auth-token', formattedToken, {
          expires: 7,
          secure: false,
          sameSite: 'strict',
          path: '/',
        })
        console.log('🍪 쿠키 저장 완료')

        Cookies.set('auth-time', new Date().toISOString(), {
          expires: 7,
          secure: false,
          sameSite: 'strict',
          path: '/',
        })

        // 6. 매니저라면 매칭요청 개수 fetch (쿠키 저장 후)
        if (user.userRole === 'MANAGER') {
          await fetchMatchingRequestCount()
        }

        // 7. userRole에 따라 리다이렉트 경로 설정
        const redirectPath = user.userRole === 'MANAGER' ? '/manager' : '/'
        console.log(`🏠 ${user.userRole} 권한으로 ${redirectPath}로 이동`)
        router.push(redirectPath)

        return { success: true }
      } else {
        // 서버에서 success: false 응답
        const errorMessage = result.message || '로그인에 실패했습니다.'
        setLoginError(errorMessage)

        return { success: false, error: errorMessage }
      }
    } catch (error) {
      console.error('❌ 로그인 요청 중 오류:', error)

      const errorMessage =
        error instanceof Error
          ? error.message
          : '로그인 중 오류가 발생했습니다.'

      setLoginError(errorMessage)

      return { success: false, error: errorMessage }
    } finally {
      setIsLoading(false)
    }
  }

  const formatTokenForServer = (token: string): string => {
    // 기존 "Bearer " 접두사 제거 (공백 포함/미포함 모두 처리)
    const cleanToken = token.replace(/^Bearer\s*/i, '')
    // "Bearer " (공백 포함) + 토큰 형태로 반환
    return `Bearer ${cleanToken}`
  }

  return {
    login,
    isLoading,
    loginError,
    setLoginError,
  }
}
