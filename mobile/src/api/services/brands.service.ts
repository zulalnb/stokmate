import { apiClient } from '../axios-client';

export type Brand = {
  id: number;
  name: string;
};

export const brandsService = {
  getBrands: () => apiClient.get<Brand[]>('/brands').then((res) => res.data),
};
