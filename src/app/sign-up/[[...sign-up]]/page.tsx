import { SignUp } from '@clerk/nextjs';

export default function Page() {
	return (
		<div className="mt-5 flex justify-center py-5">
			<SignUp
				appearance={{
					layout: {
						logoPlacement: 'inside', // Ubicación del logo: 'inside' o 'outside'
						privacyPageUrl: 'https://clerk.com/legal/privacy', // URL de tu política de privacidad
						animations: true, // Activa/desactiva las animaciones
						logoImageUrl: '/artiefy-logo2.svg', // URL de tu logo personalizado
						logoLinkUrl: '/', // URL al hacer clic en el logo
						socialButtonsPlacement: 'bottom',
						socialButtonsVariant: 'iconButton',
						termsPageUrl: 'https://clerk.com/terms',
						unsafe_disableDevelopmentModeWarnings: true,
					},
				}}
			/>
		</div>
	);
}
