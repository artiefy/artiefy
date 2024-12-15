// components/ui/button.tsx
import React from 'react'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger'
}

export const Button: React.FC<ButtonProps> = ({ variant = 'primary', children, ...props }) => {
  let classNames = 'px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2'
  
  switch (variant) {
    case 'primary':
      classNames += ' bg-blue-600 text-white hover:bg-blue-700'
      break
    case 'secondary':
      classNames += ' bg-gray-200 text-gray-700 hover:bg-gray-300'
      break
    case 'danger':
      classNames += ' bg-red-600 text-white hover:bg-red-700'
      break
  }
  
  return (
    <button className={classNames} {...props}>
      {children}
    </button>
  )
}
