'use client';

import React, { useState } from 'react';

import Form from 'next/form';
import { useSearchParams } from 'next/navigation';

import { useProgress } from '@bprogress/next';
import { MagnifyingGlassIcon } from '@heroicons/react/24/solid';

import { Button } from '~/components/estudiantes/ui/button';
import { Icons } from '~/components/estudiantes/ui/icons';
import { Input } from '~/components/estudiantes/ui/input';
import {
	saveScrollPosition,
	restoreScrollPosition,
} from '~/utils/scrollPosition';

const SearchForm: React.FC = () => {
	const searchParams = useSearchParams();
	const { start, stop } = useProgress();
	const [isSearching, setIsSearching] = useState(false);
	const defaultQuery = searchParams.get('query') ?? '';

	React.useEffect(() => {
		setIsSearching(false);
		stop();
		restoreScrollPosition();
	}, [searchParams, stop]);

	const handleSubmit = () => {
		saveScrollPosition();
		start();
		setIsSearching(true);
	};

	return (
		<Form
			action=""
			className="flex w-full justify-center p-4 sm:p-8 lg:justify-end lg:px-20"
			onSubmit={handleSubmit}
		>
			<div className="relative w-full max-w-lg">
				<Input
					type="search"
					name="query"
					placeholder="Buscar cursos..."
					defaultValue={defaultQuery}
					className="w-full bg-white pr-10 text-background"
					aria-label="Buscar cursos"
				/>
				<div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
					{isSearching ? (
						<Icons.spinner
							className="size-4 text-background"
							aria-hidden="true"
						/>
					) : (
						<MagnifyingGlassIcon
							className="size-4 text-gray-400"
							aria-hidden="true"
						/>
					)}
				</div>
			</div>
			<Button
				type="submit"
				disabled={isSearching}
				className="ml-2 border border-primary bg-primary text-background hover:bg-background hover:text-primary"
				aria-label="Realizar búsqueda"
			>
				Buscar
			</Button>
		</Form>
	);
};

export default SearchForm;
