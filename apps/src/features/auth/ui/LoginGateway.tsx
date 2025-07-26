'use client'

import { useSearchParams } from 'next/navigation'
import { useEffect, useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Cookies from 'js-cookie'
import { useSocialProfileStore } from '@/shared/stores/socialProfileStore'
import { useAuthStore } from '@/shared/stores/authStore'
import { useSecureAuth } from '@/shared/hooks/useSecureAuth'
import { jwtDecode } from 'jwt-decode'

interface JwtPayload {
  sub: string // userId
  userRole: 'CUSTOMER' | 'MANAGER' | 'ADMIN'
  exp: number // 만료 시간
  iat: number // 발급 시간
}

interface AuthResponse {
  success: boolean
  token?: string
  message?: string
  user_email?: string
  user_id?: string
  user_type?: string
}

export function LoginGateway() {
  const searchParams = useSearchParams()
  const code = searchParams?.get('code') ?? null
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const { setSocialProfile } = useSocialProfileStore()
  const { login: loginToStore } = useAuthStore()

  // 🔥 중복 실행 방지를 위한 ref
  const isProcessing = useRef(false)
  const processedCode = useRef<string | null>(null)

  const handleGoogleLogin = useCallback(
    async (authCode: string) => {
      // 이미 처리 중이면 리턴
      if (isProcessing.current) {
        console.log('⚠️ 이미 처리 중입니다. 중복 실행 방지')
        return
      }

      isProcessing.current = true // 처리 시작 플래그
      setIsLoading(true)
      setError(null)

      try {
        console.log('📡 서버 요청 시작')

        const response = await fetch(
          'http://localhost:9090/api/v1/auth/google/login',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              code: authCode,
              timestamp: new Date().toISOString(),
            }),
          },
        )

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const result: AuthResponse = await response.json()
        console.log('✅ 서버 응답:', result)

        if (result.success && result.token) {
          console.log('✅ 구글 로그인 성공, 토큰:', result.token)

          // 1. JWT 토큰 디코딩
          const decodedToken = jwtDecode<JwtPayload>(result.token)
          console.log('🔑 토큰 디코딩 결과:', decodedToken)

          // 2. JWT에서 추출한 정보로 Zustand 스토어에 저장할 사용자 객체 구성
          const user = {
            userId: parseInt(decodedToken.sub),
            userRole: decodedToken.userRole,
          }

          // 3. Zustand 스토어에 로그인 정보 저장
          await loginToStore(user, result.token)

          // 4. 쿠키에 토큰 저장 (7일 만료)
          Cookies.set('auth-token', formatTokenForServer(result.token), {
            expires: 7, // 7일 후 만료
            secure: false, // HTTPS에서만 전송
            sameSite: 'strict', // CSRF 공격 방지
            path: '/', // 모든 경로에서 접근 가능
          })

          Cookies.set('auth-time', new Date().toISOString(), {
            expires: 7,
            secure: false,
            sameSite: 'strict',
            path: '/',
          })

          // 5. userRole에 따라 리다이렉트 경로 설정
          const redirectPath = user.userRole === 'MANAGER' ? '/manager' : '/'
          console.log(`🏠 ${user.userRole} 권한으로 ${redirectPath}로 이동`)
          router.push(redirectPath)
        } else if (!result.success && result.user_email) {
          console.log('✨ 신규 소셜 사용자, 회원가입 페이지로 이동')
          setSocialProfile({
            id: result.user_id as string,
            email: result.user_email,
            provider: result.user_type as string,
          })
          router.push('/signup')
        } else {
          console.log('❌ 알 수 없는 응답, 로그인 페이지로 이동')
          setError(
            result.message || '로그인에 실패했습니다. 다시 시도해주세요.',
          )
          setTimeout(() => router.push('/login'), 3000)
        }
      } catch (err) {
        console.error('❌ 구글 로그인 처리 중 오류:', err)
        setError(
          err instanceof Error ? err.message : '로그인 중 오류가 발생했습니다.',
        )

        setTimeout(() => {
          console.log('⏰ 3초 후 로그인으로 재이동')
          router.push('/login')
        }, 3000)
      } finally {
        setIsLoading(false)
        // 주의: 여기서 isProcessing을 false로 하지 말 것!
        // 한 번 처리된 코드는 다시 처리하지 않도록 함
      }
    },
    [loginToStore, router, setSocialProfile],
  )

  useEffect(() => {
    // 코드가 있고, 아직 처리 중이 아니고, 이전에 처리한 코드와 다를 때만 실행
    if (code && !isProcessing.current && processedCode.current !== code) {
      console.log('🚀 Google 로그인 처리 시작:', code)
      processedCode.current = code // 현재 코드 저장
      handleGoogleLogin(code)
    }
  }, [code, handleGoogleLogin])

  const formatTokenForServer = (token: string): string => {
    // 기존 "Bearer " 접두사 제거 (공백 포함/미포함 모두 처리)
    const cleanToken = token.replace(/^Bearer\s*/i, '')
    // "Bearer " (공백 포함) + 토큰 형태로 반환
    return `Bearer ${cleanToken}`
  }

  return null
}
