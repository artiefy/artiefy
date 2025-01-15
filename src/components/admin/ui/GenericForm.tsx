import React from 'react';
import { Button } from '~/components/admin/ui/button';
import { Input } from '~/components/admin/ui/input';
import { Label } from '~/components/admin/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '~/components/admin/ui/select';
import { Textarea } from '~/components/admin/ui/textarea';

interface Field {
    name: string;
    label: string;
    type: 'text' | 'textarea' | 'select';
    options?: string[];
}

interface GenericFormProps {
    fields: Field[];
    onSubmit: (data: Record<string, string>) => void;
    initialData?: Record<string, string>;
    submitLabel: string;
}

export function GenericForm({
    fields,
    onSubmit,
    initialData = {},
    submitLabel,
}: GenericFormProps) {
    const [formData, setFormData] =
        React.useState<Record<string, string>>(initialData);

    const handleChange = (name: string, value: string) => {
        setFormData((prev: Record<string, string>) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {fields.map((field) => (
                <div key={field.name} className="space-y-2">
                    <Label
                        htmlFor={field.name}
                        className="text-sm font-medium text-gray-700"
                    >
                        {field.label}
                    </Label>
                    {field.type === 'textarea' ? (
                        <Textarea
                            id={field.name}
                            name={field.name}
                            value={formData[field.name] ?? ''}
                            onChange={(e) =>
                                handleChange(field.name, e.target.value)
                            }
                            className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-primary"
                            rows={4}
                        />
                    ) : field.type === 'select' ? (
                        <Select
                            value={formData[field.name] ?? ''}
                            onValueChange={(value: string) =>
                                handleChange(field.name, value)
                            }
                        >
                            <SelectTrigger>
                                <SelectValue
                                    placeholder={`Seleccionar ${field.label.toLowerCase()}`}
                                />
                            </SelectTrigger>
                            <SelectContent>
                                {field.options?.map((option) => (
                                    <SelectItem key={option} value={option}>
                                        {option}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    ) : (
                        <Input
                            id={field.name}
                            name={field.name}
                            type={field.type}
                            value={formData[field.name] ?? ''}
                            onChange={(e) =>
                                handleChange(field.name, e.target.value)
                            }
                            className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-primary"
                        />
                    )}
                </div>
            ))}
            <Button
                type="submit"
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
            >
                {submitLabel}
            </Button>
        </form>
    );
}
