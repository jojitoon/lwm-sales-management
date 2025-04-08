import { getMySession } from '@/services/session';
import { useQuery } from '@tanstack/react-query';

export const useMySession = (userId: string) => {
  return useQuery({
    queryKey: ['mySession', userId],
    queryFn: () => getMySession(userId),
    enabled: !!userId,
  });
};
