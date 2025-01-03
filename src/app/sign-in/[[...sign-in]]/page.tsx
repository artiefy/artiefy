"use client";
import * as Clerk from "@clerk/elements/common";
import * as SignIn from "@clerk/elements/sign-in";
import { Button } from "~/components/ui/button";
import { Icons } from "~/components/ui/icons";
import { Input } from "~/components/ui/input";

export default function SignInPage() {
  return (
    <div
      className="flex h-screen flex-col md:flex-row"
      style={{
        background: "linear-gradient(70deg, #01142B 65%, #00BDD8 100%)",
      }}
    >
      <div className="order-1 h-1/2 w-full md:order-1 md:h-full md:w-1/2"></div>

      {/* Formulario de inicio de sesión */}
      <div className="order-2 flex flex-1 flex-col items-center justify-center p-8 md:order-2 md:w-1/2">
        {/* Componente de inicio de sesión personalizado */}
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
                  <Clerk.Field name="identifier" className="space-y-4">
                    <Clerk.Input asChild>
                      <Input
                        placeholder="Correo Electrónico o Usuario"
                        className="w-full rounded-none border-2 border-primary px-2.5 py-1.5"
                      />
                    </Clerk.Input>
                    <Clerk.FieldError>
                      {({ message, code }) => (
                        <span className="block text-sm text-red-500">
                          {code === 'invalid_email' ? 'Por favor, ingresa un correo electrónico válido.' : message}
                        </span>
                      )}
                    </Clerk.FieldError>
                  </Clerk.Field>
                  <div className="flex justify-center">
                    <SignIn.Action submit asChild>
                      <Button
                        className="w-auto rounded-none border border-primary p-5 font-semibold italic text-primary"
                        disabled={isGlobalLoading}
                      >
                        <Clerk.Loading>
                          {(isLoading) =>
                            isLoading ? (
                              <Icons.spinner className="size-4 animate-spin" />
                            ) : (
                              "COMIENZA YA"
                            )
                          }
                        </Clerk.Loading>
                      </Button>
                    </SignIn.Action>
                  </div>
                  <div className="mt-4 text-center">
                    <p>O ingresa con tu cuenta:</p>
                    <div className="mt-2 flex justify-center space-x-4">
                      <Clerk.Connection
                        name="google"
                        className="flex items-center justify-center gap-x-3 rounded-md px-2.5 py-1.5 font-medium"
                      >
                        <Clerk.Icon className="size-8" />
                      </Clerk.Connection>
                      <Clerk.Connection
                        name="facebook"
                        className="flex items-center justify-center gap-x-3 rounded-md px-2.5 py-1.5 font-medium"
                      >
                        <Clerk.Icon className="size-8" />
                      </Clerk.Connection>
                      <Clerk.Connection
                        name="github"
                        className="flex items-center justify-center gap-x-3 rounded-md px-2.5 py-1.5 font-medium"
                      >
                        <Clerk.Icon className="size-8" />
                      </Clerk.Connection>
                    </div>
                    <Button variant="link" size="sm" asChild>
                      <Clerk.Link navigate="sign-up" className="italic mt-4">
                        ¿Aun no tienes cuenta? Registrate Aquí
                      </Clerk.Link>
                    </Button>
                  </div>
                </SignIn.Step>
                <SignIn.Step name="verifications">
                  <SignIn.Strategy name="password">
                    <div className="w-96 space-y-10 rounded-2xl px-8 py-10">
                      <div className="mb-6 text-center">
                        <h2 className="text-3xl font-bold">Verificación</h2>
                      </div>
                      <Clerk.Field name="password" className="space-y-2">
                        <Clerk.Input asChild>
                          <Input
                            type="password"
                            placeholder="Contraseña"
                            className="w-full rounded-none border-2 border-primary px-2.5 py-1.5"
                          />
                        </Clerk.Input>
                        <Clerk.FieldError>
                          {({ message, code }) => (
                            <span className="block text-sm text-destructive">
                              {code === 'invalid_password' ? 'La contraseña es incorrecta.' : message}
                            </span>
                          )}
                        </Clerk.FieldError>
                      </Clerk.Field>
                      <div className="flex justify-center">
                        <SignIn.Action submit asChild>
                          <Button disabled={isGlobalLoading} className="rounded-none">
                            <Clerk.Loading>
                              {(isLoading) => {
                                return isLoading ? (
                                  <Icons.spinner className="size-4 animate-spin" />
                                ) : (
                                  "Entrar"
                                );
                              }}
                            </Clerk.Loading>
                          </Button>
                        </SignIn.Action>
                      </div>
                      <SignIn.Action navigate="start" asChild>
                        <Button disabled={isGlobalLoading} className="rounded-none">
                          <Clerk.Loading>
                            {(isLoading) => {
                              return isLoading ? (
                                <Icons.spinner className="size-4 animate-spin" />
                              ) : (
                                "Volver Atras"
                              );
                            }}
                          </Clerk.Loading>
                        </Button>
                      </SignIn.Action>
                    </div>
                  </SignIn.Strategy>
                </SignIn.Step>
                <SignIn.Step name="forgot-password">
                  <div className="w-96 space-y-10 rounded-2xl px-8 py-10">
                    <div className="mb-6 text-center">
                      <h2 className="text-3xl font-bold">Forgot Password</h2>
                    </div>
                    <SignIn.SupportedStrategy name="reset_password_email_code">
                      Reset your password via Email
                    </SignIn.SupportedStrategy>
                    <SignIn.Action navigate="previous" asChild>
                      <Button type="button" size="sm" variant="link">
                        Go back
                      </Button>
                    </SignIn.Action>
                  </div>
                </SignIn.Step>
                <SignIn.Step name="reset-password">
                  <div className="w-96 space-y-10 rounded-2xl px-8 py-10">
                    <div className="mb-6 text-center">
                      <h2 className="text-3xl font-bold">Reset Password</h2>
                    </div>
                    <Clerk.Field name="password">
                      <Clerk.Label>New password</Clerk.Label>
                      <Clerk.Input />
                      <Clerk.FieldError>
                        {({ message, code }) => (
                          <span className="block text-sm text-destructive">
                            {code === 'weak_password' ? 'La nueva contraseña es demasiado débil.' : message}
                          </span>
                        )}
                      </Clerk.FieldError>
                    </Clerk.Field>
                    <Clerk.Field name="confirmPassword">
                      <Clerk.Label>Confirm password</Clerk.Label>
                      <Clerk.Input />
                      <Clerk.FieldError>
                        {({ message, code }) => (
                          <span className="block text-sm text-destructive">
                            {code === 'password_mismatch' ? 'Las contraseñas no coinciden.' : message}
                          </span>
                        )}
                      </Clerk.FieldError>
                    </Clerk.Field>
                    <SignIn.Action submit>Reset password</SignIn.Action>
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