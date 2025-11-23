import { toast } from 'sonner'

type FeedbackType = 'success' | 'error' | 'info' | 'warning'

interface FeedbackToastOptions {
  title: string
  description?: string
  type?: FeedbackType
  duration?: number
}

/**
 * Display a feedback toast notification
 * @param options - Toast configuration options
 * @returns Toast instance
 */
export const showFeedbackToast = ({
  title,
  description,
  type = 'success',
  duration
}: FeedbackToastOptions) => {
  const toastOptions = {
    description,
    duration
  }

  switch (type) {
    case 'success':
      return toast.success(title, toastOptions)
    case 'error':
      return toast.error(title, toastOptions)
    case 'info':
      return toast.info(title, toastOptions)
    case 'warning':
      return toast.warning(title, toastOptions)
    default:
      return toast(title, toastOptions)
  }
}

/**
 * Preset feedback toasts for common operations
 */
export const FeedbackToasts = {
  // Success messages
  created: (entityName: string, details?: string) =>
    showFeedbackToast({
      title: `${entityName} created successfully!`,
      description: details,
      type: 'success'
    }),

  updated: (entityName: string, details?: string) =>
    showFeedbackToast({
      title: `${entityName} updated successfully!`,
      description: details,
      type: 'success'
    }),

  deleted: (entityName: string, details?: string) =>
    showFeedbackToast({
      title: `${entityName} deleted successfully!`,
      description: details,
      type: 'success'
    }),

  saved: (entityName: string, details?: string) =>
    showFeedbackToast({
      title: `${entityName} saved successfully!`,
      description: details,
      type: 'success'
    }),

  // Error messages
  createFailed: (entityName: string, errorMessage?: string) =>
    showFeedbackToast({
      title: `Failed to create ${entityName}`,
      description: errorMessage || 'Please try again.',
      type: 'error'
    }),

  updateFailed: (entityName: string, errorMessage?: string) =>
    showFeedbackToast({
      title: `Failed to update ${entityName}`,
      description: errorMessage || 'Please try again.',
      type: 'error'
    }),

  deleteFailed: (entityName: string, errorMessage?: string) =>
    showFeedbackToast({
      title: `Failed to delete ${entityName}`,
      description: errorMessage || 'Please try again.',
      type: 'error'
    }),

  operationFailed: (operation: string, errorMessage?: string) =>
    showFeedbackToast({
      title: `${operation} failed`,
      description: errorMessage || 'Please try again.',
      type: 'error'
    }),

  // Info messages
  info: (title: string, description?: string) =>
    showFeedbackToast({
      title,
      description,
      type: 'info'
    }),

  // Warning messages
  warning: (title: string, description?: string) =>
    showFeedbackToast({
      title,
      description,
      type: 'warning'
    })
}
