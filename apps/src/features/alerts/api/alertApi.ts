import { EventSourceMessage, fetchEventSource } from '@microsoft/fetch-event-source';
import { Alert, AlertResponse } from '@/entities/alert/model/types';
import { customFetch } from '@/shared/api/base';

const ALERT_API_BASE = 'http://localhost:9090/api/v1/common/alerts';
const MAX_RETRY_COUNT = 3;

// auth-token 쿠키에서 토큰 추출
function getAuthTokenFromCookie() {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(/auth-token=([^;]+)/);
  if (!match) return null;
  return decodeURIComponent(match[1]);
}

// 백엔드 응답을 프론트엔드 형식으로 변환
const transformAlert = (response: AlertResponse): Alert => ({
  id: response.alertId,
  content: response.alertContent,
  trigger: response.alertTrigger,
  redirectUrl: response.redirectUrl,
  createdAt: response.createdAt
});

export const subscribeToAlerts = async (handlers: {
  onConnect?: () => void;
  onAlert?: (alert: Alert) => void;
  onError?: (error: Error) => void;
  signal?: AbortSignal;
}) => {
  try {
    console.log('[AlertAPI] Initiating SSE connection...');
    
    const token = getAuthTokenFromCookie();
    if (!token) {
      throw new Error('No authentication token found');
    }

    let retryCount = 0;

    await fetchEventSource(`${ALERT_API_BASE}/subscribe`, {
      method: 'GET',
      headers: {
        'Accept': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Authorization': token,
      },
      signal: handlers.signal,
      // 재시도 로직 제어
      async onopen(response) {
        if (response.ok && response.status === 200) {
          console.log('[AlertAPI] SSE connection established successfully');
          handlers.onConnect?.();
        } else {
          throw new Error(`Failed to establish SSE connection: ${response.status} ${response.statusText}`);
        }
      },
      onmessage(event: EventSourceMessage) {
        if (handlers.signal?.aborted) {
          return;
        }

        if (event.event === 'connect') {
          console.log('[AlertAPI] Received connect event:', event.data);
          return;
        }

        if (event.event === 'alert' && event.data) {
          // ★ 원본 event.data를 바로 출력
          console.log('[DEBUG] raw event.data:', event.data);
          try {
            const alertResponse: AlertResponse = JSON.parse(event.data);
            // ★ 파싱된 객체도 출력
            console.log('[DEBUG] parsed alertResponse:', alertResponse);
            const alert = transformAlert(alertResponse);
            handlers.onAlert?.(alert);
          } catch (error) {
            console.error('[AlertAPI] Failed to parse alert data:', error);
          }
        }
      },
      onclose() {
        if (!handlers.signal?.aborted) {
          console.log('[AlertAPI] Connection closed unexpectedly');
          handlers.onError?.(new Error('SSE connection closed unexpectedly'));
        }
      },
      onerror(error) {
        if (handlers.signal?.aborted) {
          return;
        }

        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('[AlertAPI] SSE connection error:', {
          message: errorMessage,
          error
        });

        if (retryCount >= MAX_RETRY_COUNT) {
          console.log('[AlertAPI] Max retry attempts reached');
          handlers.onError?.(error instanceof Error ? error : new Error(errorMessage));
          return;
        }

        retryCount++;
        console.log(`[AlertAPI] Retry attempt ${retryCount}/${MAX_RETRY_COUNT}`);
      },
      fetch: async (input: RequestInfo | URL, init?: RequestInit) => {
        try {
          const response = await fetch(input, {
            ...init,
            credentials: 'include',
            mode: 'cors',
            headers: {
              ...init?.headers,
              'Origin': window.location.origin,
            },
          });

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          return response;
        } catch (error) {
          console.error('[AlertAPI] Fetch error:', {
            name: error instanceof Error ? error.name : 'Unknown Error',
            message: error instanceof Error ? error.message : String(error),
          });
          throw error;
        }
      }
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.log('[AlertAPI] Connection aborted by client');
      return;
    }
    console.error('[AlertAPI] Failed to establish SSE connection:', error);
    handlers.onError?.(error as Error);
  }
}; 