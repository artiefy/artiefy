import { ArrowRightIcon, StarIcon } from '@heroicons/react/24/solid';
import Image from 'next/image';
import Link from 'next/link';
import { AspectRatio } from '~/components/educators/ui/aspect-ratio';
import { Badge } from '~/components/educators/ui/badge';
import {
	Card,
	CardContent,
	CardFooter,
	CardHeader,
	CardTitle,
} from '~/components/educators/ui/card';
import { Button } from '~/components/estudiantes/ui/button';
import { type Program, type Category } from '~/types';

interface ProgramListAdminProps {
	programs: Program[];
	onEditProgram: (program: Program | null) => void;
	onDeleteProgram: (programId: number) => void;
	categories: Category[];
}

const ProgramListAdmin: React.FC<ProgramListAdminProps> = ({
	programs,
	onEditProgram,
	onDeleteProgram,
	categories,
}) => {
	const getCategoryName = (categoryId: number) => {
		if (!categories) return 'Sin categoría';
		const category = categories.find((cat) => cat.id === categoryId);
		return category?.name ?? 'Sin categoría';
	};

	return (
		<div className="grid grid-cols-1 gap-4 px-8 sm:grid-cols-2 lg:grid-cols-3 lg:px-5">
			{programs.map((program) => (
				<div key={program.id} className="group relative">
					<div className="animate-gradient absolute -inset-0.5 rounded-xl bg-gradient-to-r from-[#3AF4EF] via-[#00BDD8] to-[#01142B] opacity-0 blur transition duration-500 group-hover:opacity-100"></div>
					<Card className="relative flex h-full flex-col justify-between overflow-hidden border-0 bg-gray-800 px-2 pt-2 text-white transition-transform duration-300 ease-in-out zoom-in hover:scale-[1.02]">
						<CardHeader>
							<AspectRatio ratio={16 / 9}>
								<div className="relative size-full">
									<Image
										src={
											program.coverImageKey
												? `${process.env.NEXT_PUBLIC_AWS_S3_URL}/${program.coverImageKey}`
												: 'https://placehold.co/600x400/01142B/3AF4EF?text=Artiefy&font=MONTSERRAT'
										}
										alt={program.title || 'Imagen del programa'}
										className="object-cover px-2 pt-2 transition-transform duration-300 hover:scale-105"
										fill
										sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
										quality={75}
									/>
								</div>
							</AspectRatio>
						</CardHeader>

						<CardContent className="flex grow flex-col justify-between space-y-2 px-2">
							<CardTitle className="rounded-lg text-lg text-background">
								<div className="font-bold text-primary">{program.title}</div>
							</CardTitle>
							<div className="flex items-center">
								Categoria:
								<Badge
									variant="outline"
									className="border-primary bg-background text-primary hover:bg-black/70"
								>
									{getCategoryName(program.categoryid)}
								</Badge>
							</div>
							<p className="line-clamp-2 text-sm text-gray-300">
								Descripcion: {program.description}
							</p>
						</CardContent>
						<CardFooter className="flex flex-col items-start justify-between space-y-2 px-2">
							<div className="flex w-full justify-between">
								<p className="text-sm font-bold text-gray-300 italic">
									Creador:{' '}
									<span className="font-bold italic">{program.creatorId}</span>
								</p>
							</div>
							<div className="flex w-full items-center justify-between">
								<Button asChild>
									<Link
										href={`/dashboard/super-admin/programs/${program.id}`}
										className="group/button relative inline-flex items-center justify-center overflow-hidden rounded-md border border-white/20 bg-background p-2 text-primary active:scale-95"
									>
										<p className="font-bold">Ver Programa</p>
										<ArrowRightIcon className="animate-bounce-right size-5" />
										<div className="absolute inset-0 flex w-full [transform:skew(-13deg)_translateX(-100%)] justify-center group-hover/button:[transform:skew(-13deg)_translateX(100%)] group-hover/button:duration-1000">
											<div className="relative h-full w-10 bg-white/30"></div>
										</div>
									</Link>
								</Button>
								<div className="flex items-center">
									<StarIcon className="size-5 text-yellow-500" />
									<span className="ml-1 text-sm font-bold text-yellow-500">
										{(program.rating ?? 0).toFixed(1)}
									</span>
								</div>
							</div>
							<div className="flex w-full justify-between">
								<Button
									onClick={() => onEditProgram(program)}
									className="bg-blue-500 hover:bg-blue-600"
								>
									Editar
								</Button>
								<Button
									onClick={() => onDeleteProgram(Number(program.id))}
									className="bg-red-500 hover:bg-red-600"
								>
									Eliminar
								</Button>
							</div>
						</CardFooter>
					</Card>
				</div>
			))}
		</div>
	);
};

export default ProgramListAdmin;
