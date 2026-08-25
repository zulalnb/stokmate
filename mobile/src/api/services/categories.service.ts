import { apiClient } from '../client';

export type Category = {
  id: number;
  name: string;
  slug: string;
  sortOrder: number;
};

export const categoriesService = {
  getCategories: () => apiClient.get<Category[]>('/categories'),
};
