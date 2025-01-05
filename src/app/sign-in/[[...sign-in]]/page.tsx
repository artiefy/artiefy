"use client";
import * as Clerk from "@clerk/elements/common";
import * as SignIn from "@clerk/elements/sign-in";
import { useAuth } from "@clerk/nextjs";
import Image from "next/image";
import { AspectRatio } from "~/components/ui/aspect-ratio";
import { Icons } from "~/components/ui/icons";
import Loading from "../../loading"; // Ajusta la ruta según la ubicación real del archivo

export default function SignInPage() {
  const { isLoaded, userId } = useAuth();

  if (!isLoaded) {
    return <Loading />;
  }

  if (userId) {
    return <div>Ya has iniciado sesión</div>;
  }

  return (
    <div className="flex h-screen flex-col bg-login-bg bg-cover bg-center md:flex-row">
      <div className="order-1 flex h-1/2 w-full items-center justify-center pl-40 md:order-1 md:h-full md:w-1/2">
        <AspectRatio ratio={16 / 9} className="relative">
          <Image
            src="/imagen-login.webp"
            alt="Imagen de inicio de sesión"
            fill
            className="h-full w-full object-contain"
            priority
            style={{ maxWidth: '500px', maxHeight: '500px' }} // Ajusta el tamaño aquí
          />
        </AspectRatio>
      </div>

      <div className="order-2 flex flex-1 flex-col items-center justify-center p-8 md:order-2 md:w-1/2">
        <SignIn.Root>
          <Clerk.GlobalError className="block text-sm text-rose-400" />
          <Clerk.Loading>
            {(isGlobalLoading) => (
              <>
                <SignIn.Step
                  name="start"
                  className="w-96 space-y-10 rounded-2xl px-8 py-10"
                >
                  <div className="mb-6 text-center">
                    <h2 className="text-3xl font-bold">INICIAR SESIÓN</h2>
                  </div>

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
                      className="rounded-none px-3.5 py-1.5 text-center text-sm font-medium italic text-primary shadow ring-1 ring-inset ring-primary hover:bg-white/30 focus-visible:outline-[1.5px] focus-visible:outline-offset-2 focus-visible:outline-zinc-950 active:text-primary/70"
                      style={{ width: "150px" }}
                    >
                      <Clerk.Loading>
                        {(isLoading) => {
                          return isLoading ? (
                            <div className="flex items-center justify-center">
                              <Icons.spinner className="size-4 animate-spin" />
                            </div>
                          ) : (
                            "COMIENZA YA"
                          );
                        }}
                      </Clerk.Loading>
                    </SignIn.Action>
                  </div>

                  <div className="mt-4 text-center">
                    <p>O ingresa con tu cuenta:</p>
                    <div className="mt-2 flex justify-center space-x-4">
                      <Clerk.Connection
                        name="google"
                        className="flex items-center justify-center gap-x-3 rounded-md px-2.5 py-1.5 font-medium"
                        disabled={isGlobalLoading} // Deshabilitar si isGlobalLoading es true
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
                        disabled={isGlobalLoading} // Deshabilitar si isGlobalLoading es true
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
                        disabled={isGlobalLoading} // Deshabilitar si isGlobalLoading es true
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

                <SignIn.Step
                  name="verifications"
                  className="relative isolate w-full space-y-8 rounded-2xl bg-emerald-950 px-4 py-10 shadow-md ring-1 ring-inset ring-white/10 before:absolute before:inset-0 before:-z-10 before:rounded-2xl before:bg-black/50 sm:w-96 sm:px-8"
                >
                  <Clerk.GlobalError className="block text-sm text-rose-400" />
                  <SignIn.Strategy name="phone_code">
                    <Clerk.Field name="code" className="group/field relative">
                      <Clerk.Label className="absolute left-2 top-0 -translate-y-1/2 bg-emerald-950 px-2 font-mono text-xs/4 text-white before:absolute before:inset-0 before:-z-10 before:bg-black/50 group-focus-within/field:text-emerald-300 group-data-[invalid]/field:text-rose-400">
                        Código de Verificación
                      </Clerk.Label>
                      <Clerk.Input
                        type="otp"
                        required
                        className="w-full rounded-lg bg-transparent px-4 py-2.5 text-sm text-white outline-none ring-1 ring-inset ring-white/20 hover:ring-white/30 focus:shadow-[0_0_6px_0] focus:shadow-emerald-500/20 focus:ring-[1.5px] focus:ring-emerald-300 data-[invalid]:shadow-rose-400/20 data-[invalid]:ring-rose-400"
                      />
                      <Clerk.FieldError className="mt-2 block text-xs text-rose-400" />
                    </Clerk.Field>
                    <SignIn.Action
                      submit
                      className="relative isolate w-full rounded-lg bg-gradient-to-b from-emerald-400 to-emerald-500 px-3.5 py-2.5 text-center text-sm font-medium text-emerald-950 shadow-[0_1px_0_0_theme(colors.white/30%)_inset,0_-1px_1px_0_theme(colors.black/5%)_inset] outline-none before:absolute before:inset-0 before:-z-10 before:rounded-lg before:bg-white/10 before:opacity-0 hover:before:opacity-100 focus-visible:outline-[1.5px] focus-visible:outline-offset-2 focus-visible:outline-white active:text-emerald-950/80 active:before:bg-black/10"
                    >
                      Entrar
                    </SignIn.Action>
                  </SignIn.Strategy>
                  <div className="mt-6 text-sm">
                    <Clerk.Link
                      navigate="sign-up"
                      className="font-medium text-primary decoration-primary underline-offset-4 outline-none hover:text-secondary hover:underline focus-visible:underline"
                    >
                      ¿Aun no tienes cuenta? Registrate Aquí
                    </Clerk.Link>
                  </div>
                </SignIn.Step>
              </>
            )}
          </Clerk.Loading>
        </SignIn.Root>
      </div>
    </div>
  );
}