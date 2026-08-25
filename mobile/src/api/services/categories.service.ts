import { apiClient } from '../axios-client';

export type Category = {
  id: number;
  name: string;
  slug: string;
  sortOrder: number;
};

export const categoriesService = {
  getCategories: () => apiClient.get<Category[]>('/categories').then((res) => res.data),
};
