"use client";

import * as Clerk from "@clerk/elements/common";
import * as SignIn from "@clerk/elements/sign-in";
import { useAuth } from "@clerk/nextjs";
import Image from "next/image";
import { AspectRatio } from "~/components/ui/aspect-ratio";
import { Icons } from "~/components/ui/icons";
import Loading from "../../loading";

export default function SignInPage() {
  const { isLoaded, userId } = useAuth();

  if (!isLoaded) {
    return <Loading />;
  }

  if (userId) {
    return <div>Ya has iniciado sesión</div>;
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center">
      {/* Imagen de fondo */}
      <Image
        src="/login-fondo.webp"
        alt="Fondo de inicio de sesión"
        layout="fill"
        objectFit="cover"
        quality={85}
        priority
        sizes="100vw"
      />

      {/* Contenedor principal */}
      <div className="relative z-10 flex w-full flex-col items-center justify-center px-4 lg:flex-row lg:items-start lg:justify-between lg:px-10">
        {/* Contenedor del logo */}
        <div className="mb-8 w-full xl:ml-32 lg:ml-14 max-w-[280px] sm:max-w-[300px] md:max-w-[300px] lg:mb-0 lg:w-1/2 lg:max-w-[500px] lg:self-center xl:max-w-[600px]">
          <AspectRatio ratio={16 / 9} className="relative h-full w-full">
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
        <div className="w-full max-w-md -mt-20 sm:-mt-16 md:-mt-12 lg:mt-0 lg:w-1/2 lg:max-w-[400px] xl:max-w-[500px] lg:pr-8">
        <SignIn.Root>
            <Clerk.Loading>
              {(isGlobalLoading) => (
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

                  <Clerk.Field name="password" className="group/field relative">
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
                      className="rounded-none px-3.5 py-2.5 text-center text-sm font-medium italic text-primary shadow ring-1 ring-inset ring-primary hover:bg-white/30 focus-visible:outline-[1.5px] focus-visible:outline-offset-2 focus-visible:outline-zinc-950 active:text-primary/70 active:scale-95"
                      style={{ width: "150px" }}
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
                      <Clerk.Connection
                        name="google"
                        className="flex items-center justify-center gap-x-3 rounded-md px-2.5 py-1.5 font-medium"
                      >
                        <Clerk.Loading scope="provider:google">
                          {(isLoading) =>
                            isLoading ? (
                              <Icons.spinner className="size-8 animate-spin" />
                            ) : (
                              <>
                                <Clerk.Icon className="size-8" />
                              </>
                            )
                          }
                        </Clerk.Loading>
                      </Clerk.Connection>

                      <Clerk.Connection
                        name="facebook"
                        className="flex items-center justify-center gap-x-3 rounded-md px-2.5 py-1.5 font-medium"
                      >
                        <Clerk.Loading scope="provider:facebook">
                          {(isLoading) =>
                            isLoading ? (
                              <Icons.spinner className="size-8 animate-spin" />
                            ) : (
                              <>
                                <Clerk.Icon className="size-8" />
                              </>
                            )
                          }
                        </Clerk.Loading>
                      </Clerk.Connection>

                      <Clerk.Connection
                        name="github"
                        className="flex items-center justify-center gap-x-3 rounded-md px-2.5 py-1.5 font-medium"
                      >
                        <Clerk.Loading scope="provider:github">
                          {(isLoading) =>
                            isLoading ? (
                              <Icons.spinner className="size-8 animate-spin" />
                            ) : (
                              <>
                                <Clerk.Icon className="size-8" />
                              </>
                            )
                          }
                        </Clerk.Loading>
                      </Clerk.Connection>
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
              )}
            </Clerk.Loading>
          </SignIn.Root>
        </div>
      </div>
    </div>
  );
}
