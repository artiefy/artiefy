import { type ReactNode } from 'react';

interface MenuProps {
    children: ReactNode;
}

export function Menu({ children }: MenuProps) {
    return <div className="rounded-lg bg-white p-4 shadow-md">{children}</div>;
}

interface MenuItemProps {
    children: ReactNode;
    onClick: () => void;
}

Menu.Item = function MenuItem({ children, onClick }: MenuItemProps) {
    return (
        <div className="cursor-pointer p-2 hover:bg-gray-100" onClick={onClick}>
            {children}
        </div>
    );
};
