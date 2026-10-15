/** Problems that happen on the device, or on the way, instead of a proper server answer. */
type ClientErrorCode =
  | 'NETWORK_ERROR'
  | 'TIMEOUT'
  /** The server answered with a 5xx that is not in the API's own error format. */
  | 'SERVER_ERROR'
  | 'MALFORMED_RESPONSE'
  | 'CONFIGURATION_ERROR'
  /** The device could not save something it must keep before it is safe to continue. */
  | 'STORAGE_ERROR'
  | 'SIGN_OUT_FAILED';

/** Codes the backend can return (see Backend/src/lib/errors.ts). */
type ServerErrorCode =
  | 'REVIEW_NOT_FOUND'
  | 'REVIEW_EXISTS'
  | 'REVIEW_NOT_ELIGIBLE'
  | 'REVIEWS_DISABLED'
  | 'REVIEW_POLICY'
  | 'VALIDATION_ERROR'
  | 'INVALID_JSON'
  | 'PAYLOAD_TOO_LARGE'
  | 'ROUTE_NOT_FOUND'
  | 'CATALOG_CHANGED'
  | 'QUANTITY_LIMIT'
  | 'PRODUCT_NOT_FOUND'
  | 'PRODUCT_UNAVAILABLE'
  | 'DELIVERY_AREA_NOT_FOUND'
  | 'DELIVERY_AREA_UNAVAILABLE'
  | 'DELIVERY_PINCODE_UNSUPPORTED'
  | 'OUT_OF_STOCK'
  | 'MINIMUM_ORDER_NOT_MET'
  | 'ORDER_NOT_FOUND'
  | 'NOTIFICATION_NOT_FOUND'
  | 'INVALID_TRACKING_TOKEN'
  | 'ORDER_CANNOT_BE_CANCELLED'
  | 'IDEMPOTENCY_CONFLICT'
  | 'UNAUTHENTICATED'
  | 'FORBIDDEN'
  | 'ACCOUNT_EXISTS'
  | 'ACCOUNT_LINK_REQUIRED'
  | 'ADDRESS_NOT_FOUND'
  | 'ADDRESS_BOOK_FULL'
  | 'EMAIL_NOT_CONFIGURED'
  | 'EMAIL_SEND_FAILED'
  | 'GOOGLE_NOT_CONFIGURED'
  | 'INVALID_OTP'
  | 'INVALID_GOOGLE_TOKEN'
  | 'TOO_MANY_REQUESTS'
  | 'SERVICE_UNAVAILABLE'
  | 'INTERNAL_ERROR';

export type ApiErrorCode = ClientErrorCode | ServerErrorCode | 'UNKNOWN_ERROR';

const KNOWN_SERVER_CODES: ServerErrorCode[] = [
  'REVIEW_NOT_FOUND', 'REVIEW_EXISTS', 'REVIEW_NOT_ELIGIBLE', 'REVIEWS_DISABLED', 'REVIEW_POLICY',
  'VALIDATION_ERROR',
  'INVALID_JSON',
  'PAYLOAD_TOO_LARGE',
  'ROUTE_NOT_FOUND',
  'CATALOG_CHANGED',
  'QUANTITY_LIMIT',
  'PRODUCT_NOT_FOUND',
  'PRODUCT_UNAVAILABLE',
  'DELIVERY_AREA_NOT_FOUND',
  'DELIVERY_AREA_UNAVAILABLE',
  'DELIVERY_PINCODE_UNSUPPORTED',
  'OUT_OF_STOCK',
  'MINIMUM_ORDER_NOT_MET',
  'ORDER_NOT_FOUND',
  'NOTIFICATION_NOT_FOUND',
  'INVALID_TRACKING_TOKEN',
  'ORDER_CANNOT_BE_CANCELLED',
  'IDEMPOTENCY_CONFLICT',
  'UNAUTHENTICATED',
  'FORBIDDEN',
  'ACCOUNT_EXISTS',
  'ACCOUNT_LINK_REQUIRED',
  'ADDRESS_NOT_FOUND',
  'ADDRESS_BOOK_FULL',
  'EMAIL_NOT_CONFIGURED',
  'EMAIL_SEND_FAILED',
  'GOOGLE_NOT_CONFIGURED',
  'INVALID_OTP',
  'INVALID_GOOGLE_TOKEN',
  'TOO_MANY_REQUESTS',
  'SERVICE_UNAVAILABLE',
  'INTERNAL_ERROR',
];

export function toApiErrorCode(value: unknown): ApiErrorCode {
  return KNOWN_SERVER_CODES.includes(value as ServerErrorCode)
    ? (value as ServerErrorCode)
    : 'UNKNOWN_ERROR';
}

/**
 * These server messages are written for customers and carry specifics the app cannot
 * know ("Only 3 of Football available."), so they are shown as they are. Every other
 * code gets a fixed message from here, so technical server text never reaches the screen.
 */
const SHOW_SERVER_MESSAGE: ApiErrorCode[] = [
  'OUT_OF_STOCK',
  'PRODUCT_UNAVAILABLE',
  'DELIVERY_AREA_UNAVAILABLE',
  // Written for customers by the server: "wait 40 seconds", "that code is not correct".
  'INVALID_OTP',
  'TOO_MANY_REQUESTS',
];

