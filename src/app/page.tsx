import { SignInButton, SignedIn, SignedOut } from "@clerk/nextjs";
import Link from "next/link";
import { Header } from "~/components/layout/Header";
import { Button } from "~/components/ui/button";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex flex-grow items-center justify-center">
        <section className="container mx-auto px-4 py-16 text-center">
          <h1 className="mb-7 text-5xl font-bold">
            Únete a nosotros y transforma tus ideas en
            <br /> realidades con el poder del conocimiento
          </h1>
          <p className="mb-7 text-xl">
            Bienvenido a Artiefy, tu plataforma digital educativa dedicada a
            impulsar <br /> tus proyectos con conocimientos de tecnología e
            innovación
          </p>
          <div>
            <SignedOut>
              <SignInButton>
                <Button className="p-7 text-2xl font-semibold active:scale-95">
                  COMIENZA YA
                </Button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <Button
                asChild
                className="p-7 text-2xl font-semibold active:scale-95"
              >
                <Link href="/dashboard/estudiantes">DASHBOARD</Link>
              </Button>
            </SignedIn>
          </div>
        </section>
      </main>
    </div>
  );
}
