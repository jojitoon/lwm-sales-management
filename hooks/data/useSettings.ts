import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

export const useSettings = () =>
  useQuery({
    queryKey: ['settings'],
    queryFn: getSettings,
  });

const getSettings = async () => {
  const { data } = await axios.get('/api/settings');
  return data;
};
