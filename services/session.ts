import axios from 'axios';

export const getMySession = async (userId: string) => {
  const { data } = await axios.get(`/api/session/${userId}`);

  return data;
};
