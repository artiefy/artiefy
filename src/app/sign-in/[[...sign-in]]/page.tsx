"use client";
import * as Clerk from "@clerk/elements/common";
import * as SignIn from "@clerk/elements/sign-in";
import { Icons } from "~/components/ui/icons";

export default function SignInPage() {
  return (
    <div
      className="flex h-screen flex-col md:flex-row"
      style={{
        background: "linear-gradient(70deg, #01142B 65%, #00BDD8 100%)",
      }}
    >
      <div className="order-1 h-1/2 w-full md:order-1 md:h-full md:w-1/2"></div>

      <div className="order-2 flex flex-1 flex-col items-center justify-center p-8 md:order-2 md:w-1/2">
        <SignIn.Root>
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
                      className="rounded-none px-3.5 py-1.5 text-center text-sm font-medium text-primary shadow ring-1 ring-inset ring-primary hover:bg-white/30 focus-visible:outline-[1.5px] focus-visible:outline-offset-2 focus-visible:outline-zinc-950 active:text-primary/70"
                    >
                      <Clerk.Loading>
                        {(isLoading) => {
                          return isLoading ? (
                            <Icons.spinner className="size-4 animate-spin" />
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
                        </Clerk.Loading>{" "}
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
              </>
            )}
          </Clerk.Loading>
        </SignIn.Root>
      </div>
    </div>
  );
}
