'use client';

import { useEffect, useState } from 'react';

import Image from 'next/image';

import { useAuth, useSignUp } from '@clerk/nextjs';
import { isClerkAPIResponseError } from '@clerk/nextjs/errors';
import { type ClerkAPIError, type OAuthStrategy } from '@clerk/types';

import { Icons } from '~/components/estudiantes/ui/icons';

import '../../../styles/mini-login-uiverse.css';

interface MiniSignUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSignUpSuccess: () => void;
  redirectUrl?: string;
  onSwitchToLogin?: () => void;
}

export default function MiniSignUpModal({
  isOpen,
  onClose,
  onSignUpSuccess,
  redirectUrl = '/',
  onSwitchToLogin,
}: MiniSignUpModalProps) {
  const { signUp, setActive } = useSignUp();
  const { isSignedIn } = useAuth();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pendingVerification, setPendingVerification] = useState(false);
  const [code, setCode] = useState('');
  const [errors, setErrors] = useState<ClerkAPIError[]>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingProvider, setLoadingProvider] = useState<OAuthStrategy | null>(
    null
  );
  const [hasHandledAuth, setHasHandledAuth] = useState(false);

  // Detectar cuando OAuth o registro se completa exitosamente
  useEffect(() => {
    if (isSignedIn && !hasHandledAuth) {
      setHasHandledAuth(true);
      if (loadingProvider) {
        setLoadingProvider(null);
      }
      onSignUpSuccess();
      onClose();
    }
  }, [isSignedIn, hasHandledAuth, loadingProvider, onSignUpSuccess, onClose]);

  // Reset hasHandledAuth cuando se cierra el modal
  useEffect(() => {
    if (!isOpen) {
      setHasHandledAuth(false);
      // Reset form fields
      setFirstName('');
      setLastName('');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setCode('');
      setPendingVerification(false);
      setErrors(undefined);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const validateSignUpInputs = (
    fname: string,
    lname: string,
    email: string,
    pwd: string,
    confirmPwd: string
  ): ClerkAPIError[] => {
    const validationErrors: ClerkAPIError[] = [];

    if (!fname) {
      validationErrors.push({
        code: 'form_param_missing',
        message: 'Ingresa tu nombre.',
        longMessage: 'Ingresa tu nombre.',
        meta: { paramName: 'firstName' },
      });
    } else if (!/^[a-zA-Z\s]+$/.test(fname)) {
      validationErrors.push({
        code: 'form_param_format_invalid',
        message: 'El nombre solo puede contener letras.',
        longMessage: 'El nombre solo puede contener letras.',
        meta: { paramName: 'firstName' },
      });
    }

    if (!lname) {
      validationErrors.push({
        code: 'form_param_missing',
        message: 'Ingresa tu apellido.',
        longMessage: 'Ingresa tu apellido.',
        meta: { paramName: 'lastName' },
      });
    } else if (!/^[a-zA-Z\s]+$/.test(lname)) {
      validationErrors.push({
        code: 'form_param_format_invalid',
        message: 'El apellido solo puede contener letras.',
        longMessage: 'El apellido solo puede contener letras.',
        meta: { paramName: 'lastName' },
      });
    }

    if (!email) {
      validationErrors.push({
        code: 'form_param_missing',
        message: 'Ingresa tu correo electrónico.',
        longMessage: 'Ingresa tu correo electrónico.',
        meta: { paramName: 'emailAddress' },
      });
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      validationErrors.push({
        code: 'form_param_format_invalid',
        message: 'El formato del correo electrónico no es válido.',
        longMessage: 'El formato del correo electrónico no es válido.',
        meta: { paramName: 'emailAddress' },
      });
    }

    if (!pwd) {
      validationErrors.push({
        code: 'form_param_missing',
        message: 'Ingresa tu contraseña.',
        longMessage: 'Ingresa tu contraseña.',
        meta: { paramName: 'password' },
      });
    } else if (pwd.length < 8) {
      validationErrors.push({
        code: 'form_param_format_invalid',
        message: 'La contraseña debe tener al menos 8 caracteres.',
        longMessage: 'La contraseña debe tener al menos 8 caracteres.',
        meta: { paramName: 'password' },
      });
    }

    if (!confirmPwd) {
      validationErrors.push({
        code: 'form_param_missing',
        message: 'Confirma tu contraseña.',
        longMessage: 'Confirma tu contraseña.',
        meta: { paramName: 'confirmPassword' },
      });
    }

    return validationErrors;
  };

  // OAuth signup
  const signUpWith = async (strategy: OAuthStrategy) => {
    if (!signUp) {
      setErrors([
        {
          code: 'sign_up_undefined',
          message: 'SignUp no está definido',
          meta: {},
        },
      ]);
      return;
    }

    try {
      setLoadingProvider(strategy);
      setErrors(undefined);

      const baseUrl = window.location.origin;
      const absoluteRedirectUrl = `${baseUrl}/sign-up/sso-callback`;
      const absoluteRedirectUrlComplete = redirectUrl.startsWith('http')
        ? redirectUrl
        : `${baseUrl}${redirectUrl}`;

      const width = 500;
      const height = 650;
      const left = (window.screen.width - width) / 2;
      const top = (window.screen.height - height) / 2;

      const popup = window.open(
        'about:blank',
        '_blank',
        `width=${width},height=${height},left=${left},top=${top},toolbar=no,location=no,status=no,menubar=no,scrollbars=yes,resizable=yes,popup=yes`
      );

      if (!popup || popup.closed || typeof popup.closed === 'undefined') {
        setLoadingProvider(null);
        setErrors([
          {
            code: 'popup_blocked',
            message: 'Popup bloqueado',
            longMessage:
              'Por favor, permite las ventanas emergentes en tu navegador para continuar.',
            meta: {},
          },
        ]);
        return;
      }

      const popupCheckInterval = setInterval(() => {
        if (popup.closed) {
          clearInterval(popupCheckInterval);
          setLoadingProvider(null);
        }
      }, 500);

      await signUp.authenticateWithPopup({
        popup,
        strategy,
        redirectUrl: absoluteRedirectUrl,
        redirectUrlComplete: absoluteRedirectUrlComplete,
      });

      clearInterval(popupCheckInterval);
    } catch (err) {
      setLoadingProvider(null);
      console.error('❌ Error en OAuth:', err);

      if (isClerkAPIResponseError(err)) {
        setErrors(err.errors);
      } else {
        setErrors([
          {
            code: 'oauth_error',
            message:
              err instanceof Error
                ? err.message
                : 'Error en el registro con OAuth',
            longMessage:
              err instanceof Error
                ? err.message
                : 'Error en el registro con OAuth',
            meta: {},
          },
        ]);
      }
    }
  };

  // Email/password signup
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors(undefined);

    const trimmedEmail = email.trim();
    const trimmedFirstName = firstName.trim();
    const trimmedLastName = lastName.trim();
    const validationErrors = validateSignUpInputs(
      trimmedFirstName,
      trimmedLastName,
      trimmedEmail,
      password,
      confirmPassword
    );
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    // Validar que las contraseñas coincidan
    if (password !== confirmPassword) {
      setErrors([
        {
          code: 'password_mismatch',
          message: 'Las contraseñas no coinciden',
          longMessage: 'Las contraseñas no coinciden',
          meta: {},
        },
      ]);
      return;
    }

    setIsSubmitting(true);
    if (!signUp) return;

    try {
      await signUp.create({
        firstName: trimmedFirstName,
        lastName: trimmedLastName,
        emailAddress: trimmedEmail,
        password,
      });

      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      setPendingVerification(true);
    } catch (err) {
      if (isClerkAPIResponseError(err)) {
        setErrors(err.errors);
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
    } finally {
      setIsSubmitting(false);
    }
  };

  // Verify email
  const onPressVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors(undefined);
    setIsSubmitting(true);
    if (!signUp) return;

    try {
      const completeSignUp = await signUp.attemptEmailAddressVerification({
        code,
      });

      if (completeSignUp.status !== 'complete') {
        console.log(JSON.stringify(completeSignUp, null, 2));
      }

      if (completeSignUp.status === 'complete') {
        if (setActive) {
          await setActive({ session: completeSignUp.createdSessionId });
        }
        // El useEffect se encargará del resto
      }
    } catch (err) {
      if (isClerkAPIResponseError(err)) {
        setErrors(err.errors);
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
    } finally {
      setIsSubmitting(false);
    }
  };

  const emailError = errors?.some(
    (error) =>
      error.code === 'form_identifier_exists' ||
      (error.code === 'form_param_format_invalid' &&
        error.meta?.paramName === 'emailAddress') ||
      (error.code === 'form_param_missing' &&
        error.meta?.paramName === 'emailAddress')
  );
  const passwordError = errors?.some(
    (error) =>
      error.code === 'form_password_pwned' ||
      (error.code === 'form_param_missing' &&
        error.meta?.paramName === 'password') ||
      (error.code === 'form_param_format_invalid' &&
        error.meta?.paramName === 'password')
  );
  const firstNameError = errors?.some(
    (error) =>
      (error.code === 'form_param_missing' &&
        error.meta?.paramName === 'firstName') ||
      (error.code === 'form_param_format_invalid' &&
        error.meta?.paramName === 'firstName')
  );
  const lastNameError = errors?.some(
    (error) =>
      (error.code === 'form_param_missing' &&
        error.meta?.paramName === 'lastName') ||
      (error.code === 'form_param_format_invalid' &&
        error.meta?.paramName === 'lastName')
  );
  const confirmPasswordError = errors?.some(
    (error) =>
      error.code === 'password_mismatch' ||
      (error.code === 'form_param_missing' &&
        error.meta?.paramName === 'confirmPassword')
  );

  return (
    <div className="pointer-events-auto fixed inset-0 z-[1100] flex items-center justify-center bg-black/50">
      {/* OAuth Loading Overlay */}
      {loadingProvider && (
        <div className="absolute inset-0 z-[1150] flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4">
            <Icons.spinner className="h-12 w-12 text-primary" />
            <p className="text-lg font-semibold text-white">
              Redirigiendo a {loadingProvider.replace('oauth_', '')}...
            </p>
          </div>
        </div>
      )}

      <div
        role="dialog"
        className="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] fixed top-[50%] left-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 overflow-hidden rounded-[32px] border border-border/50 bg-background/95 p-8 shadow-lg backdrop-blur-xl duration-200 sm:max-w-md"
        tabIndex={-1}
        style={{ pointerEvents: 'auto' }}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 rounded-full p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          aria-label="Cerrar"
        >
          <svg
            width="15"
            height="15"
            viewBox="0 0 15 15"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M11.7816 4.03157C12.0062 3.80702 12.0062 3.44295 11.7816 3.2184C11.5571 2.99385 11.193 2.99385 10.9685 3.2184L7.50005 6.68682L4.03164 3.2184C3.80708 2.99385 3.44301 2.99385 3.21846 3.2184C2.99391 3.44295 2.99391 3.80702 3.21846 4.03157L6.68688 7.49999L3.21846 10.9684C2.99391 11.193 2.99391 11.557 3.21846 11.7816C3.44301 12.0061 3.80708 12.0061 4.03164 11.7816L7.50005 8.31316L10.9685 11.7816C11.193 12.0061 11.5571 12.0061 11.7816 11.7816C12.0062 11.557 12.0062 11.193 11.7816 10.9684L8.31322 7.49999L11.7816 4.03157Z"
              fill="currentColor"
              fillRule="evenodd"
              clipRule="evenodd"
            />
          </svg>
        </button>

        {/* Decorative background elements */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {/* Stars */}
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={`star-${i}`}
              className="absolute h-1 w-1 animate-pulse rounded-full bg-accent/40"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${1.5 + Math.random() * 2}s`,
              }}
            />
          ))}

          {/* Floating rockets */}
          <div className="animate-float absolute top-1/2 right-4 h-28 w-20 -translate-y-1/2 opacity-20">
            <div className="relative h-full w-full rotate-[-15deg]">
              <svg
                viewBox="0 0 64 80"
                className="h-full w-full drop-shadow-[0_0_15px_hsl(180_100%_50%/0.4)]"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <defs>
                  <linearGradient
                    id="loginRocketGradient"
                    x1="0%"
                    y1="0%"
                    x2="100%"
                    y2="0%"
                  >
                    <stop offset="0%" stopColor="hsl(180 100% 40%)" />
                    <stop offset="100%" stopColor="hsl(190 100% 50%)" />
                  </linearGradient>
                  <linearGradient
                    id="loginRocketDark"
                    x1="100%"
                    y1="0%"
                    x2="0%"
                    y2="0%"
                  >
                    <stop offset="0%" stopColor="hsl(200 100% 25%)" />
                    <stop offset="100%" stopColor="hsl(190 100% 35%)" />
                  </linearGradient>
                  <linearGradient
                    id="loginFlameGradient"
                    x1="0%"
                    y1="0%"
                    x2="0%"
                    y2="100%"
                  >
                    <stop offset="0%" stopColor="hsl(180 100% 60%)" />
                    <stop offset="50%" stopColor="hsl(40 100% 60%)" />
                    <stop offset="100%" stopColor="hsl(20 100% 50%)" />
                  </linearGradient>
                </defs>
                <path d="M32 4 L32 52 L16 52 Z" fill="url(#loginRocketDark)" />
                <path
                  d="M32 4 L32 52 L48 52 Z"
                  fill="url(#loginRocketGradient)"
                />
                <path
                  d="M32 8 L32 48"
                  stroke="hsl(180 100% 70% / 0.4)"
                  strokeWidth="1"
                />
                <g className="animate-flame origin-top">
                  <path
                    d="M24 52 L32 76 L40 52 Z"
                    fill="url(#loginFlameGradient)"
                    opacity="0.95"
                  />
                  <path
                    d="M28 52 L32 68 L36 52 Z"
                    fill="hsl(50 100% 75%)"
                    opacity="0.9"
                  />
                </g>
              </svg>
            </div>
          </div>

          <div
            className="animate-float absolute bottom-20 left-6 h-16 w-12 opacity-15"
            style={{ animationDelay: '1.5s' }}
          >
            <div className="relative h-full w-full rotate-[20deg]">
              <svg
                viewBox="0 0 64 80"
                className="h-full w-full drop-shadow-[0_0_10px_hsl(180_100%_50%/0.3)]"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M32 4 L32 52 L16 52 Z" fill="url(#loginRocketDark)" />
                <path
                  d="M32 4 L32 52 L48 52 Z"
                  fill="url(#loginRocketGradient)"
                />
                <g className="animate-flame origin-top">
                  <path
                    d="M24 52 L32 76 L40 52 Z"
                    fill="url(#loginFlameGradient)"
                    opacity="0.95"
                  />
                </g>
              </svg>
            </div>
          </div>

          {/* Floating particles */}
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={`particle-${i}`}
              className="animate-rise absolute h-1.5 w-1.5 rounded-full bg-gradient-to-b from-accent/60 to-orange-400/40"
              style={{
                left: `${20 + Math.random() * 60}%`,
                bottom: '-10px',
                animationDelay: `${i * 0.8}s`,
                animationDuration: `${3 + Math.random() * 1.5}s`,
              }}
            />
          ))}
        </div>

        {/* Header */}
        <div className="relative z-10 flex flex-col items-center space-y-3 text-center sm:text-left">
          <h2 className="sr-only text-lg leading-none font-semibold tracking-tight">
            Crear cuenta
          </h2>
          <p className="text-sm text-muted-foreground">Regístrate en:</p>
          <Image
            src="/artiefy-logo.png"
            alt="Artiefy"
            width={120}
            height={48}
            className="h-12 w-auto object-contain"
            priority
          />
        </div>

        {errors && (
          <ul className="space-y-1">
            {errors.map((el, index) => (
              <li key={index} className="text-sm text-rose-400">
                {el.code === 'form_identifier_exists'
                  ? 'Esta cuenta ya existe. Por favor inicia sesión.'
                  : el.code === 'form_password_pwned'
                    ? 'Esta contraseña es muy común. Por favor elige una más segura.'
                    : el.code === 'password_mismatch'
                      ? 'Las contraseñas no coinciden'
                      : el.longMessage}
              </li>
            ))}
          </ul>
        )}

        {!pendingVerification ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <input
                  onChange={(e) => setFirstName(e.target.value)}
                  id="firstName"
                  name="firstName"
                  type="text"
                  value={firstName}
                  placeholder="Nombre"
                  required
                  className={`w-full rounded-lg bg-background px-4 py-3 text-sm ring-1 outline-hidden ring-inset ${
                    firstNameError ? 'ring-rose-400' : 'ring-border'
                  } hover:ring-primary/50 focus:ring-2 focus:ring-primary`}
                />
              </div>
              <div>
                <input
                  onChange={(e) => setLastName(e.target.value)}
                  id="lastName"
                  name="lastName"
                  type="text"
                  value={lastName}
                  placeholder="Apellido"
                  required
                  className={`w-full rounded-lg bg-background px-4 py-3 text-sm ring-1 outline-hidden ring-inset ${
                    lastNameError ? 'ring-rose-400' : 'ring-border'
                  } hover:ring-primary/50 focus:ring-2 focus:ring-primary`}
                />
              </div>
            </div>
            <div>
              <input
                onChange={(e) => setEmail(e.target.value)}
                id="email"
                name="email"
                type="email"
                value={email}
                placeholder="Correo Electrónico"
                required
                className={`w-full rounded-lg bg-background px-4 py-3 text-sm ring-1 outline-hidden ring-inset ${
                  emailError ? 'ring-rose-400' : 'ring-border'
                } hover:ring-primary/50 focus:ring-2 focus:ring-primary`}
              />
            </div>
            <div>
              <input
                onChange={(e) => setPassword(e.target.value)}
                id="password"
                name="password"
                type="password"
                value={password}
                placeholder="Contraseña"
                required
                className={`w-full rounded-lg bg-background px-4 py-3 text-sm ring-1 outline-hidden ring-inset ${
                  passwordError ? 'ring-rose-400' : 'ring-border'
                } hover:ring-primary/50 focus:ring-2 focus:ring-primary`}
              />
            </div>
            <div>
              <input
                onChange={(e) => setConfirmPassword(e.target.value)}
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={confirmPassword}
                placeholder="Confirmar Contraseña"
                required
                className={`w-full rounded-lg bg-background px-4 py-3 text-sm ring-1 outline-hidden ring-inset ${
                  confirmPasswordError ? 'ring-rose-400' : 'ring-border'
                } hover:ring-primary/50 focus:ring-2 focus:ring-primary`}
              />
            </div>
            <button
              type="submit"
              className="w-full rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-[#080c16] transition hover:bg-primary/90 disabled:opacity-50"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <Icons.spinner className="mx-auto h-5 w-5" />
              ) : (
                'Crear Cuenta'
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={onPressVerify} className="space-y-4">
            <div>
              <p className="mb-2 text-sm text-muted-foreground">
                Ingresa el código que enviamos a tu correo
              </p>
              <input
                onChange={(e) => setCode(e.target.value)}
                id="code"
                name="code"
                type="text"
                value={code}
                placeholder="Código de verificación"
                required
                className="w-full rounded-lg bg-background px-4 py-3 text-sm ring-1 ring-border outline-hidden ring-inset hover:ring-primary/50 focus:ring-2 focus:ring-primary"
              />
            </div>
            <button
              type="submit"
              className="w-full rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-50"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <Icons.spinner className="mx-auto h-5 w-5" />
              ) : (
                'Verificar'
              )}
            </button>
          </form>
        )}

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              O continúa con
            </span>
          </div>
        </div>

        <div className="flex justify-center gap-3">
          <button
            type="button"
            onClick={() => signUpWith('oauth_google')}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-background transition hover:bg-accent disabled:opacity-50"
            disabled={!!loadingProvider}
          >
            {loadingProvider === 'oauth_google' ? (
              <Icons.spinner className="h-4 w-4" />
            ) : (
              <Icons.google className="h-5 w-5" />
            )}
          </button>
          <button
            type="button"
            onClick={() => signUpWith('oauth_github')}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-background transition hover:bg-accent disabled:opacity-50"
            disabled={!!loadingProvider}
          >
            {loadingProvider === 'oauth_github' ? (
              <Icons.spinner className="h-4 w-4" />
            ) : (
              <Icons.gitHub className="h-5 w-5" />
            )}
          </button>
          <button
            type="button"
            onClick={() => signUpWith('oauth_facebook')}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-background transition hover:bg-accent disabled:opacity-50"
            disabled={!!loadingProvider}
          >
            {loadingProvider === 'oauth_facebook' ? (
              <Icons.spinner className="h-4 w-4" />
            ) : (
              <Icons.facebook className="h-5 w-5" />
            )}
          </button>
        </div>

        {onSwitchToLogin && (
          <div className="text-center">
            <button
              type="button"
              onClick={onSwitchToLogin}
              className="text-sm text-primary hover:underline"
            >
              ¿Ya tienes cuenta? Inicia sesión
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
