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
  const { signUp, setActive, isLoaded } = useSignUp();
  const { isSignedIn } = useAuth({
    treatPendingAsSignedOut: false,
  });
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pendingVerification, setPendingVerification] = useState(false);
  const [oauthMissingFields, setOauthMissingFields] = useState<string[] | null>(
    null
  );
  const [code, setCode] = useState('');
  const [errors, setErrors] = useState<ClerkAPIError[]>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingProvider, setLoadingProvider] = useState<OAuthStrategy | null>(
    null
  );
  const [hasHandledAuth, setHasHandledAuth] = useState(false);

  // Sincronizar estado cuando el popup termina el OAuth
  useEffect(() => {
    if (!isOpen || !signUp || !setActive) return;

    const handlePopupComplete = async (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type !== 'clerk:oauth:complete') return;

      try {
        if (typeof signUp.reload === 'function') {
          await signUp.reload();
        }

        if (signUp.status === 'complete') {
          if (signUp.createdSessionId) {
            await setActive({ session: signUp.createdSessionId });
          }
          return;
        }

        if (signUp.status === 'missing_requirements') {
          const missingFields = normalizeMissingFields(
            signUp.missingFields ?? []
          );
          if (missingFields.length > 0) {
            setOauthMissingFields(missingFields);
            setErrors([
              {
                code: 'missing_requirements',
                message: `Completa tu registro. Faltan: ${formatFields(missingFields)}.`,
                longMessage: `Completa tu registro. Faltan: ${formatFields(missingFields)}.`,
                meta: {},
              },
            ]);
          }
        }
      } catch (error) {
        console.error('❌ Error al sincronizar OAuth:', error);
      }
    };

    window.addEventListener('message', handlePopupComplete);
    return () => {
      window.removeEventListener('message', handlePopupComplete);
    };
  }, [isOpen, signUp, setActive]);

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
      setUsername('');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setCode('');
      setPendingVerification(false);
      setOauthMissingFields(null);
      setErrors(undefined);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const validateSignUpInputs = (
    fname: string,
    lname: string,
    uname: string,
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

    if (!uname) {
      validationErrors.push({
        code: 'form_param_missing',
        message: 'Ingresa tu nombre de usuario.',
        longMessage: 'Ingresa tu nombre de usuario.',
        meta: { paramName: 'username' },
      });
    } else if (uname.length < 3) {
      validationErrors.push({
        code: 'form_param_format_invalid',
        message: 'El nombre de usuario debe tener al menos 3 caracteres.',
        longMessage: 'El nombre de usuario debe tener al menos 3 caracteres.',
        meta: { paramName: 'username' },
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

  const normalizeMissingFields = (fields: string[]) =>
    fields.map((field) => {
      if (field === 'email_address') return 'emailAddress';
      if (field === 'phone_number') return 'phoneNumber';
      return field;
    });

  const validateOAuthCompletionInputs = (
    fields: string[],
    data: {
      firstName: string;
      lastName: string;
      username: string;
      email: string;
      password: string;
      confirmPassword: string;
    }
  ): ClerkAPIError[] => {
    const validationErrors: ClerkAPIError[] = [];
    const normalizedFields = normalizeMissingFields(fields);
    const needs = (field: string) => normalizedFields.includes(field);

    if (needs('firstName')) {
      if (!data.firstName) {
        validationErrors.push({
          code: 'form_param_missing',
          message: 'Ingresa tu nombre.',
          longMessage: 'Ingresa tu nombre.',
          meta: { paramName: 'firstName' },
        });
      } else if (!/^[a-zA-Z\s]+$/.test(data.firstName)) {
        validationErrors.push({
          code: 'form_param_format_invalid',
          message: 'El nombre solo puede contener letras.',
          longMessage: 'El nombre solo puede contener letras.',
          meta: { paramName: 'firstName' },
        });
      }
    }

    if (needs('lastName')) {
      if (!data.lastName) {
        validationErrors.push({
          code: 'form_param_missing',
          message: 'Ingresa tu apellido.',
          longMessage: 'Ingresa tu apellido.',
          meta: { paramName: 'lastName' },
        });
      } else if (!/^[a-zA-Z\s]+$/.test(data.lastName)) {
        validationErrors.push({
          code: 'form_param_format_invalid',
          message: 'El apellido solo puede contener letras.',
          longMessage: 'El apellido solo puede contener letras.',
          meta: { paramName: 'lastName' },
        });
      }
    }

    if (needs('username')) {
      if (!data.username) {
        validationErrors.push({
          code: 'form_param_missing',
          message: 'Ingresa tu nombre de usuario.',
          longMessage: 'Ingresa tu nombre de usuario.',
          meta: { paramName: 'username' },
        });
      } else if (data.username.length < 3) {
        validationErrors.push({
          code: 'form_param_format_invalid',
          message: 'El nombre de usuario debe tener al menos 3 caracteres.',
          longMessage: 'El nombre de usuario debe tener al menos 3 caracteres.',
          meta: { paramName: 'username' },
        });
      }
    }

    if (needs('emailAddress')) {
      if (!data.email) {
        validationErrors.push({
          code: 'form_param_missing',
          message: 'Ingresa tu correo electrónico.',
          longMessage: 'Ingresa tu correo electrónico.',
          meta: { paramName: 'emailAddress' },
        });
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
        validationErrors.push({
          code: 'form_param_format_invalid',
          message: 'El formato del correo electrónico no es válido.',
          longMessage: 'El formato del correo electrónico no es válido.',
          meta: { paramName: 'emailAddress' },
        });
      }
    }

    if (needs('password')) {
      if (!data.password) {
        validationErrors.push({
          code: 'form_param_missing',
          message: 'Ingresa tu contraseña.',
          longMessage: 'Ingresa tu contraseña.',
          meta: { paramName: 'password' },
        });
      } else if (data.password.length < 8) {
        validationErrors.push({
          code: 'form_param_format_invalid',
          message: 'La contraseña debe tener al menos 8 caracteres.',
          longMessage: 'La contraseña debe tener al menos 8 caracteres.',
          meta: { paramName: 'password' },
        });
      }

      if (!data.confirmPassword) {
        validationErrors.push({
          code: 'form_param_missing',
          message: 'Confirma tu contraseña.',
          longMessage: 'Confirma tu contraseña.',
          meta: { paramName: 'confirmPassword' },
        });
      } else if (data.password !== data.confirmPassword) {
        validationErrors.push({
          code: 'password_mismatch',
          message: 'Las contraseñas no coinciden',
          longMessage: 'Las contraseñas no coinciden',
          meta: {},
        });
      }
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

    const baseUrl = window.location.origin;
    const absoluteRedirectUrl = `${baseUrl}/popup-callback`;
    const absoluteRedirectUrlFallback = `${baseUrl}/sign-up/sso-callback`;
    const absoluteRedirectUrlComplete = redirectUrl.startsWith('http')
      ? redirectUrl
      : `${baseUrl}${redirectUrl}`;
    let popupCheckInterval: ReturnType<typeof setInterval> | null = null;
    try {
      setLoadingProvider(strategy);
      setErrors(undefined);

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
        await signUp.authenticateWithRedirect({
          strategy,
          redirectUrl: absoluteRedirectUrlFallback,
          redirectUrlComplete: absoluteRedirectUrlComplete,
          continueSignUp: true,
        });
        return;
      }

      popupCheckInterval = setInterval(() => {
        if (popup.closed) {
          if (popupCheckInterval) {
            clearInterval(popupCheckInterval);
          }
          setLoadingProvider(null);
        }
      }, 500);

      await signUp.authenticateWithPopup({
        popup,
        strategy,
        redirectUrl: absoluteRedirectUrl,
        redirectUrlComplete: absoluteRedirectUrlComplete,
        continueSignUp: true,
      });

      if (typeof signUp.reload === 'function') {
        await signUp.reload();
      }

      if (signUp.status === 'complete') {
        if (signUp.createdSessionId) {
          await setActive({ session: signUp.createdSessionId });
        }
        return;
      }

      const missingFields = normalizeMissingFields(signUp.missingFields ?? []);
      if (signUp.status === 'missing_requirements') {
        if (missingFields.length > 0) {
          setOauthMissingFields(missingFields);
          setErrors([
            {
              code: 'missing_requirements',
              message: `Completa tu registro. Faltan: ${formatFields(missingFields)}.`,
              longMessage: `Completa tu registro. Faltan: ${formatFields(missingFields)}.`,
              meta: {},
            },
          ]);
        }
        return;
      }
    } catch (err) {
      console.error('❌ Error en OAuth:', err);

      if (isClerkAPIResponseError(err)) {
        const popupBlocked = err.errors.some(
          (error) => error.code === 'popup_blocked'
        );
        if (popupBlocked) {
          await signUp.authenticateWithRedirect({
            strategy,
            redirectUrl: absoluteRedirectUrlFallback,
            redirectUrlComplete: absoluteRedirectUrlComplete,
            continueSignUp: true,
          });
          return;
        }
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
    } finally {
      if (popupCheckInterval) {
        clearInterval(popupCheckInterval);
      }
      setLoadingProvider(null);
    }
  };

  const handleOAuthCompletion = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors(undefined);

    if (!isLoaded || !signUp || !setActive) {
      setErrors([
        {
          code: 'sign_up_not_ready',
          message:
            'El registro no está listo todavía. Inténtalo de nuevo en unos segundos.',
          longMessage:
            'El registro no está listo todavía. Inténtalo de nuevo en unos segundos.',
          meta: {},
        },
      ]);
      return;
    }

    const missingFields = oauthMissingFields ?? [];
    const trimmedEmail = email.trim();
    const trimmedFirstName = firstName.trim();
    const trimmedLastName = lastName.trim();
    const trimmedUsername = username.trim();
    const validationErrors = validateOAuthCompletionInputs(missingFields, {
      firstName: trimmedFirstName,
      lastName: trimmedLastName,
      username: trimmedUsername,
      email: trimmedEmail,
      password,
      confirmPassword,
    });

    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    const payload: Record<string, string> = {};
    const normalizedMissingFields = normalizeMissingFields(missingFields);
    if (normalizedMissingFields.includes('firstName')) {
      payload.firstName = trimmedFirstName;
    }
    if (normalizedMissingFields.includes('lastName')) {
      payload.lastName = trimmedLastName;
    }
    if (normalizedMissingFields.includes('username')) {
      payload.username = trimmedUsername;
    }
    if (normalizedMissingFields.includes('emailAddress')) {
      payload.emailAddress = trimmedEmail;
    }
    if (normalizedMissingFields.includes('password')) {
      payload.password = password;
    }

    try {
      setIsSubmitting(true);
      const updated = await signUp.update(payload);

      if (updated.status === 'complete') {
        if (updated.createdSessionId) {
          await setActive({ session: updated.createdSessionId });
        }
        return;
      }

      if (updated.unverifiedFields?.includes('email_address')) {
        await signUp.prepareEmailAddressVerification({
          strategy: 'email_code',
        });
        setOauthMissingFields(null);
        setPendingVerification(true);
        return;
      }

      if (updated.status === 'missing_requirements') {
        setOauthMissingFields(
          normalizeMissingFields(updated.missingFields ?? missingFields)
        );
        setErrors([
          {
            code: 'missing_requirements',
            message: `Completa tu registro. Faltan: ${formatFields(
              updated.missingFields ?? missingFields
            )}.`,
            longMessage: `Completa tu registro. Faltan: ${formatFields(
              updated.missingFields ?? missingFields
            )}.`,
            meta: {},
          },
        ]);
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

  // Email/password signup
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors(undefined);

    const trimmedEmail = email.trim();
    const trimmedFirstName = firstName.trim();
    const trimmedLastName = lastName.trim();
    const trimmedUsername = username.trim();
    const validationErrors = validateSignUpInputs(
      trimmedFirstName,
      trimmedLastName,
      trimmedUsername,
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
    if (!isLoaded || !signUp) {
      setIsSubmitting(false);
      setErrors([
        {
          code: 'sign_up_not_ready',
          message:
            'El registro no está listo todavía. Inténtalo de nuevo en unos segundos.',
          longMessage:
            'El registro no está listo todavía. Inténtalo de nuevo en unos segundos.',
          meta: {},
        },
      ]);
      return;
    }

    try {
      await signUp.create({
        firstName: trimmedFirstName,
        lastName: trimmedLastName,
        username: trimmedUsername,
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
    if (!isLoaded || !signUp || !setActive) {
      setIsSubmitting(false);
      setErrors([
        {
          code: 'sign_up_not_ready',
          message: 'La verificación no está lista todavía. Inténtalo de nuevo.',
          longMessage:
            'La verificación no está lista todavía. Inténtalo de nuevo.',
          meta: {},
        },
      ]);
      return;
    }

    try {
      const completeSignUp = await signUp.attemptEmailAddressVerification({
        code,
      });

      if (completeSignUp.status === 'complete') {
        if (!completeSignUp.createdSessionId) {
          setErrors([
            {
              code: 'session_missing',
              message:
                'No se pudo iniciar sesión tras la verificación. Inténtalo de nuevo.',
              longMessage:
                'No se pudo iniciar sesión tras la verificación. Inténtalo de nuevo.',
              meta: {},
            },
          ]);
          return;
        }
        await setActive({
          session: completeSignUp.createdSessionId,
        });
        return;
      }

      if (process.env.NODE_ENV !== 'production') {
        console.log('📊 Estado del registro:', completeSignUp.status);
        console.log('❌ Campos faltantes:', completeSignUp.missingFields);
        console.log(
          '⏳ Campos sin verificar:',
          completeSignUp.unverifiedFields
        );
        console.log('✅ Campos requeridos:', completeSignUp.requiredFields);
      }

      const missingFields = formatFields(completeSignUp.missingFields);
      const unverifiedFields = formatFields(completeSignUp.unverifiedFields);
      const statusLabel = completeSignUp.status ?? 'incompleto';

      setErrors([
        {
          code: 'verification_incomplete',
          message: `No se pudo completar el registro. Estado: ${statusLabel}. Faltan: ${missingFields}. Sin verificar: ${unverifiedFields}.`,
          longMessage: `No se pudo completar el registro. Estado: ${statusLabel}. Faltan: ${missingFields}. Sin verificar: ${unverifiedFields}.`,
          meta: {},
        },
      ]);
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
  const usernameError = errors?.some(
    (error) =>
      (error.code === 'form_param_missing' &&
        error.meta?.paramName === 'username') ||
      (error.code === 'form_param_format_invalid' &&
        error.meta?.paramName === 'username')
  );
  const confirmPasswordError = errors?.some(
    (error) =>
      error.code === 'password_mismatch' ||
      (error.code === 'form_param_missing' &&
        error.meta?.paramName === 'confirmPassword')
  );

  const formatFields = (fields?: string[]) => {
    if (!fields || fields.length === 0) return 'ninguno';
    const labels: Record<string, string> = {
      emailAddress: 'correo',
      email_address: 'correo',
      firstName: 'nombre',
      lastName: 'apellido',
      password: 'contraseña',
      phoneNumber: 'teléfono',
      phone_number: 'teléfono',
      username: 'usuario',
    };
    return fields.map((field) => labels[field] ?? field).join(', ');
  };

  const getSignUpErrorMessage = (error: ClerkAPIError) => {
    if (error.code === 'form_identifier_exists')
      return 'Esta cuenta ya existe. Por favor inicia sesión.';
    if (error.code === 'form_password_pwned')
      return 'Esta contraseña es muy común. Por favor elige una más segura.';
    if (error.code === 'password_mismatch')
      return 'Las contraseñas no coinciden';
    if (error.code === 'missing_requirements')
      return 'Completa los campos faltantes para terminar tu registro.';

    const msg = error.longMessage ?? error.message ?? '';
    // Mensaje específico de Clerk en inglés: "This verification has already been verified."
    if (/already been verified|already verified/i.test(msg))
      return 'Esta verificación ya ha sido completada.';

    // Mensajes que indican código de verificación inválido
    if (
      /verification.*code.*invalid/i.test(msg) ||
      /invalid.*verification.*code/i.test(msg)
    )
      return 'El código de verificación es inválido.';

    return msg;
  };

  const needsOAuthField = (field: string) =>
    oauthMissingFields?.includes(field) ?? false;
  const needsFirstName = needsOAuthField('firstName');
  const needsLastName = needsOAuthField('lastName');
  const needsUsername = needsOAuthField('username');
  const needsEmail = needsOAuthField('emailAddress');
  const needsPassword = needsOAuthField('password');

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
                {getSignUpErrorMessage(el)}
              </li>
            ))}
          </ul>
        )}

        {pendingVerification ? (
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
                <Icons.spinner className="mx-auto h-5 w-5 text-[#080c16]" />
              ) : (
                'Verificar'
              )}
            </button>
          </form>
        ) : oauthMissingFields && oauthMissingFields.length > 0 ? (
          <form onSubmit={handleOAuthCompletion} className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Completa tu registro para continuar con OAuth.
            </p>
            {(needsFirstName || needsLastName) && (
              <div className="grid grid-cols-2 gap-3">
                {needsFirstName && (
                  <div>
                    <input
                      onChange={(e) => setFirstName(e.target.value)}
                      id="oauth-firstName"
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
                )}
                {needsLastName && (
                  <div>
                    <input
                      onChange={(e) => setLastName(e.target.value)}
                      id="oauth-lastName"
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
                )}
              </div>
            )}
            {needsUsername && (
              <div>
                <input
                  onChange={(e) => setUsername(e.target.value)}
                  id="oauth-username"
                  name="username"
                  type="text"
                  value={username}
                  placeholder="Usuario"
                  required
                  className={`w-full rounded-lg bg-background px-4 py-3 text-sm ring-1 outline-hidden ring-inset ${
                    usernameError ? 'ring-rose-400' : 'ring-border'
                  } hover:ring-primary/50 focus:ring-2 focus:ring-primary`}
                />
              </div>
            )}
            {needsEmail && (
              <div>
                <input
                  onChange={(e) => setEmail(e.target.value)}
                  id="oauth-email"
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
            )}
            {needsPassword && (
              <>
                <div>
                  <input
                    onChange={(e) => setPassword(e.target.value)}
                    id="oauth-password"
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
                    id="oauth-confirmPassword"
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
              </>
            )}
            <button
              type="submit"
              className="w-full rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-[#080c16] transition hover:bg-primary/90 disabled:opacity-50"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <Icons.spinner className="mx-auto h-5 w-5" />
              ) : (
                'Finalizar registro'
              )}
            </button>
          </form>
        ) : (
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
                onChange={(e) => setUsername(e.target.value)}
                id="username"
                name="username"
                type="text"
                value={username}
                placeholder="Usuario"
                required
                className={`w-full rounded-lg bg-background px-4 py-3 text-sm ring-1 outline-hidden ring-inset ${
                  usernameError ? 'ring-rose-400' : 'ring-border'
                } hover:ring-primary/50 focus:ring-2 focus:ring-primary`}
              />
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
