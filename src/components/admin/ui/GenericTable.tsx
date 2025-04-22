import React from 'react';
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from '~/components/admin/ui/card';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '~/components/admin/ui/table';

interface Column {
	header: string;
	accessor: string;
}

interface GenericTableProps {
	columns: Column[];
	data: Record<string, string | number | boolean | null>[];
	onRowClick?: (row: Record<string, string | number | boolean | null>) => void;
	actions?: (
		row: Record<string, string | number | boolean | null>
	) => React.ReactNode;
}

export function GenericTable({
	columns,
	data,
	onRowClick,
	actions,
}: GenericTableProps) {
	return (
		<Card>
			<CardHeader>
				<CardTitle>Datos</CardTitle>
			</CardHeader>
			<CardContent>
				<div className="overflow-x-auto">
					<Table>
						<TableHeader>
							<TableRow>
								{columns.map((column, index) => (
									<TableHead key={index}>{column.header}</TableHead>
								))}
								{actions && <TableHead>Acciones</TableHead>}
							</TableRow>
						</TableHeader>
						<TableBody>
							{data.map((row, rowIndex) => (
								<TableRow
									key={rowIndex}
									onClick={() => onRowClick && onRowClick(row)}
									className={
										onRowClick
											? 'hover:bg-accent hover:text-accent-foreground cursor-pointer'
											: ''
									}
								>
									{columns.map((column, colIndex) => (
										<TableCell key={colIndex}>{row[column.accessor]}</TableCell>
									))}
									{actions && <TableCell>{actions(row)}</TableCell>}
								</TableRow>
							))}
						</TableBody>
					</Table>
				</div>
			</CardContent>
		</Card>
	);
}
