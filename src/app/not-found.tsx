import Image from 'next/image';
import Link from 'next/link';

export default function NotFound() {
	return (
		<div className="bg-background flex h-screen flex-col items-center justify-center p-5 text-center text-gray-800">
			<Image
				src="/error-404.png"
				alt="Not Found"
				width={400}
				height={400}
				className="mb-8 h-auto max-w-full"
				priority
			/>
			<h1 className="mb-4 text-4xl font-bold text-orange-500">
				404 - Página no encontrada
			</h1>
			<p className="text-primary mb-8 text-lg">
				Lo sentimos, pero la página que buscas no está disponible. Puede que el
				enlace esté roto o que la página haya sido movida.
			</p>
			<Link href="/" className="mb-6 text-lg text-blue-500 underline">
				Volver al inicio
			</Link>
		</div>
	);
}
