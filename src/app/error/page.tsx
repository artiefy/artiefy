'use client';

import { useState } from 'react';

interface TestComponentProps {
  title: string;
  description: string;
}

const TestComponent = ({ title, description }: TestComponentProps) => {
  const [count, setCount] = useState(0);
  const [inputValue, setInputValue] = useState('');

  const handleIncrement = () => setCount((prev) => prev + 1);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center space-y-8 bg-gray-100 p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-xl">
        <h1 className="mb-4 text-center text-2xl font-bold text-gray-800">
          {title}
        </h1>
        <p className="mb-6 text-center text-gray-600">{description}</p>

        <div className="mb-6 flex items-center justify-center space-x-4">
          <button
            onClick={handleIncrement}
            className="bg-blue-500 hover:bg-blue-600"
          >
            Increment: {count}
          </button>
        </div>

        <div className="space-y-4">
          <input
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            placeholder="Type something..."
            className="w-full"
          />
          <p className="text-sm text-gray-500">
            You typed: {inputValue || 'Nothing yet'}
          </p>
        </div>
      </div>

      <div className="mt-8 text-center text-sm text-gray-500">
        <p>
          This component tests Prettier formatting rules including:
          {[
            'Indentation (4 spaces)',
            'Single quotes',
            'No semicolons',
            'Tailwind class sorting',
            'JSX formatting',
            'Arrow function parentheses',
          ].join(' • ')}
        </p>
      </div>
    </div>
  );
};

export default function TestPrettierPage() {
  return (
    <TestComponent
      title="Prettier Configuration Test"
      description="This page demonstrates various Prettier formatting rules"
    />
  );
}
