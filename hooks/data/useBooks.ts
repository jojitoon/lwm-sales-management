import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

export const useBooks = () => {
  return useQuery({
    queryKey: ['books'],
    queryFn: fetchBooks,
  });
};

const fetchBooks = async () => {
  const response = await axios.get('/api/books');
  return response.data;
};
