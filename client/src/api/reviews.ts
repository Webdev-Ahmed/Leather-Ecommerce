import api from "@/lib/axios";
import type { PaginatedResponse, ApiSuccess } from "@/types/api";

export type Review = {
  id: string;
  body: string;
  createdAt: string;
  updatedAt: string;
  productId: string;
  user: {
    id: string;
    name: string;
    avatarUrl: string | null;
  };
};

export type CreateReviewInput = {
  body: string;
};

export async function getReviews(
  slug: string,
  page = 1,
  limit = 10,
): Promise<PaginatedResponse<Review>> {
  const res = await api.get(`/products/${slug}/reviews`, {
    params: { page, limit },
  });
  return res.data;
}

export async function createReview(
  slug: string,
  input: CreateReviewInput,
): Promise<Review> {
  const res = await api.post<ApiSuccess<Review>>(
    `/products/${slug}/reviews`,
    input,
  );
  return res.data.data;
}

export async function updateReview(
  slug: string,
  reviewId: string,
  input: CreateReviewInput,
): Promise<Review> {
  const res = await api.patch<ApiSuccess<Review>>(
    `/products/${slug}/reviews/${reviewId}`,
    input,
  );
  return res.data.data;
}

export async function deleteReview(
  slug: string,
  reviewId: string,
): Promise<void> {
  await api.delete(`/products/${slug}/reviews/${reviewId}`);
}
