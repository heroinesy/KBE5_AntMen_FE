import { customFetch } from './base'

const BASE_URL = 'http://localhost:9090/api/v1/common/alerts'

export interface Alert {
  alertId: number
  alertContent: string
  redirectUrl: string
  createdAt: string
  read: boolean
}

// 백엔드 응답을 프론트엔드 타입으로 변환
const transformToNotification = (alert: Alert) => ({
  id: String(alert.alertId),
  title: '',  // 알림 타입에 따라 다르게 설정할 수 있음
  message: alert.alertContent,
  type: 'system' as const,  // 기본값으로 system 설정
  isRead: alert.read,
  createdAt: alert.createdAt,
  redirectUrl: alert.redirectUrl
})

export const alertApi = {
  // 알림 목록 조회
  getAlerts: () => 
    customFetch<Alert[]>(`${BASE_URL}`),

  // 읽지 않은 알림 개수 조회
  getUnreadCount: async (): Promise<number> => {
    const alerts = await alertApi.getAlerts()
    return alerts.filter(alert => !alert.read).length
  },

  // 단일 알림 조회
  getAlert: (alertId: string) =>
    customFetch<Alert>(`${BASE_URL}/${alertId}`),

  // 알림 읽음 처리
  markAsRead: (alertId: string) =>
    customFetch(`${BASE_URL}/${alertId}/read`, {
      method: 'PATCH',
    }),

  // 모든 알림 읽음 처리
  markAllAsRead: () =>
    customFetch(`${BASE_URL}`, {
      method: 'PATCH',
    }),
} 