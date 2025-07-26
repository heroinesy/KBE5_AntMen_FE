import { customFetch } from './base'

export interface CustomerAddressRequest {
  addressName: string;
  addressAddr: string;
  addressDetail: string;
  addressArea: number;
  customerLatitude?: number;
  customerLongitude?: number;
}

export interface CustomerAddressResponse {
  addressId: number;
  addressName: string;
  addressAddr: string;
  addressDetail: string;
  addressArea: number;
  customerLatitude?: number;
  customerLongitude?: number;
}

// 쿠키에서 값 읽는 함수 (최상위에 선언)
function getCookie(name: string): string | undefined {
  if (typeof document === 'undefined') return undefined;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift();
}

// 주소 목록 조회
export const fetchAddresses = async (): Promise<CustomerAddressResponse[]> => {
  // 클라이언트 환경에서만 쿠키를 읽음
  const token = getCookie('auth-token');
  const decodedToken = token ? decodeURIComponent(token) : null;
  const res = await fetch('http://localhost:9091/customers/address', {
    method: 'GET',
    credentials: 'include',
    headers: decodedToken ? { Authorization: decodedToken } : {},
  });
  if (!res.ok) throw new Error('주소 목록 조회 실패');
  return res.json();
};

// 주소 등록
export const createAddress = async (
  data: CustomerAddressRequest,
): Promise<CustomerAddressResponse> => {
  const token = getCookie('auth-token');
  const decodedToken = token ? decodeURIComponent(token) : null;

  // ✅ 디버깅: 전송 데이터 확인
  console.log('주소 등록 데이터 (위경도 포함):', data);

  const res = await fetch('http://localhost:9091/customers/address', {
    method: 'POST',
    credentials: 'include',
    headers: decodedToken
      ? { 'Content-Type': 'application/json', Authorization: decodedToken }
      : { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('주소 등록 실패');
  return res.json();
};

// 주소 수정
export const updateAddress = (addressId: number, data: CustomerAddressRequest) => {
  return customFetch<CustomerAddressResponse>(`http://localhost:9091/customers/address/${addressId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
};

// 주소 삭제
export const deleteAddress = (addressId: number) =>
  customFetch<void>(`http://localhost:9091/customers/address/${addressId}/delete`, {
    method: 'DELETE',
  }); 