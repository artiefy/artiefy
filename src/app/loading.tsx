import '~/styles/rocket.css';

export default function Loading() {
	return (
		<div className="bg-background flex min-h-screen flex-col items-center justify-center overflow-hidden">
			<div className="relative">
				<div className="rocket">
					<div className="rocket-body">
						<div className="body"></div>
						<div className="window"></div>
						<div className="fin fin-left"></div>
						<div className="fin fin-right"></div>
						<div className="exhaust-flame"></div>
						<ul className="exhaust-fumes">
							<li></li>
							<li></li>
							<li></li>
							<li></li>
							<li></li>
							<li></li>
							<li></li>
							<li></li>
							<li></li>
						</ul>
					</div>
				</div>
			</div>
			<ul className="star">
				<li></li>
				<li></li>
				<li></li>
				<li></li>
				<li></li>
				<li></li>
				<li></li>
				<li></li>
				<li></li>
				<li></li>
				<li></li>
				<li></li>
				<li></li>
				<li></li>
				<li></li>
			</ul>
			<p className="text-primary -mt-20 text-3xl font-bold">
				{' '}
				{/* Ajusta el margen superior aquí */}
				Cargando... Artiefy
			</p>
		</div>
	);
}
