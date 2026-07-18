import api from './api';

export interface BlogPost {
  id: number;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  category: string;
  image?: string;
  user_id: number | null;
  user?: {
    id: number;
    name: string;
  };
  is_published: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface BlogPostFilters {
  search?: string;
  category?: string;
  page?: number;
}

export const blog = {
  async getAll(filters?: BlogPostFilters) {
    const params: any = {};

    if (filters) {
      if (filters.page) params.page = filters.page;
      if (filters.search && filters.search.trim()) params.search = filters.search.trim();
      if (filters.category) params.category = filters.category;
    }

    const { data } = await api.get('/blog-posts', { params });
    return data;
  },

  async getOne(slug: string) {
    const { data } = await api.get(`/blog-posts/${slug}`);
    return data;
  },
};
