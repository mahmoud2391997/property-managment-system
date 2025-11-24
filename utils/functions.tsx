export const buildWhatsAppLink = (phone: string, text?: string) => {
  const message = text ? encodeURIComponent(text) : '';
  return `https://wa.me/${phone}${message ? `?text=${message}` : ''}`;
};

export const buildEmailLink = (email: string, subject?: string, body?: string) => {
  const params = new URLSearchParams();
  if (subject) params.append('subject', subject);
  if (body) params.append('body', body);
  const queryString = params.toString();
  return `mailto:${email}${queryString ? `?${queryString}` : ''}`;
};