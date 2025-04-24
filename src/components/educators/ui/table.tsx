import React from 'react';

export function Table({ children }: { children: React.ReactNode }) {
	return <div className="overflow-x-auto w-full"><table className="min-w-full bg-white">{children}</table></div>;
}

export function TableHead({ children }: { children: React.ReactNode }) {
	return <thead className="bg-gray-100">{children}</thead>;
}

export function TableHeader({ children }: { children: React.ReactNode }) {
	return <tr className="text-xs text-gray-500 uppercase tracking-wider">{children}</tr>;
}

export function TableBody({ children }: { children: React.ReactNode }) {
	return <tbody className="divide-y divide-gray-200">{children}</tbody>;
}

export function TableRow({ children }: { children: React.ReactNode }) {
	return <tr className="hover:bg-gray-50 transition">{children}</tr>;
}

export function TableCell({
	children,
	className = '',
}: {
	children: React.ReactNode;
	className?: string;
}) {
	return <td className={`px-4 py-3 text-sm text-gray-700 ${className}`}>{children}</td>;
}
