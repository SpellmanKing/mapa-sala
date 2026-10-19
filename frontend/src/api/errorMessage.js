export function getApiErrorMessage(error, fallback) {
  const data = error?.response?.data;
  const message = data?.error || data?.message;
  return typeof message === 'string' && message.trim() ? message : fallback;
}
