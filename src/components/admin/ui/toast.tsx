'use client';

import { useState, useEffect } from 'react';
import { cn } from '~/lib/utils';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info';
}

const ToastContainer = () => {
  const [toasts, setToasts] = useState<ToastProps[]>([]);

  useEffect(() => {
    if (toasts.length > 0) {
      const timer = setTimeout(() => {
        setToasts((prev) => prev.slice(1));
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toasts]);

  const addToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToasts((prev) => [...prev, { message, type }]);
  };

  return (
    <div className="fixed top-4 right-4 space-y-2 z-50">
      {toasts.map((toast, index) => (
        <div
          key={index}
          className={cn(
            'px-4 py-2 rounded shadow-md text-white',
            toast.type === 'success' ? 'bg-green-500' : '',
            toast.type === 'error' ? 'bg-red-500' : '',
            toast.type === 'info' ? 'bg-blue-500' : ''
          )}
        >
          {toast.message}
        </div>
      ))}
    </div>
  );
};

export const toast = {
  success: (msg: string) => console.log(msg),
  error: (msg: string) => console.error(msg),
  info: (msg: string) => console.info(msg),
};

export default ToastContainer;
