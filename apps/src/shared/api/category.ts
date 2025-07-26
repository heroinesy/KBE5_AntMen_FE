import { customFetch } from './base'

// swagger에 정의된 CategoryResponseDto를 기반으로 타입을 정의합니다.
export interface Category {
  categoryId: number
  categoryName: string
  categoryPrice: number
  categoryTime: number
}

/**
 * 전체 서비스 카테고리 목록을 조회하는 API 함수
 * @returns Category[]
 */
export const getAllCategories = async (): Promise<Category[]> => {
  return customFetch<Category[]>('http://localhost:9090/api/v1/common/categories')
}

// swagger에 정의된 CategoryOptionResponseDto를 기반으로 타입을 정의합니다.
export interface CategoryOption {
  coId: number
  coName: string
  coPrice: number
  coTime: number
}

/**
 * 특정 ID의 카테고리 상세 정보를 조회하는 API 함수
 * @param categoryId - 조회할 카테고리의 ID
 * @returns Category
 */
export const getCategoryById = async (
  categoryId: string,
): Promise<Category> => {
  return customFetch<Category>(`http://localhost:9090/api/v1/common/categories/${categoryId}`)
}

/**
 * 특정 카테고리에 속한 옵션 목록을 조회하는 API 함수
 * @param categoryId - 옵션을 조회할 카테고리의 ID
 * @returns CategoryOption[]
 */
export const getCategoryOptionsByCategoryId = async (
  categoryId: string,
): Promise<CategoryOption[]> => {
  return customFetch<CategoryOption[]>(
    `http://localhost:9091/api/v1/customer/categories/${categoryId}/options`,
  )
}
