export const IMAGE_CONFIGS = {
  avatar: {
    type: 'avatar' as const,
    maxSize: 2 * 1024 * 1024, // 2MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
    resize: {
      width: 256,
      height: 256,
      quality: 85
    }
  },
  event: {
    type: 'event' as const,
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
    resize: {
      width: 800,
      height: 600,
      quality: 80
    }
  }
};