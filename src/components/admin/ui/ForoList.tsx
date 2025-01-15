import { Button } from '~/components/admin/ui/button';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '~/components/admin/ui/card';

interface Foro {
    id: number;
    titulo: string;
    descripcion: string;
    mensajes: number;
    ultimaActividad: string;
}

interface ForoListProps {
    foros: Foro[];
    onSelectForo: (foro: Foro) => void;
}

export function ForoList({ foros, onSelectForo }: ForoListProps) {
    return (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {foros.map((foro) => (
                <Card key={foro.id} className="flex flex-col">
                    <CardHeader>
                        <CardTitle>{foro.titulo}</CardTitle>
                    </CardHeader>
                    <CardContent className="grow">
                        <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
                            {foro.descripcion}
                        </p>
                        <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                            <span>{foro.mensajes} mensajes</span>
                            <span>
                                Última actividad: {foro.ultimaActividad}
                            </span>
                        </div>
                    </CardContent>
                    <CardContent className="pt-0">
                        <Button
                            onClick={() => onSelectForo(foro)}
                            className="w-full"
                        >
                            Ver Foro
                        </Button>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
