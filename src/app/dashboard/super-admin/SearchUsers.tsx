//src\app\dashboard\admin\SearchUsers.tsx
"use client";

import { usePathname, useRouter } from "next/navigation";

export const SearchUsers = () => {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const form = e.currentTarget;
          const formData = new FormData(form);
          const queryTerm = formData.get("search") as string;

          router.push(`${pathname}?search=${queryTerm}`);
        }}
      >
        <label htmlFor="search">Buscar usuarios:</label>
        <input id="search" name="search" type="text" placeholder="Buscar..." />
        <button type="submit">Buscar</button>
      </form>
    </div>
  );
};
