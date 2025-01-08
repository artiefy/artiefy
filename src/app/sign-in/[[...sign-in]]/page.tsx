"use client";
import * as Clerk from "@clerk/elements/common";
import * as SignIn from "@clerk/elements/sign-in";
import { useAuth } from "@clerk/nextjs";
import Image, { getImageProps } from "next/image";
import styled from "styled-components";
import { AspectRatio } from "~/components/ui/aspect-ratio";
import { Icons } from "~/components/ui/icons";
import Loading from "../../loading";

// Contenedor del logo con media queries para mover el logo
const LogoContainer = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;

  /* Ajustes para pantallas pequeñas */
  @media (max-width: 639px) {
    width: 50%; /* Ajustar el ancho en pantallas pequeñas */
    margin-top: -5rem; /* Ajustar el margen superior en pantallas pequeñas */
  }

  /* Ajustes para pantallas medianas */
  @media (min-width: 640px) and (max-width: 767px) {
    width: 50%; /* Ajustar el ancho en pantallas pequeñas */
    margin-top: -5rem; /* Ajustar el margen superior en pantallas pequeñas */
    margin-right: -5rem
  }

  /* Ajustes para pantallas grandes */
  @media (min-width: 768px) and (max-width: 1023px) {
    transform: translateY(0); /* No hay desplazamiento en pantallas grandes */
    margin-left: 10rem; /* Ajustar el margen izquierdo en pantallas extra grandes */
  }

  /* Ajustes para pantallas extra grandes */
  @media (min-width: 1024px) {
    transform: translateY(0); /* No hay desplazamiento en pantallas extra grandes */
    margin-left: 10rem; /* Ajustar el margen izquierdo en pantallas extra grandes */
  }
`;

// Contenedor de la página
const StyledDiv = styled.div`
  margin-top: 0;
  @media (max-width: 639px) {
    margin-top: -15rem; /* Ajustar el margen superior en pantallas pequeñas */
  }

 /* Ajustes para pantallas medianas */
 @media (min-width: 640px) and (max-width: 767px) {
  margin-top: -15rem; /* Ajustar el margen izquierdo en pantallas extra grandes */
}
`;

function getBackgroundImage(srcSet = "") {
  const imageSet = srcSet
    .split(", ")
    .map((str) => {
      const [url, dpi] = str.split(" ");
      return `url("${url}") ${dpi}`;
    })
    .join(", ");
  return `image-set(${imageSet})`;
}

export default function SignInPage() {
  const { isLoaded, userId } = useAuth();

  if (!isLoaded) {
    return <Loading />;
  }

  if (userId) {
    return <div>Ya has iniciado sesión</div>;
  }

  const {
    props: { srcSet },
  } = getImageProps({
    alt: "",
    width: 1280,
    height: 720,
    src: "/login-fondo.webp",
  });
  const backgroundImage = getBackgroundImage(srcSet);
  const style = {
    height: "100vh",
    width: "100vw",
    backgroundImage,
    backgroundSize: "cover",
    backgroundPosition: "center",
  };

  return (
    <div
      className="relative flex h-screen flex-col items-center justify-center lg:flex-row lg:items-start  "
      style={style}
    >
      {/* Contenedor del logo con desplazamiento en diferentes pantallas */}
      <LogoContainer>
        <AspectRatio ratio={16 / 9} className="relative sm:w-3/4 md:w-3/4 lg:w-3/4 xl:w-3/4"
        >
          <Image
            src="/logo-login.webp"
            alt="Imagen de inicio de sesión"
            fill
            className="object-contain h-full w-full"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            priority
            loading="eager"
          />
        </AspectRatio>
      </LogoContainer>

      {/* Formulario de inicio de sesión */}
      <StyledDiv className="order-2 flex w-full flex-col items-center justify-center pt-28">
        <SignIn.Root>
          <Clerk.GlobalError className="block text-sm text-rose-400" />
          <Clerk.Loading>
            {(isGlobalLoading) => (
              <>
                <SignIn.Step
                  name="start"
                  className="w-96 max-w-md space-y-10 rounded-2xl px-8 py-10"
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
                      className="w-full rounded-none bg-transparent px-4 py-2.5 text-sm outline-none ring-1 ring-inset ring-white/20 hover:ring-white/30 focus:ring-emerald-500/20"
                    />
                    <Clerk.FieldError className="mt-2 block text-xs text-rose-400" />
                  </Clerk.Field>

                  <Clerk.Field name="password" className="group/field relative">
                    <Clerk.Input
                      placeholder="Contraseña"
                      type="password"
                      required
                      className="w-full rounded-none bg-transparent px-4 py-2.5 text-sm outline-none ring-1 ring-inset ring-white/20 hover:ring-white/30 focus:ring-emerald-500/20"
                    />
                    <Clerk.FieldError className="mt-2 block text-xs text-rose-400" />
                  </Clerk.Field>

                  <div className="flex justify-center">
                    <SignIn.Action
                      submit
                      disabled={isGlobalLoading}
                      className="rounded-none px-3.5 py-1.5 text-center text-sm font-medium text-primary shadow ring-1 ring-inset ring-primary hover:bg-white/30 focus:outline-none active:text-primary/70"
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
                        disabled={isGlobalLoading}
                      >
                        <Clerk.Loading scope="provider:google">
                          {(isLoading) =>
                            isLoading ? (
                              <Icons.spinner className="size-8 animate-spin" />
                            ) : (
                              <Clerk.Icon className="size-8" />
                            )
                          }
                        </Clerk.Loading>
                      </Clerk.Connection>

                      <Clerk.Connection
                        name="facebook"
                        className="flex items-center justify-center gap-x-3 rounded-md px-2.5 py-1.5 font-medium"
                        disabled={isGlobalLoading}
                      >
                        <Clerk.Loading scope="provider:facebook">
                          {(isLoading) =>
                            isLoading ? (
                              <Icons.spinner className="size-8 animate-spin" />
                            ) : (
                              <Clerk.Icon className="size-8" />
                            )
                          }
                        </Clerk.Loading>
                      </Clerk.Connection>

                      <Clerk.Connection
                        name="github"
                        className="flex items-center justify-center gap-x-3 rounded-md px-2.5 py-1.5 font-medium"
                        disabled={isGlobalLoading}
                      >
                        <Clerk.Loading scope="provider:github">
                          {(isLoading) =>
                            isLoading ? (
                              <Icons.spinner className="size-8 animate-spin" />
                            ) : (
                              <Clerk.Icon className="size-8" />
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
      </StyledDiv>
    </div>
  );
}