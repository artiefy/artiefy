'use client';

import React, { useState, useCallback } from 'react';
import { MagnifyingGlassIcon } from '@heroicons/react/24/solid';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import NProgress from 'nprogress';
import { Button } from '~/components/estudiantes/ui/button';
import { Icons } from '~/components/estudiantes/ui/icons';
import { Input } from '~/components/estudiantes/ui/input';

const SearchForm: React.FC = () => {
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const router = useRouter();
    const [isSearching, setIsSearching] = useState(false);
    const [searchQuery, setSearchQuery] = useState(
        searchParams.get('query') ?? ''
    );

    const handleSearch = useCallback(() => {
        const params = new URLSearchParams();
        if (searchQuery) {
            params.set('query', searchQuery);
        }
        NProgress.start();
        setIsSearching(true);
        router.push(`${pathname}?${params.toString()}`, { scroll: false });
    }, [searchQuery, pathname, router]);

    React.useEffect(() => {
        NProgress.done();
        setIsSearching(false);
    }, [searchParams]);

    return (
        <div className="top-0 right-0 -mb-24 flex flex-col items-end">
            <div className="flex w-full max-w-xs">
                <div className="relative grow">
                    <Input
                        type="search"
                        placeholder="Buscar cursos..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="text-background w-full bg-white pr-10"
                    />
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                        {isSearching ? (
                            <Icons.spinner className="size-4 text-background" />
                        ) : (
                            <MagnifyingGlassIcon className="size-4 text-gray-400" />
                        )}
                    </div>
                </div>
                <Button
                    onClick={handleSearch}
                    disabled={isSearching}
                    className="ml-2 border border-primary bg-primary text-background hover:bg-background hover:text-primary"
                >
                    Buscar
                </Button>
            </div>
        </div>
    );
};

export default SearchForm;
