import { customFetch } from '@/shared/api/base'
import type { UserData } from '../model/types'

export async function fetchUserDataApi(
  token: string,
): Promise<UserData | null> {
  try {
    return await customFetch<UserData>(
      'http://localhost:9091/customers/confirm',
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: token,
        },
      },
    )
  } catch {
    return null
  }
}
