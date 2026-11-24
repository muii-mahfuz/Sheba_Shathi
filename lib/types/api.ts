/** The error envelope every endpoint returns on a non-2xx. */
export interface ApiErrorBody {
  error: string;
  message: string;
  details?: Record<string, string[]>;
}
