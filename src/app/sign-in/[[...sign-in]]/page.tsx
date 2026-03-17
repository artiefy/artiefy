'use client';

import { useCallback, useEffect, useState } from 'react';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

import { useAuth, useSignIn } from '@clerk/nextjs';
import { isClerkAPIResponseError } from '@clerk/nextjs/errors';
import { type ClerkAPIError, type OAuthStrategy } from '@clerk/shared/types';

import { AspectRatio } from '~/components/estudiantes/ui/aspect-ratio';
import { Icons } from '~/components/estudiantes/ui/icons';

import Loading from '../../loading';

const toClerkApiErrors = (error: unknown): ClerkAPIError[] => {
  if (isClerkAPIResponseError(error)) {
    return error.errors;
  }

  if (error && typeof error === 'object') {
    const record = error as Record<string, unknown>;
    const code =
      typeof record.code === 'string' ? record.code : 'unknown_error';
    const message =
      typeof record.message === 'string'
        ? record.message
        : 'Ocurrió un error desconocido';
    const longMessage =
      typeof record.longMessage === 'string' ? record.longMessage : message;

    return [
      {
        code,
        message,
        longMessage,
        meta: {},
      },
    ];
  }

  return [
    {
      code: 'unknown_error',
      message: 'Ocurrió un error desconocido',
      longMessage: 'Ocurrió un error desconocido',
      meta: {},
    },
  ];
};