const MESSAGES: Record<ApiErrorCode, string> = {
  REVIEW_NOT_FOUND: 'This review is no longer available. Refresh your reviews.',
  REVIEW_EXISTS: 'You have already submitted a review for this product.',
  REVIEW_NOT_ELIGIBLE: 'An eligible delivered purchase on this account is required. Check the review policy and your orders.',
  REVIEWS_DISABLED: 'Product reviews are currently disabled.',
  REVIEW_POLICY: 'This change is unavailable under the current review policy. Refresh your review or contact the shop.',
  NETWORK_ERROR: 'Could not reach DoorKart. Check your internet connection and try again.',
  TIMEOUT: 'The request took too long. Please try again.',
  SERVER_ERROR: 'DoorKart is having trouble right now. Please try again shortly.',
  MALFORMED_RESPONSE: 'DoorKart sent an unexpected response. Please try again.',
  CONFIGURATION_ERROR: 'The app is not set up correctly. Please update or reinstall it.',
  STORAGE_ERROR:
    'Your phone could not save these details. Free up some storage space and try again.',
  SIGN_OUT_FAILED: 'Sign-out could not be completed securely. Reconnect to the internet, sign in again and retry sign-out before sharing this phone.',
  VALIDATION_ERROR: 'Some details were not accepted. Please check them and try again.',
  INVALID_JSON: 'Something went wrong sending your request. Please try again.',
  PAYLOAD_TOO_LARGE: 'Something went wrong sending your request. Please try again.',
  ROUTE_NOT_FOUND: 'This feature is not available right now.',
  CATALOG_CHANGED: 'The combo contents changed. Refresh your cart and try again.',
  QUANTITY_LIMIT: 'This order requests too many units. Reduce a pack or combo quantity.',
  PRODUCT_NOT_FOUND: 'This product is no longer available.',
  PRODUCT_UNAVAILABLE: 'A product in your cart is no longer available.',
  DELIVERY_AREA_NOT_FOUND: 'This delivery area is no longer available. Please choose another.',
  DELIVERY_AREA_UNAVAILABLE: 'We no longer deliver to this area. Please choose another.',
  DELIVERY_PINCODE_UNSUPPORTED:
    'Delivery is unavailable for this pincode in the selected area. Check your address or choose another delivery area.',
  OUT_OF_STOCK: 'A product in your cart is out of stock.',
  MINIMUM_ORDER_NOT_MET: 'Your order is below the minimum for this delivery area.',
  ORDER_NOT_FOUND: 'This order could not be found.',
  NOTIFICATION_NOT_FOUND: 'This notification is no longer available.',
  INVALID_TRACKING_TOKEN: 'This order cannot be opened from this device.',
  ORDER_CANNOT_BE_CANCELLED: 'This order can no longer be cancelled.',
  IDEMPOTENCY_CONFLICT: 'This order could not be submitted. Please review your order and try again.',
  UNAUTHENTICATED: 'Your sign-in has ended. Please sign in again.',
  FORBIDDEN: 'This action is not allowed for your account. Check the account you selected or contact support.',
  ACCOUNT_EXISTS: 'An account already exists for this email. Sign in instead.',
  ACCOUNT_LINK_REQUIRED: 'This email already has an account. Sign in with an email code, then link Google in Account settings.',
  ADDRESS_NOT_FOUND: 'This address could not be found. Refresh your saved addresses.',
  ADDRESS_BOOK_FULL: 'Your address book is full. Delete an address before adding another.',
  EMAIL_NOT_CONFIGURED: 'Email sign-in is unavailable right now. Please try again later or continue as a guest.',
  EMAIL_SEND_FAILED: 'We could not send your email code. Please try again shortly.',
  GOOGLE_NOT_CONFIGURED: 'Google sign-in is unavailable right now. Please use an email code.',
  INVALID_OTP: 'That code is not correct or has expired.',
  INVALID_GOOGLE_TOKEN: 'Google sign-in did not work. Please try again.',
  TOO_MANY_REQUESTS: 'Too many attempts. Please wait a moment and try again.',
  SERVICE_UNAVAILABLE: 'DoorKart is temporarily unavailable. Please try again shortly.',
  INTERNAL_ERROR: 'Something went wrong on our side. Please try again.',
  UNKNOWN_ERROR: 'Something went wrong. Please try again.',
};

type ApiErrorOptions = {
  status?: number;
  serverMessage?: string;
  details?: unknown;
};

/** Every failed API call rejects with one of these; `message` is always safe to show. */
export class ApiError extends Error {
  readonly code: ApiErrorCode;
  readonly status: number | undefined;
  readonly details: unknown;

  constructor(code: ApiErrorCode, options: ApiErrorOptions = {}) {
    const useServerMessage = SHOW_SERVER_MESSAGE.includes(code) && options.serverMessage;
    super(useServerMessage ? options.serverMessage : MESSAGES[code]);
    this.name = 'ApiError';
    this.code = code;
    this.status = options.status;
    this.details = options.details;
  }

  /**
   * True when the app cannot know whether the server acted on the request: the answer
   * never arrived (network drop, timeout), could not be read, or was a server failure
   * that may have happened after the work was done.
   *
   * For an order submission this is the line between "not placed" and "maybe placed".
   * An unknown outcome must be retried with the SAME request, never treated as a failure
   * and never answered with a new order. An unrecognized response or unexpected local
   * exception also cannot establish that the server refused the order. Recognized
   * business refusals (validation, out of stock, unavailable delivery, minimum order)
   * give a definite answer: no order was created.
   */
  get isOutcomeUnknown(): boolean {
    return (
      this.code === 'NETWORK_ERROR' ||
      this.code === 'TIMEOUT' ||
      this.code === 'SERVER_ERROR' ||
      this.code === 'MALFORMED_RESPONSE' ||
      this.code === 'UNKNOWN_ERROR' ||
      (this.status !== undefined && this.status >= 500)
    );
  }
}

export function toApiError(error: unknown): ApiError {
  return error instanceof ApiError ? error : new ApiError('UNKNOWN_ERROR');
}
