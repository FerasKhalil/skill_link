import { destroySession } from '@/lib/auth';
import { apiSuccess } from '@/lib/api-helpers';

export async function POST() {
  try {
    await destroySession();
    return apiSuccess({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    return apiSuccess({ message: 'Logged out' });
  }
}