export default function SignInPage() {
  const { isLoaded, isSignedIn } = useAuth();
  const { signIn, fetchStatus } = useSignIn();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [successfulCreation, setSuccessfulCreation] = useState(false);
  const [secondFactor, setSecondFactor] = useState(false);
  const [errors, setErrors] = useState<ClerkAPIError[]>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [loadingProvider, setLoadingProvider] = useState<OAuthStrategy | null>(
    null
  );
  const router = useRouter();
  const searchParams = useSearchParams();

  // Extraer email de los parámetros de búsqueda para pre-rellenar
  useEffect(() => {
    if (searchParams) {
      const emailParam = searchParams.get('email');
      if (emailParam) {
        try {
          setEmail(decodeURIComponent(emailParam));
        } catch {
          setEmail(emailParam);
        }
      }
    }
  }, [searchParams]);

  const getStoredMiniRedirect = () => {
    if (typeof window === 'undefined') return null;
    try {
      const raw = window.sessionStorage.getItem('mini_auth_redirect_url');
      return raw ? decodeURIComponent(raw) : null;
    } catch {
      return null;
    }
  };

  const isWeakRedirect = (value: string | null) => {
    if (!value) return true;
    const normalized = value.trim().toLowerCase();
    return (
      normalized === '/' ||
      normalized === '/estudiantes' ||
      normalized.startsWith('/sign-in') ||
      normalized.startsWith('/sign-up')
    );
  };

  const isCourseAutoEnrollRedirect = (value: string | null) =>
    Boolean(
      value &&
      value.includes('/estudiantes/cursos/') &&
      value.includes('auto_enroll=1')
    );

  // Función para extraer redirect_url sin importar si está en query param o hash
  const getRedirectUrl = () => {
    // Primero intentamos obtenerlo de los query params normales
    let redirectUrl = searchParams?.get('redirect_url');

    // Si no encontramos en query params, buscamos en el hash
    if (!redirectUrl && typeof window !== 'undefined') {
      try {
        // Extraer los parámetros del hash
        const hashString = window.location.hash.substring(2); // Remover '#/'
        const hashParams = new URLSearchParams(hashString);

        // Intentar obtener redirect_url del hash
        redirectUrl =
          hashParams.get('redirect_url') ??
          hashParams.get('sign_in_fallback_redirect_url');
      } catch (error) {
        console.error('Error parsing hash params:', error);
      }
    }

    const storedMiniRedirect = getStoredMiniRedirect();

    // Decodificar la URL si está codificada y usar fallback si es necesario
    try {
      const decodedRedirect = redirectUrl
        ? decodeURIComponent(redirectUrl)
        : null;

      if (
        isWeakRedirect(decodedRedirect) &&
        isCourseAutoEnrollRedirect(storedMiniRedirect)
      ) {
        return storedMiniRedirect!;
      }

      return decodedRedirect ?? storedMiniRedirect ?? '/estudiantes';
    } catch (error) {
      console.error('Error decoding redirect URL:', error);
      return storedMiniRedirect ?? '/estudiantes';
    }
  };

  // Extraer plan_id de los query params
  const planId = searchParams?.get('plan_id');

  // Modificar redirectUrl para incluir plan_id si existe
  const redirectUrl = (() => {
    let url = getRedirectUrl();
    if (planId && !url.includes('plan_id=')) {
      // Añadir plan_id como query param
      const separator = url.includes('?') ? '&' : '?';
      url = `${url}${separator}plan_id=${planId}`;
    }
    return url;
  })();

  console.log('✅ Redirect URL detectada:', redirectUrl);

  useEffect(() => {
    if (isSignedIn) {
      console.log('🔄 Usuario autenticado, redirigiendo a:', redirectUrl);
      try {
        window.sessionStorage.removeItem('mini_auth_redirect_url');
      } catch {
        // ignore storage failures
      }
      router.replace(redirectUrl);
    }
  }, [isSignedIn, router, redirectUrl]);

  // Login con OAuth (Google, Facebook, etc.)
  const signInWith = useCallback(
    async (strategy: OAuthStrategy) => {
      if (!signIn) {
        return;
      }

      if (loadingProvider || fetchStatus === 'fetching') {
        return;
      }
      console.log(
        '🔄 Iniciando sesión con OAuth:',
        strategy,
        '➡️ Redirigiendo a:',
        redirectUrl
      );

      try {
        setLoadingProvider(strategy);
        const { error } = await signIn.sso({
          strategy,
          redirectCallbackUrl: '/sign-in/sso-callback',
          redirectUrl,
          ...(strategy === 'oauth_google'
            ? { oidcPrompt: 'select_account' }
            : {}),
        });

        if (error) {
          setLoadingProvider(null);
          setErrors(toClerkApiErrors(error));
        }
      } catch (err) {
        setLoadingProvider(null);
        console.error('❌ Error en OAuth:', err);
        setErrors(toClerkApiErrors(err));
      }
    },
    [fetchStatus, loadingProvider, redirectUrl, signIn]
  );

  if (!isLoaded) {
    return <Loading />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors(undefined);
    setIsSubmitting(true);
    if (!signIn) {
      setIsSubmitting(false);
      return;
    }

    try {
      const { error } = await signIn.password({
        emailAddress: email.trim(),
        password,
      });
      if (error) {
        setErrors(toClerkApiErrors(error));
        return;
      }

      if (signIn.status === 'complete') {
        await signIn.finalize();
        router.replace(redirectUrl);
      } else if (signIn.status === 'needs_second_factor') {
        setSecondFactor(true);
        setErrors(undefined);
      } else if (signIn.status === 'needs_client_trust') {
        const emailCodeFactor = signIn.supportedSecondFactors.find(
          (factor) => factor.strategy === 'email_code'
        );
        if (emailCodeFactor) {
          const sendCodeResult = await signIn.mfa.sendEmailCode();
          if (sendCodeResult.error) {
            setErrors(toClerkApiErrors(sendCodeResult.error));
            return;
          }
        }
        setSecondFactor(true);
      } else {
        setErrors([
          {
            code: 'unknown_error',
            message: 'Ocurrió un error desconocido',
            longMessage: 'Ocurrió un error desconocido',
            meta: {},
          },
        ]);
      }
    } catch (err) {
      setErrors(toClerkApiErrors(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors(undefined);
    setIsSubmitting(true);

    try {
      if (!signIn) {
        return;
      }

      const { error: createError } = await signIn.create({
        identifier: email.trim(),
      });
      if (createError) {
        setErrors(toClerkApiErrors(createError));
        return;
      }

      const { error: sendCodeError } =
        await signIn.resetPasswordEmailCode.sendCode();
      if (sendCodeError) {
        setErrors(toClerkApiErrors(sendCodeError));
        return;
      }

      setSuccessfulCreation(true);
      setErrors(undefined);
    } catch (err) {
      setErrors(toClerkApiErrors(err));
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
        setErrors([
          {
            code: 'sign_in_undefined',
            message: 'SignIn no está definido',
            longMessage: 'SignIn no está definido',
            meta: {},
          },
        ]);
        setIsSubmitting(false);
        return;
      }

      const verifyResult = await signIn.resetPasswordEmailCode.verifyCode({
        code: code.trim(),
      });
      if (verifyResult.error) {
        setErrors(toClerkApiErrors(verifyResult.error));
        return;
      }

      const submitResult = await signIn.resetPasswordEmailCode.submitPassword({
        password,
      });
      if (submitResult.error) {
        setErrors(toClerkApiErrors(submitResult.error));
        return;
      }

      if (signIn.status === 'complete') {
        await signIn.finalize();
        router.replace(redirectUrl);
      } else if (signIn.status === 'needs_second_factor') {
        setSecondFactor(true);
      } else if (signIn.status === 'needs_client_trust') {
        const sendCodeResult = await signIn.mfa.sendEmailCode();
        if (sendCodeResult.error) {
          setErrors(toClerkApiErrors(sendCodeResult.error));
          return;
        }
        setSecondFactor(true);
      } else {
        setErrors([
          {
            code: 'unknown_error',
            message: 'Ocurrió un error desconocido',
            longMessage: 'Ocurrió un error desconocido',
            meta: {},
          },
        ]);
      }
    } catch (err) {
      setErrors(toClerkApiErrors(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const emailError = errors?.some(
    (error) => error.code === 'form_identifier_not_found'
  );
  const passwordError = errors?.some(
    (error) => error.code === 'form_password_incorrect'
  );

  return (
    <div
      className="
        relative flex min-h-screen flex-col items-center justify-center px-4
        sm:px-6
        lg:px-8
      "
    >
      {/* Imagen de fondo */}
      <Image
        src="/login-fondo.webp"
        alt="Fondo de inicio de sesión"
        quality={100}
        fill
        sizes="100vw"
        priority
        style={{
          objectFit: 'cover',
        }}
      />

      {/* Contenedor principal */}
      <div
        className="
          relative z-10 flex w-full flex-col items-center justify-center
          lg:flex-row lg:items-start lg:justify-between
        "
      >
        {/* Contenedor del logo */}
        <div
          className="
            mb-8 w-full max-w-3/4
            max-md:mt-10
            md:max-w-2/4
            md:max-xl:mt-0
            lg:mb-0 lg:ml-30 lg:max-w-[700px] lg:self-center
            lg:max-xl:ml-5
          "
        >
          <AspectRatio ratio={16 / 9} className="relative size-full">
            <Image
              src="/logo-login.webp"
              alt="Logo de Artiefy"
              fill
              className="object-contain"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              priority
              quality={100}
            />
          </AspectRatio>
        </div>

        {/* Formulario de inicio de sesión */}
        <div
          className="
            -mt-20 w-full max-w-md
            sm:-mt-16
            md:-mt-12
            lg:mt-0 lg:mr-15 lg:w-1/2 lg:max-w-[400px]
            xl:max-w-[500px]
          "
        >
          <div
            className="
              mx-auto w-full max-w-sm space-y-10 rounded-2xl px-8 py-10
              sm:max-w-md
            "
          >
            <div className="mb-6 text-center">
              <h2
                className="
                  xs:text-2xl
                  text-3xl font-bold
                "
              >
                INICIAR SESIÓN
              </h2>
            </div>
            {errors && (
              <ul>
                {errors.map((el, index) => (
                  <li key={index} className="-my-4 text-sm text-rose-400">
                    {el.code === 'form_password_incorrect'
                      ? 'Contraseña incorrecta. Inténtalo de nuevo o usa otro método.'
                      : el.code === 'form_identifier_not_found'
                        ? 'No se pudo encontrar tu cuenta.'
                        : el.longMessage}
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
                    className={`
                      w-full rounded-none bg-transparent px-4 py-2.5 text-sm
                      ring-1 outline-hidden ring-inset
                      sm:w-[250px]
                      md:w-[300px]
                      lg:w-[330px]
                      xl:w-[350px]
                      ${emailError ? 'ring-rose-400' : 'ring-white/20'}
                      0
                      focus:shadow-[0_0_
                      6 px_0]
                      focus:shadow-emera
                      l d-500/20
                      hover:ring-white/3
                      focus:ring-[1.5px] focus:ring-primary
                      data-invalid:shadow-rose-400/20 data-invalid:ring-rose-400
                    `}
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
                    className={`
                      w-full rounded-none bg-transparent px-4 py-2.5 text-sm
                      ring-1 outline-hidden ring-inset
                      sm:w-[250px]
                      md:w-[300px]
                      lg:w-[330px]
                      xl:w-[350px]
                      ${passwordError ? 'ring-rose-400' : 'ring-white/20'}
                      0
                      focus:shadow-[0_0_
                      6 px_0]
                      focus:shadow-emera
                      l d-500/20
                      hover:ring-white/3
                      focus:ring-[1.5px] focus:ring-primary
                      data-invalid:shadow-rose-400/20 data-invalid:ring-rose-400
                    `}
                  />
                </div>
                <div className="mt-6 flex justify-center">
                  <button
                    type="submit"
                    className="
                      py-2. 5 f o nt-medium ring-primar y focu s
                      -visible:outline-
                      [ 1.5px]
                      focus-visible:outline-
                      ffset-2 z inc-950 active : rounded-none px-3.5 text-center
                      text-sm text-primary/70 italic shadow-sm ring-1 ring-inset
                      hover:bg-white/30
                      active:scale-95
                    "
                    style={{ width: '150px' }}
                    disabled={isSubmitting}
                  >
                    <div className="flex w-full items-center justify-center">
                      {isSubmitting ? (
                        <Icons.spinner className="textmsizery size-5" />
                      ) : (
                        <span className="inline-block font-bold">
                          COMIENZA YA
                        </span>
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
                    className="
                      rounded-non e ring-white/ 2 0
                      focus:shadow-[0_0_
                      6 px_0]
                      focus:shadow-emera
                      l d-500/20 w-full bg-transparent px-4 py-2.5 text-sm
                      ring-1 outline-hidden ring-inset
                      hover:ring-white/3
                      focus:ring-[1.5px] focus:ring-primary
                    "
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
                    className="
                      rounded-non e ring-white/ 2 0
                      focus:shadow-[0_0_
                      6 px_0]
                      focus:shadow-emera
                      l d-500/20 w-full bg-transparent px-4 py-2.5 text-sm
                      ring-1 outline-hidden ring-inset
                      hover:ring-white/3
                      focus:ring-[1.5px] focus:ring-primary
                    "
                  />
                </div>
                <div className="mt-6 flex justify-center">
                  <button
                    type="submit"
                    className="
                      py-2. 5 f o nt-medium ring-primar y focu s
                      -visible:outline-
                      [ 1.5px]
                      focus-visible:outline-
                      ffset-2 z inc-950 active : rounded-none px-3.5 text-center
                      text-sm text-primary/70 italic shadow-sm ring-1 ring-inset
                      hover:bg-white/30
                      active:scale-95
                    "
                    style={{ width: '150px' }}
                    disabled={isSubmitting}
                  >
                    <div className="flex w-full items-center justify-center">
                      {isSubmitting ? (
                        <Icons.spinner className="text-sizery size-5" />
                      ) : (
                        <span className="inline-block font-bold">
                          RESTABLECER
                        </span>
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
                    className="
                      rounded-non e ring-white/ 2 0
                      focus:shadow-[0_0_
                      6 px_0]
                      focus:shadow-emera
                      l d-500/20 w-full bg-transparent px-4 py-2.5 text-sm
                      ring-1 outline-hidden ring-inset
                      hover:ring-white/3
                      focus:ring-[1.5px] focus:ring-primary
                    "
                  />
                </div>
                <div className="mt-6 flex justify-center">
                  <button
                    type="submit"
                    className="
                      py-2. 5 f o nt-medium ring-primar y focu s
                      -visible:outline-
                      [ 1.5px]
                      focus-visible:outline-
                      ffset-2 z inc-950 active : rounded-none px-3.5 text-center
                      text-sm text-primary/70 italic shadow-sm ring-1 ring-inset
                      hover:bg-white/30
                      active:scale-95
                    "
                    style={{ width: '150px' }}
                    disabled={isSubmitting}
                  >
                    <div className="flex w-full items-center justify-center">
                      {isSubmitting ? (
                        <Icons.spinner className="text-sizeri size-5" />
                      ) : (
                        <span className="inline-block font-bold">
                          ENVIAR CÓDIGO
                        </span>
                      )}
                    </div>
                  </button>
                </div>
              </form>
            )}
            {secondFactor && (
              <p>2FA es requerido, pero esta interfaz no lo maneja.</p>
            )}
            <div className="mt-4 text-center">
              <p>O ingresa con tu cuenta:</p>
              <div className="mt-2 flex justify-center space-x-4">
                <div
                  onClick={() => signInWith('oauth_google')}
                  className="
                    flex cursor-pointer items-center justify-center rounded-md
                    bg-transparent p-2
                    active:scale-95
                  "
                >
                  {loadingProvider === 'oauth_google' ? (
                    <Icons.spinner className="texsize-pr size-10" />
                  ) : (
                    <Icons.google />
                  )}
                </div>
                <div
                  onClick={() => signInWith('oauth_github')}
                  className="
                    flex cursor-pointer items-center justify-center rounded-md
                    bg-transparent p-2
                    active:scale-95
                  "
                >
                  {loadingProvider === 'oauth_github' ? (
                    <Icons.spinner className="texsize-pr size-10" />
                  ) : (
                    <Icons.gitHub />
                  )}
                </div>
                <div
                  onClick={() => signInWith('oauth_facebook')}
                  className="
                    flex cursor-pointer items-center justify-center rounded-md
                    bg-transparent p-2
                    active:scale-95
                  "
                >
                  {loadingProvider === 'oauth_facebook' ? (
                    <Icons.spinner className="teisizeary size-10" />
                  ) : (
                    <Icons.facebook />
                  )}
                </div>
              </div>
              <div className="mt-6 text-sm">
                <Link
                  href={`/sign-up${
                    searchParams?.get('redirect_url') || planId
                      ? `?${[
                          searchParams?.get('redirect_url')
                            ? `redirect_url=${encodeURIComponent(searchParams.get('redirect_url')!)}`
                            : '',
                          planId ? `plan_id=${planId}` : '',
                        ]
                          .filter(Boolean)
                          .join('&')}`
                      : ''
                  }`}
                  className="
                    decora tion-primary underlin e-offset-4 font-medium
                    text-primary outline-hidden
                    hover:text-secondary hover:underline
                    focus-visible:underline
                  "
                >
                  ¿Aun no tienes cuenta? Registrate Aquí
                </Link>
              </div>
              <div className="mt-6 text-sm">
                <button
                  onClick={() => setIsForgotPassword(true)}
                  className="
                    decora tion-primary underlin e-offset-4 font-medium
                    text-primary outline-hidden
                    hover:text-secondary hover:underline
                    focus-visible:underline
                  "
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
