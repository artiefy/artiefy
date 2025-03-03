'use client';

import { createContext, useContext, useEffect, useState } from 'react';

interface ThemeContextType {
	theme: string;
	setTheme: (theme: string) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({
	children,
	defaultTheme = 'light',
	storageKey = 'edudash-theme',
	attribute = 'class', // Agrega esta línea para definir la propiedad attribute
}: {
	children: React.ReactNode;
	defaultTheme?: string;
	storageKey?: string;
	attribute?: string; // Agrega esta línea para definir la propiedad attribute
	enableSystem?: boolean; // Agrega esta línea para definir la propiedad enableSystem
	disableTransitionOnChange?: boolean; // Agrega esta línea para definir la propiedad disableTransitionOnChange
}) {
	const [theme, setTheme] = useState<string>(() => {
		if (typeof window !== 'undefined') {
			return localStorage.getItem(storageKey) ?? defaultTheme;
		}
		return defaultTheme;
	});

	useEffect(() => {
		localStorage.setItem(storageKey, theme);
		document.documentElement.setAttribute(attribute, theme); // Usa la propiedad attribute
	}, [theme, storageKey, attribute]);

	return (
		<ThemeContext.Provider value={{ theme, setTheme }}>
			{children}
		</ThemeContext.Provider>
	);
}

export function useTheme() {
	const context = useContext(ThemeContext);
	if (!context) {
		throw new Error('useTheme must be used within a ThemeProvider');
	}
	return context;
}
