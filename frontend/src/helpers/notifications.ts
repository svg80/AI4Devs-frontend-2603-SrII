import toast from 'react-hot-toast';

/**
 * Show a success toast notification.
 *
 * Automatically dismisses after 3 seconds.
 */
export function showSuccessToast(message: string): void {
  toast.success(message, {
    duration: 3000,
    position: 'bottom-right',
  });
}

/**
 * Show an error toast notification.
 *
 * Dismisses after 5 seconds to give the user time to read.
 */
export function showErrorToast(message: string): void {
  toast.error(message, {
    duration: 5000,
    position: 'bottom-right',
  });
}

/**
 * Show an info toast notification.
 *
 * Dismisses after 3 seconds.
 */
export function showInfoToast(message: string): void {
  toast(message, {
    duration: 3000,
    position: 'bottom-right',
  });
}
