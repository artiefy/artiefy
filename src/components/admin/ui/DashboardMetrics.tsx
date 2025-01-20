import React from 'react';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '~/components/admin/ui/card';

interface Metric {
  title: string;
  value: string;
  icon: React.ElementType;
  href: string;
}

interface DashboardMetricsProps {
  metrics: Metric[];
}

export function DashboardMetrics({ metrics }: DashboardMetricsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {metrics.map((metric, index) => (
        <Card key={index}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {metric.title}
            </CardTitle>
            <metric.icon className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metric.value}</div>
            <Link
              href={metric.href}
              className="text-xs text-muted-foreground hover:underline"
            >
              Ver detalles
            </Link>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
