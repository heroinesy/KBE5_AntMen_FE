import { ReviewListClient } from '@/entities/review/ui/ReviewListClient';
import { type ReviewResponse } from '@/shared/api/review';

// 서버에서만 호출되는 fetch 함수
async function fetchUserReviews(userId: string): Promise<ReviewResponse[]> {
  const res = await fetch(`http://localhost:9091/api/v1/common/reviews/users/${userId}`, { cache: 'no-store' });
  if (!res.ok) return [];
  return res.json();
}

interface PageProps {
  params: { managerId: string };
}

// 날짜 포맷 함수 (마이크로초 제거)
function formatDate(dateString: string) {
  const safeString = dateString.replace(/\.\d{6}$/, '');
  const date = new Date(safeString);
  if (isNaN(date.getTime())) return '';
  return date.toLocaleDateString('ko-KR');
}

// 이름 마스킹 함수
function maskName(name: string) {
  if (!name) return '';
  if (name.length <= 2) return name;
  return name[0] + '*'.repeat(name.length - 2) + name[name.length - 1];
}

// --- 서버 컴포넌트 (기본) ---
const Page = async ({ params }: PageProps) => {
  const userId = params.managerId;
  const reviews = await fetchUserReviews(userId);
  return <ReviewListClient reviews={reviews} />;
};

export default Page; 