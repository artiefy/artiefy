"use client";
import * as Clerk from "@clerk/elements/common";
import Link from 'next/link';
import * as SignIn from "@clerk/elements/sign-in";

import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";

export default function SignInPage() {
  return (
    <div className="flex h-screen flex-col md:flex-row" style={{ background: 'linear-gradient(70deg, #01142B 65%, #00BDD8 100%)' }}>
      <div className="order-1 h-1/2 w-full md:order-1 md:h-full md:w-1/2"></div>

      {/* Formulario de inicio de sesión */}
      <div className="order-2 flex flex-1 flex-col items-center justify-center p-8 md:order-2 md:w-1/2">
        {/* Componente de inicio de sesión personalizado */}
        <SignIn.Root>
          <SignIn.Step
            name="start"
            className="w-96 rounded-2xl py-10 px-8 space-y-10"
          >
            <div className="mb-6 text-center">
              <h2 className="text-3xl font-bold">INICIAR SESIÓN</h2>
            </div>
            <Clerk.Field name="identifier" className="space-y-4">
              <Clerk.Input asChild>
                <Input
                  placeholder="Correo Electrónico"
                  className="w-full rounded-none border-2 border-primary px-2.5 py-1.5"
                />
              </Clerk.Input>
              <Clerk.FieldError className="block text-sm text-red-500" />
            </Clerk.Field>
            <Clerk.Field name="password" className="space-y-4">
              <Clerk.Input asChild>
                <Input
                  type="password"
                  placeholder="Contraseña"
                  className="w-full rounded-none border-2 border-primary px-2.5 py-1.5"
                />
              </Clerk.Input>
              <Clerk.FieldError className="block text-sm text-red-500" />
            </Clerk.Field>
            <div className="flex justify-center">
              <SignIn.Action submit asChild>
                <Button className="font-semibold italic w-auto rounded-none border border-primary p-5 text-primary">
                  COMIENZA YA
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
              <p className="w-96 mt-8 text-left">¿Aun no tienes cuenta?<Link href="/sign-up" className="text-primary underline">Regístrate Aquí</Link></p>            </div>
          </SignIn.Step>
          <SignIn.Step name="verifications">
            <SignIn.Strategy name="email_code">
              <Clerk.Field name="unique-name" className="space-y-4">
                <Clerk.Input asChild>
                  <Input
                    placeholder="Code"
                    className="w-full rounded-none border border-primary px-2.5 py-1.5"
                  />
                </Clerk.Input>
                <Clerk.FieldError className="block text-sm text-red-500" />
              </Clerk.Field>
              <SignIn.Action submit asChild>
                <Button className="rounded-md bg-black px-2.5 py-1.5 text-white">
                  Continue
                </Button>
              </SignIn.Action>
            </SignIn.Strategy>
          </SignIn.Step>
        </SignIn.Root>
      </div>
    </div>
  );
}