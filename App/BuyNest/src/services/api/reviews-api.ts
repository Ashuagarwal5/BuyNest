import { apiRequest } from './client';
import { ApiError } from './api-error';
import { asArray, asBoolean, asInteger, asNullableString, asObject, asOneOf, asString } from './parse';

export type ReviewInput = { rating: number; title: string; content: string };
export type Review = ReturnType<typeof parseReview>;
export type OwnReview = ReturnType<typeof parseOwnReview>;
export type Eligibility = Awaited<ReturnType<typeof fetchReviewEligibility>>;
export type ReviewSort = 'recent' | 'highest' | 'lowest';
const headers = (token: string) => ({ Authorization: `Bearer ${token}` });
const path = (productId: string) => `/account/reviews/product/${encodeURIComponent(productId)}`;

function parseReview(value: unknown) {
  const r = asObject(value);
  const rating = asInteger(r.rating);
  if (rating < 1 || rating > 5) throw new ApiError('MALFORMED_RESPONSE');
  return { id: asString(r.id), productId: asString(r.productId), productName: asString(r.productName), rating,
    title: asString(r.title), content: asString(r.content), reviewerName: asString(r.reviewerName),
    origin: asOneOf(r.origin, ['CUSTOMER', 'ADMIN_ENTERED', 'IMPORTED'] as const), sourceLabel: asNullableString(r.sourceLabel),
    verifiedPurchase: asBoolean(r.verifiedPurchase), status: asOneOf(r.status, ['PENDING', 'PUBLISHED', 'REJECTED', 'HIDDEN'] as const),
    createdAt: asString(r.createdAt), updatedAt: asString(r.updatedAt) };
}
function parseOwnReview(value: unknown) {
  const r = asObject(value);
  return { ...parseReview(value), canEdit: asBoolean(r.canEdit), canDelete: asBoolean(r.canDelete), moderationNote: asNullableString(r.moderationNote) };
}
function pagination(value: unknown) {
  const p = asObject(value);
  return { page: asInteger(p.page), total: asInteger(p.total), totalPages: asInteger(p.totalPages) };
}
function policy(value: unknown) {
  const p = asObject(value);
  return { enabled: asBoolean(p.enabled), verifiedOnly: asBoolean(p.verifiedOnly), requireApproval: asBoolean(p.requireApproval),
    allowEditing: asBoolean(p.allowEditing), requireCollectedPayment: asBoolean(p.requireCollectedPayment),
    purchaseWindowDays: asInteger(p.purchaseWindowDays), editWindowDays: asInteger(p.editWindowDays), maxContentLength: asInteger(p.maxContentLength) };
}
export const fetchReviews = (productId: string, sort: ReviewSort, page: number, signal?: AbortSignal) =>
  apiRequest(`/products/${encodeURIComponent(productId)}/reviews?sort=${sort}&page=${page}&limit=5`, { signal, parse: (value) => {
    const r = asObject(value); const s = asObject(r.summary); const origins = asObject(s.originCounts);
    if (typeof s.average !== 'number' || !Number.isFinite(s.average) || s.average < 0 || s.average > 5) throw new ApiError('MALFORMED_RESPONSE');
    return { enabled: asBoolean(r.enabled), items: asArray(r.items, parseReview), pagination: pagination(r.pagination),
      summary: { average: s.average, count: asInteger(s.count), attributedCount: asInteger(origins.ADMIN_ENTERED) + asInteger(origins.IMPORTED),
        distribution: asArray(s.distribution, (v) => { const d = asObject(v); return { rating: asInteger(d.rating), count: asInteger(d.count) }; }) } };
  } });
export const fetchReviewEligibility = (token: string, productId: string, signal?: AbortSignal) =>
  apiRequest(path(productId), { headers: headers(token), signal, parse: (value) => {
    const r = asObject(value); const p = asObject(r.product);
    return { product: { id: asString(p.id), name: asString(p.name) }, policy: policy(r.policy), eligible: asBoolean(r.eligible),
      previouslyDeleted: asBoolean(r.previouslyDeleted), existing: r.existing === null ? null : parseOwnReview(r.existing) };
  } });
export const fetchMyReviews = (token: string, page: number, signal?: AbortSignal) =>
  apiRequest(`/account/reviews?page=${page}&limit=10`, { headers: headers(token), signal, parse: (value) => {
    const r = asObject(value); return { items: asArray(r.items, parseOwnReview), pagination: pagination(r.pagination), policy: policy(r.policy) };
  } });
export const saveReview = (token: string, productId: string, reviewId: string | null, body: ReviewInput) =>
  apiRequest(reviewId ? `/account/reviews/${encodeURIComponent(reviewId)}` : path(productId), { method: reviewId ? 'PATCH' : 'POST', headers: headers(token), body, parse: parseOwnReview });
export const deleteReview = (token: string, id: string) => apiRequest(`/account/reviews/${encodeURIComponent(id)}`, {
  method: 'DELETE', headers: headers(token), parse: (value) => { if (asObject(value).deleted !== true) throw new ApiError('MALFORMED_RESPONSE'); },
});
