'use client';

import { useState } from 'react';
import * as Clerk from '@clerk/elements/common';
import * as SignIn from '@clerk/elements/sign-in';
import { useAuth, useSignIn } from '@clerk/nextjs';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { AspectRatio } from '~/components/estudiantes/ui/aspect-ratio';
import { Icons } from '~/components/estudiantes/ui/icons';
import Loading from '../../loading';

type OAuthStrategy = 'oauth_google' | 'oauth_facebook' | 'oauth_github';

export default function SignInPage() {
  const { isLoaded } = useAuth();
  const { signIn } = useSignIn();
  const [loadingProvider, setLoadingProvider] = useState<OAuthStrategy | null>(
    null
  );
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect_url') ?? '/';

  const signInWith = async (strategy: OAuthStrategy) => {
    if (!signIn) return;
    setLoadingProvider(strategy);
    try {
      await signIn.authenticateWithRedirect({
        strategy,
        redirectUrl: '/sso-callback',
        redirectUrlComplete: redirectTo,
      });
    } catch (error) {
      console.error('Error during sign-in:', error);
      setLoadingProvider(null);
    }
  };

  if (!isLoaded) {
    return <Loading />;
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center">
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
        <div className="mb-8 w-full max-w-[280px] sm:max-w-[300px] md:max-w-[300px] lg:mb-0 lg:ml-14 lg:w-1/2 lg:max-w-[500px] lg:self-center xl:ml-32 xl:max-w-[600px]">
          <AspectRatio ratio={16 / 9} className="relative size-full">
            <Image
              src="/logo-login.webp"
              alt="Logo de Artiefy"
              fill
              className="object-contain"
              sizes="(max-width: 640px) 280px, (max-width: 768px) 300px, (max-width: 1024px) 400px, 600px"
              priority
            />
          </AspectRatio>
        </div>

        {/* Formulario de inicio de sesión */}
        <div className="-mt-20 w-full max-w-md sm:-mt-16 md:-mt-12 lg:mt-0 lg:w-1/2 lg:max-w-[400px] lg:pr-8 xl:max-w-[500px]">
          <SignIn.Root>
            <Clerk.Loading>
              {(isGlobalLoading: boolean) => (
                <>
                  <SignIn.Step
                    name="start"
                    className="mx-auto w-96 max-w-sm space-y-10 rounded-2xl px-8 py-10 sm:max-w-md"
                  >
                    <div className="mb-6 text-center">
                      <h2 className="text-3xl font-bold">INICIAR SESIÓN</h2>
                    </div>
                    <Clerk.GlobalError className="block text-sm text-rose-400" />

                    <Clerk.Field
                      name="identifier"
                      className="group/field relative"
                    >
                      <Clerk.Input
                        placeholder="Correo Electrónico o Usuario"
                        type="text"
                        required
                        className="w-full rounded-none bg-transparent px-4 py-2.5 text-sm outline-none ring-1 ring-inset ring-white/20 hover:ring-white/30 focus:shadow-[0_0_6px_0] focus:shadow-emerald-500/20 focus:ring-[1.5px] focus:ring-primary data-[invalid]:shadow-rose-400/20 data-[invalid]:ring-rose-400"
                      />
                      <Clerk.FieldError className="mt-2 block text-xs text-rose-400" />
                    </Clerk.Field>

                    <Clerk.Field
                      name="password"
                      className="group/field relative"
                    >
                      <Clerk.Input
                        placeholder="Contraseña"
                        type="password"
                        required
                        className="w-full rounded-none bg-transparent px-4 py-2.5 text-sm outline-none ring-1 ring-inset ring-white/20 hover:ring-white/30 focus:shadow-[0_0_6px_0] focus:shadow-emerald-500/20 focus:ring-[1.5px] focus:ring-primary data-[invalid]:shadow-rose-400/20 data-[invalid]:ring-rose-400"
                      />
                      <Clerk.FieldError className="mt-2 block text-xs text-rose-400" />
                    </Clerk.Field>

                    <div className="flex justify-center">
                      <SignIn.Action
                        submit
                        disabled={isGlobalLoading}
                        className="rounded-none px-3.5 py-2.5 text-center text-sm font-medium italic text-primary shadow ring-1 ring-inset ring-primary hover:bg-white/30 focus-visible:outline-[1.5px] focus-visible:outline-offset-2 focus-visible:outline-zinc-950 active:scale-95 active:text-primary/70"
                        style={{ width: '150px' }}
                      >
                        <div className="flex w-full items-center justify-center">
                          <Clerk.Loading>
                            {(isLoading) => {
                              return isLoading ? (
                                <Icons.spinner className="size-5 animate-spin" />
                              ) : (
                                <span className="inline-block font-bold">
                                  COMIENZA YA
                                </span>
                              );
                            }}
                          </Clerk.Loading>
                        </div>
                      </SignIn.Action>
                    </div>
                    <div className="mt-4 text-center">
                      <p>O ingresa con tu cuenta:</p>
                      <div className="mt-2 flex justify-center space-x-4">
                        <div
                          onClick={() => signInWith('oauth_google')}
                          className="flex cursor-pointer items-center justify-center rounded-md bg-transparent p-2 active:scale-95"
                        >
                          <Clerk.Loading scope="provider:google">
                            {(isLoading) =>
                              isLoading ||
                              loadingProvider === 'oauth_google' ? (
                                <Icons.spinner className="size-8 animate-spin text-primary" />
                              ) : (
                                <Icons.google />
                              )
                            }
                          </Clerk.Loading>
                        </div>

                        <div
                          onClick={() => signInWith('oauth_github')}
                          className="flex cursor-pointer items-center justify-center rounded-md bg-transparent p-2 active:scale-95"
                        >
                          <Clerk.Loading scope="provider:github">
                            {(isLoading) =>
                              isLoading ||
                              loadingProvider === 'oauth_github' ? (
                                <Icons.spinner className="size-8 animate-spin text-gray-500" />
                              ) : (
                                <Icons.gitHub />
                              )
                            }
                          </Clerk.Loading>
                        </div>

                        <div
                          onClick={() => signInWith('oauth_facebook')}
                          className="flex cursor-pointer items-center justify-center rounded-md bg-transparent p-2 active:scale-95"
                        >
                          <Clerk.Loading scope="provider:facebook">
                            {(isLoading) =>
                              isLoading ||
                              loadingProvider === 'oauth_facebook' ? (
                                <Icons.spinner className="size-8 animate-spin text-primary" />
                              ) : (
                                <Icons.facebook />
                              )
                            }
                          </Clerk.Loading>
                        </div>
                      </div>
                      <div className="mt-6 text-sm">
                        <Clerk.Link
                          navigate="sign-up"
                          className="font-medium text-primary decoration-primary underline-offset-4 outline-none hover:text-secondary hover:underline focus-visible:underline"
                        >
                          ¿Aun no tienes cuenta? Registrate Aquí
                        </Clerk.Link>
                      </div>
                    </div>
                  </SignIn.Step>

                  <SignIn.Step
                    name="verifications"
                    className="mx-auto w-96 max-w-sm space-y-10 rounded-2xl px-8 py-10 sm:max-w-md"
                  >
                    <SignIn.Strategy name="email_code">
                      <div className="mb-6 text-center">
                        <h2 className="text-3xl font-bold">VERIFICAR CÓDIGO</h2>
                        <p className="mt-2 text-sm">
                          Ingresa el código enviado a tu email
                        </p>
                      </div>

                      <Clerk.GlobalError className="block text-sm text-rose-400" />

                      <Clerk.Field name="code" className="group/field relative">
                        <Clerk.Input
                          type="otp"
                          required
                          placeholder="Código de verificación"
                          className="w-full rounded-none bg-transparent px-4 py-2.5 text-sm outline-none ring-1 ring-inset ring-white/20 hover:ring-white/30 focus:shadow-[0_0_6px_0] focus:shadow-emerald-500/20 focus:ring-[1.5px] focus:ring-primary data-[invalid]:shadow-rose-400/20 data-[invalid]:ring-rose-400"
                        />
                        <Clerk.FieldError className="mt-2 block text-xs text-rose-400" />
                      </Clerk.Field>

                      <div className="flex justify-center">
                        <SignIn.Action
                          submit
                          disabled={isGlobalLoading}
                          className="rounded-none px-3.5 py-2.5 text-center text-sm font-medium italic text-primary shadow ring-1 ring-inset ring-primary hover:bg-white/30 focus-visible:outline-[1.5px] focus-visible:outline-offset-2 focus-visible:outline-zinc-950 active:scale-95 active:text-primary/70"
                          style={{ width: '150px' }}
                        >
                          <div className="flex w-full items-center justify-center">
                            <Clerk.Loading>
                              {(isLoading) => {
                                return isLoading ? (
                                  <Icons.spinner className="size-5 animate-spin" />
                                ) : (
                                  <span className="inline-block font-bold">
                                    VERIFICAR
                                  </span>
                                );
                              }}
                            </Clerk.Loading>
                          </div>
                        </SignIn.Action>
                      </div>
                    </SignIn.Strategy>
                  </SignIn.Step>
                </>
              )}
            </Clerk.Loading>
          </SignIn.Root>
        </div>
      </div>
    </div>
  );
}
