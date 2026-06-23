export const getBaseUrl = () => {
  if (process.env.NODE_ENV === 'production') {
    return process.env.NEXT_PUBLIC_SITE_URL || 'https://tenancypilot.com';
  }
  return process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:4000';
};