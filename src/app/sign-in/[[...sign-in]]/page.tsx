'use client';

import { useState, useEffect } from 'react';
import { useAuth, useSignIn } from '@clerk/nextjs';
import { isClerkAPIResponseError } from '@clerk/nextjs/errors';
import { type ClerkAPIError, type OAuthStrategy } from '@clerk/types';
import Image from 'next/image';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { AspectRatio } from '~/components/estudiantes/ui/aspect-ratio';
import { Icons } from '~/components/estudiantes/ui/icons';
import Loading from '../../loading';

export default function SignInPage() {
	const { isLoaded, isSignedIn } = useAuth();
	const { signIn, setActive } = useSignIn();
	const [loadingProvider, setLoadingProvider] = useState<OAuthStrategy | null>(null);
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [code, setCode] = useState('');
	const [successfulCreation, setSuccessfulCreation] = useState(false);
	const [secondFactor, setSecondFactor] = useState(false);
	const [errors, setErrors] = useState<ClerkAPIError[]>();
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isForgotPassword, setIsForgotPassword] = useState(false);
	const searchParams = useSearchParams();
	const redirectTo = searchParams.get('redirect_url') ?? '/';
	const router = useRouter();

	useEffect(() => {
		if (isSignedIn) {
			router.replace(redirectTo);
		}
	}, [isSignedIn, router, redirectTo]);

	if (!isLoaded || isSignedIn) {
		return <Loading />;
	}

	const signInWith = async (strategy: OAuthStrategy) => {
		if (!signIn) {
			setErrors([{ code: 'sign_in_undefined', message: 'SignIn no está definido', longMessage: 'SignIn no está definido', meta: {} }]);
			setIsSubmitting(false);
			return;
		}
		setLoadingProvider(strategy);
		try {
			await signIn.authenticateWithRedirect({
				strategy,
				redirectUrl: '/sso-callback',
				redirectUrlComplete: redirectTo,
			});
		} catch {
			setLoadingProvider(null);
			setErrors([{ code: 'oauth_error', message: 'Error durante el inicio de sesión con OAuth', longMessage: 'Error durante el inicio de sesión con OAuth', meta: {} }]);
		}
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setErrors(undefined);
		setIsSubmitting(true);
		if (!signIn) return;
		if (!isLoaded) return;

		try {
			const signInAttempt = await signIn.create({
				identifier: email,
				password,
			});

			if (signInAttempt.status === 'complete') {
				if (setActive) {
					await setActive({ session: signInAttempt.createdSessionId });
				}
				router.replace(redirectTo);
			} else if (signInAttempt.status === 'needs_first_factor') {
				const supportedStrategies = signInAttempt.supportedFirstFactors?.map(factor => factor.strategy) ?? [];
				if (!supportedStrategies.includes('password')) {
					setErrors([{ code: 'invalid_strategy', message: 'Estrategia de verificación inválida', longMessage: 'Estrategia de verificación inválida', meta: {} }]);
				}
			} else {
				setErrors([{ code: 'unknown_error', message: 'Ocurrió un error desconocido', longMessage: 'Ocurrió un error desconocido', meta: {} }]);
			}
		} catch (err) {
			if (isClerkAPIResponseError(err)) {
				setErrors(err.errors);
			} else {
				setErrors([{ code: 'unknown_error', message: 'Ocurrió un error desconocido', longMessage: 'Ocurrió un error desconocido', meta: {} }]);
			}
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleForgotPassword = async (e: React.FormEvent) => {
		e.preventDefault();
		setErrors(undefined);
		setIsSubmitting(true);

		try {
			if (!signIn) return;
			await signIn.create({
				strategy: 'reset_password_email_code',
				identifier: email,
			});
			setSuccessfulCreation(true);
			setErrors(undefined);
		} catch (err) {
			if (isClerkAPIResponseError(err)) {
				setErrors(err.errors);
			} else {
				setErrors([{ code: 'unknown_error', message: 'Ocurrió un error desconocido', longMessage: 'Ocurrió un error desconocido', meta: {} }]);
			}
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleResetPassword = async (e: React.FormEvent) => {
		e.preventDefault();
		setErrors(undefined);
		setIsSubmitting(true);

		try {
			if (!signIn) {
				setErrors([{ code: 'sign_in_undefined', message: 'SignIn no está definido', longMessage: 'SignIn no está definido', meta: {} }]);
				setIsSubmitting(false);
				return;
			}
			const result = await signIn.attemptFirstFactor({
				strategy: 'reset_password_email_code',
				code,
				password,
			});

			if (result.status === 'needs_second_factor') {
				setSecondFactor(true);
				setErrors(undefined);
			} else if (result.status === 'complete') {
				if (setActive) {
					await setActive({ session: result.createdSessionId });
				}
				router.replace('/');
			} else {
				setErrors([{ code: 'unknown_error', message: 'Ocurrió un error desconocido', longMessage: 'Ocurrió un error desconocido', meta: {} }]);
			}
		} catch (err) {
			if (isClerkAPIResponseError(err)) {
				setErrors(err.errors);
			} else {
				setErrors([{ code: 'unknown_error', message: 'Ocurrió un error desconocido', longMessage: 'Ocurrió un error desconocido', meta: {} }]);
			}
		} finally {
			setIsSubmitting(false);
		}
	};

	const emailError = errors?.some(error => error.code === 'form_identifier_not_found');
	const passwordError = errors?.some(error => error.code === 'form_password_incorrect');

	return (
		<div className="relative flex min-h-screen flex-col items-center justify-center px-4 sm:px-6 lg:px-8">
			{/* Imagen de fondo */}
			<Image
				src="/login-fondo.webp"
				alt="Fondo de inicio de sesión"
				fill
				className="object-cover"
				quality={85}
				priority
				sizes="100vw"
			/>

			{/* Contenedor principal */}
			<div className="relative z-10 flex w-full flex-col items-center justify-center px-4 lg:flex-row lg:items-start lg:justify-between lg:px-10">
				{/* Contenedor del logo */}
				<div className="md:mr-14 mb-8 w-full max-w-[280px] sm:max-w-[300px] md:max-w-[300px] lg:mb-0 lg:ml-14 lg:w-1/2 lg:max-w-[500px] lg:self-center xl:ml-32 xl:max-w-[600px]">
					<AspectRatio ratio={16 / 9} className="relative size-full">
						<Image
							src="/logo-login.webp"
							alt="Logo de Artiefy"
							fill
							className="object-contain"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
							priority
						/>
					</AspectRatio>
				</div>

				{/* Formulario de inicio de sesión */}
				<div className="-mt-20 w-full max-w-md sm:-mt-16 md:-mt-12 lg:mt-0 lg:w-1/2 lg:max-w-[400px] lg:pr-8 xl:max-w-[500px]">
					<div className="mx-auto w-full max-w-sm space-y-10 rounded-2xl px-8 py-10 sm:max-w-md">
						<div className="mb-6 text-center">
							<h2 className="text-3xl font-bold xs:text-2xl">INICIAR SESIÓN</h2>
						</div>
						{errors && (
							<ul>
								{errors.map((el, index) => (
									<li key={index} className="text-sm text-rose-400 -my-4">
										{el.code === 'form_password_incorrect' ? 'Contraseña incorrecta. Inténtalo de nuevo o usa otro método.' : el.code === 'form_identifier_not_found' ? 'No se pudo encontrar tu cuenta.' : el.longMessage}
									</li>
								))}
							</ul>
						)}
						{!successfulCreation && !isForgotPassword ? (
							<form onSubmit={handleSubmit}>
              <div className="flex justify-center">
                  <input
                      onChange={(e) => setEmail(e.target.value)}
                      id="email"
                      name="email"
                      type="email"
                      value={email}
                      placeholder="Correo Electrónico"
                      required
                      className={`w-full sm:w-[250px] md:w-[300px] lg:w-[330px] xl:w-[350px] rounded-none bg-transparent px-4 py-2.5 text-sm outline-none ring-1 ring-inset ${emailError ? 'ring-rose-400' : 'ring-white/20'} hover:ring-white/30 focus:shadow-[0_0_6px_0] focus:shadow-emerald-500/20 focus:ring-[1.5px] focus:ring-primary data-[invalid]:shadow-rose-400/20 data-[invalid]:ring-rose-400`}
                  />
              </div>
              <div className="mt-4 flex justify-center">
                  <input
                      onChange={(e) => setPassword(e.target.value)}
                      id="password"
                      name="password"
                      type="password"
                      value={password}
                      placeholder="Contraseña"
                      required
                      className={`w-full sm:w-[250px] md:w-[300px] lg:w-[330px] xl:w-[350px] rounded-none bg-transparent px-4 py-2.5 text-sm outline-none ring-1 ring-inset ${passwordError ? 'ring-rose-400' : 'ring-white/20'} hover:ring-white/30 focus:shadow-[0_0_6px_0] focus:shadow-emerald-500/20 focus:ring-[1.5px] focus:ring-primary data-[invalid]:shadow-rose-400/20 data-[invalid]:ring-rose-400`}
                  />
              </div>
              <div className="mt-6 flex justify-center">
                  <button
                      type="submit"
                      className="rounded-none px-3.5 py-2.5 text-center text-sm font-medium italic text-primary shadow ring-1 ring-inset ring-primary hover:bg-white/30 focus-visible:outline-[1.5px] focus-visible:outline-offset-2 focus-visible:outline-zinc-950 active:scale-95 active:text-primary/70"
                      style={{ width: '150px' }}
                      disabled={isSubmitting}
                  >
                      <div className="flex w-full items-center justify-center">
                          {isSubmitting ? (
                              <Icons.spinner className="size-5 animate-spin text-primary" />
                          ) : (
                              <span className="inline-block font-bold">COMIENZA YA</span>
                          )}
                      </div>
                  </button>
              </div>
          </form>
						) : successfulCreation ? (
							<form onSubmit={handleResetPassword}>
								<div>
									<input
										onChange={(e) => setPassword(e.target.value)}
										id="new-password"
										name="new-password"
										type="password"
										value={password}
										placeholder="Nueva Contraseña"
										required
										className="w-full rounded-none bg-transparent px-4 py-2.5 text-sm outline-none ring-1 ring-inset ring-white/20 hover:ring-white/30 focus:shadow-[0_0_6px_0] focus:shadow-emerald-500/20 focus:ring-[1.5px] focus:ring-primary"
									/>
								</div>
								<div className="mt-4">
									<input
										onChange={(e) => setCode(e.target.value)}
										id="reset-code"
										name="reset-code"
										type="text"
										value={code}
										placeholder="Código de Restablecimiento"
										required
										className="w-full rounded-none bg-transparent px-4 py-2.5 text-sm outline-none ring-1 ring-inset ring-white/20 hover:ring-white/30 focus:shadow-[0_0_6px_0] focus:shadow-emerald-500/20 focus:ring-[1.5px] focus:ring-primary"
									/>
								</div>
								<div className="mt-6 flex justify-center">
									<button
										type="submit"
										className="rounded-none px-3.5 py-2.5 text-center text-sm font-medium italic text-primary shadow ring-1 ring-inset ring-primary hover:bg-white/30 focus-visible:outline-[1.5px] focus-visible:outline-offset-2 focus-visible:outline-zinc-950 active:scale-95 active:text-primary/70"
										style={{ width: '150px' }}
										disabled={isSubmitting}
									>
										<div className="flex w-full items-center justify-center">
											{isSubmitting ? (
												<Icons.spinner className="size-5 animate-spin text-primary" />
											) : (
												<span className="inline-block font-bold">RESTABLECER</span>
											)}
										</div>
									</button>
								</div>
							</form>
						) : (
							<form onSubmit={handleForgotPassword}>
								<div>
									<input
										onChange={(e) => setEmail(e.target.value)}
										id="forgot-email"
										name="forgot-email"
										type="email"
										value={email}
										placeholder="Correo Electrónico"
										required
										className="w-full rounded-none bg-transparent px-4 py-2.5 text-sm outline-none ring-1 ring-inset ring-white/20 hover:ring-white/30 focus:shadow-[0_0_6px_0] focus:shadow-emerald-500/20 focus:ring-[1.5px] focus:ring-primary"
									/>
								</div>
								<div className="mt-6 flex justify-center">
									<button
										type="submit"
										className="rounded-none px-3.5 py-2.5 text-center text-sm font-medium italic text-primary shadow ring-1 ring-inset ring-primary hover:bg-white/30 focus-visible:outline-[1.5px] focus-visible:outline-offset-2 focus-visible:outline-zinc-950 active:scale-95 active:text-primary/70"
										style={{ width: '150px' }}
										disabled={isSubmitting}
									>
										<div className="flex w-full items-center justify-center">
											{isSubmitting ? (
												<Icons.spinner className="size-5 animate-spin text-primary" />
											) : (
												<span className="inline-block font-bold">ENVIAR CÓDIGO</span>
											)}
										</div>
									</button>
								</div>
							</form>
						)}
						{secondFactor && <p>2FA es requerido, pero esta interfaz no lo maneja.</p>}
						<div className="mt-4 text-center">
							<p>O ingresa con tu cuenta:</p>
							<div className="mt-2 flex justify-center space-x-4">
								<div
									onClick={() => signInWith('oauth_google')}
									className="flex cursor-pointer items-center justify-center rounded-md bg-transparent p-2 active:scale-95"
								>
									{loadingProvider === 'oauth_google' ? (
										<Icons.spinner className="size-10 animate-spin text-primary" />
									) : (
										<Icons.google />
									)}
								</div>
								<div
									onClick={() => signInWith('oauth_github')}
									className="flex cursor-pointer items-center justify-center rounded-md bg-transparent p-2 active:scale-95"
								>
									{loadingProvider === 'oauth_github' ? (
										<Icons.spinner className="size-10 animate-spin text-primary" />
									) : (
										<Icons.gitHub />
									)}
								</div>
								<div
									onClick={() => signInWith('oauth_facebook')}
									className="flex cursor-pointer items-center justify-center rounded-md bg-transparent p-2 active:scale-95"
								>
									{loadingProvider === 'oauth_facebook' ? (
										<Icons.spinner className="size-10 animate-spin text-primary" />
									) : (
										<Icons.facebook />
									)}
								</div>
							</div>
							<div className="mt-6 text-sm">
								<Link
									href="/sign-up"
									className="font-medium text-primary decoration-primary underline-offset-4 outline-none hover:text-secondary hover:underline focus-visible:underline"
								>
									¿Aun no tienes cuenta? Registrate Aquí
								</Link>
							</div>
							<div className="mt-6 text-sm">
								<button
									onClick={() => setIsForgotPassword(true)}
									className="font-medium text-primary decoration-primary underline-offset-4 outline-none hover:text-secondary hover:underline focus-visible:underline"
								>
									¿Olvidaste tu contraseña?
								</button>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
