'use client';

import { useState } from 'react';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { Button } from '~/components/admin/ui/button';
import { Input } from '~/components/admin/ui/input';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Aquí iría la lógica de autenticación
    router.push('/');
  };

  return (
    <div className="flex min-h-screen items-stretch">
      {/* Left side with logo */}
      <div className="relative hidden items-center justify-center overflow-hidden bg-gradient-to-br from-[#001220] to-[#003543] lg:flex lg:w-1/2">
        <div className="relative z-10">
          <h1 className="text-8xl font-bold text-[#40E0D0]">Artiefy</h1>
        </div>
        {/* Geometric lines */}
        <div className="absolute inset-0">
          <div className="absolute bottom-0 left-0 size-96 -translate-x-1/2 translate-y-1/2 rotate-45 border border-[#40E0D0]/20" />
          <div className="absolute right-0 top-0 size-96 -translate-y-1/2 translate-x-1/2 rotate-45 border border-[#40E0D0]/20" />
        </div>
      </div>

      {/* Right side with login form */}
      <div className="flex w-full items-center justify-center bg-gradient-to-br from-[#001220] to-[#003543] p-8 lg:w-1/2">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <h2 className="mb-2 text-4xl font-bold text-white">
              INICIAR SESIÓN
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Input
                type="email"
                placeholder="Correo electrónico"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border-[#40E0D0]/30 bg-transparent text-white placeholder:text-gray-400 focus:border-[#40E0D0] focus:ring-[#40E0D0]"
                required
              />
            </div>

            <div>
              <Input
                type="password"
                placeholder="Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border-[#40E0D0]/30 bg-transparent text-white placeholder:text-gray-400 focus:border-[#40E0D0] focus:ring-[#40E0D0]"
                required
              />
            </div>

            <div>
              <Button
                type="submit"
                className="w-full bg-[#40E0D0] font-semibold text-[#001220] hover:bg-[#40E0D0]/90"
              >
                COMIENZA YA
              </Button>
            </div>
          </form>

          <div className="mt-8">
            <p className="mb-4 text-center text-gray-300">
              o ingresa con tu cuenta:
            </p>
            <div className="flex justify-center space-x-4">
              <button className="rounded-full bg-white p-2 transition-colors hover:bg-gray-100">
                <Image src="/google.svg" alt="Google" width={24} height={24} />
              </button>
              <button className="rounded-full bg-[#1877F2] p-2 transition-colors hover:bg-[#1877F2]/90">
                <Image
                  src="/facebook.svg"
                  alt="Facebook"
                  width={24}
                  height={24}
                />
              </button>
              <button className="rounded-full bg-black p-2 transition-colors hover:bg-gray-900">
                <Image src="/x.svg" alt="X" width={24} height={24} />
              </button>
            </div>
          </div>

          <p className="text-center text-gray-300">
            ¿Aún no tienes cuenta?{' '}
            <Link href="/register" className="text-[#40E0D0] hover:underline">
              Regístrate Aquí
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
