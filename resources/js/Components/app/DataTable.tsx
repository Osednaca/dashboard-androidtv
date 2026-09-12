import type { ReactNode } from 'react';
import { cn } from '@/Utils/cn';

export interface Column<T> {
    key: string;
    header: ReactNode;
    className?: string;
    headerClassName?: string;
    cell: (row: T) => ReactNode;
}

export function DataTable<T>({
    columns,
    rows,
    keyExtractor,
    empty,
    onRowClick,
    className,
}: {
    columns: Array<Column<T>>;
    rows: T[];
    keyExtractor: (row: T) => string | number;
    empty?: ReactNode;
    onRowClick?: (row: T) => void;
    className?: string;
}) {
    return (
        <div className={cn('overflow-x-auto', className)}>
            <table className="w-full min-w-[720px] border-collapse text-sm">
                <thead>
                    <tr className="border-b border-line">
                        {columns.map((column) => (
                            <th
                                key={column.key}
                                className={cn(
                                    'px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-faint',
                                    column.headerClassName,
                                )}
                            >
                                {column.header}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {rows.length === 0 ? (
                        <tr>
                            <td colSpan={columns.length} className="px-3 py-12">
                                {empty}
                            </td>
                        </tr>
                    ) : (
                        rows.map((row) => (
                            <tr
                                key={keyExtractor(row)}
                                onClick={onRowClick ? () => onRowClick(row) : undefined}
                                className={cn(
                                    'border-b border-line/70 transition-colors last:border-0 hover:bg-surface/60',
                                    onRowClick && 'cursor-pointer',
                                )}
                            >
                                {columns.map((column) => (
                                    <td
                                        key={column.key}
                                        className={cn('px-3 py-3 align-middle text-fg', column.className)}
                                    >
                                        {column.cell(row)}
                                    </td>
                                ))}
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
}
