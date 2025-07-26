interface CheckLoginIdResponse {
  available: boolean
}

/**
 * 로그인 아이디 중복 체크 API
 */
export const checkLoginId = async (loginId: string): Promise<boolean> => {
  try {
    const response = await fetch(
      `http://localhost:9090/api/v1/auth/check-id?loginId=${loginId}`,
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )

    if (!response.ok) {
      throw new Error('아이디 중복 체크 중 오류가 발생했습니다')
    }

    const data = await response.json()
    return data.available
  } catch (error) {
    console.error('아이디 중복 체크 실패:', error)
    throw new Error('아이디 중복 체크 중 오류가 발생했습니다')
  }
} 