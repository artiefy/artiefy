import Footer from '~/components/estudiantes/layout/Footer';
import { Header } from '~/components/estudiantes/layout/Header';
import MyCoursesStudent from '~/components/estudiantes/layout/MyCoursesStudent';

export default function MisCoursesPage() {
	return (
		<div className="flex min-h-screen flex-col">
			<Header />
			<main className="flex-1 py-12">
				{' '}
					<MyCoursesStudent />
			</main>
			<Footer />
		</div>
	);
}
