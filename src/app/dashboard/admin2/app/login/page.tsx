'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from "~/components/ui/button"
import { Input } from "~/components/ui/input"
import { useRouter } from 'next/navigation'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const router = useRouter()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Aquí iría la lógica de autenticación
    router.push('/')
  }

  return (
    <div className="min-h-screen flex items-stretch">
      {/* Left side with logo */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#001220] to-[#003543] items-center justify-center relative overflow-hidden">
        <div className="relative z-10">
          <h1 className="text-[#40E0D0] text-8xl font-bold">Artiefy</h1>
        </div>
        {/* Geometric lines */}
        <div className="absolute inset-0">
          <div className="absolute bottom-0 left-0 w-96 h-96 border border-[#40E0D0]/20 transform rotate-45 translate-y-1/2 -translate-x-1/2"></div>
          <div className="absolute top-0 right-0 w-96 h-96 border border-[#40E0D0]/20 transform rotate-45 -translate-y-1/2 translate-x-1/2"></div>
        </div>
      </div>

      {/* Right side with login form */}
      <div className="w-full lg:w-1/2 bg-gradient-to-br from-[#001220] to-[#003543] p-8 flex items-center justify-center">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <h2 className="text-4xl font-bold text-white mb-2">INICIAR SESIÓN</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Input
                type="email"
                placeholder="Correo electrónico"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-transparent border-[#40E0D0]/30 text-white placeholder:text-gray-400 focus:border-[#40E0D0] focus:ring-[#40E0D0]"
                required
              />
            </div>

            <div>
              <Input
                type="password"
                placeholder="Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-transparent border-[#40E0D0]/30 text-white placeholder:text-gray-400 focus:border-[#40E0D0] focus:ring-[#40E0D0]"
                required
              />
            </div>

            <div>
              <Button
                type="submit"
                className="w-full bg-[#40E0D0] hover:bg-[#40E0D0]/90 text-[#001220] font-semibold"
              >
                COMIENZA YA
              </Button>
            </div>
          </form>

          <div className="mt-8">
            <p className="text-center text-gray-300 mb-4">o ingresa con tu cuenta:</p>
            <div className="flex justify-center space-x-4">
              <button className="p-2 bg-white rounded-full hover:bg-gray-100 transition-colors">
                <Image src="/google.svg" alt="Google" width={24} height={24} />
              </button>
              <button className="p-2 bg-[#1877F2] rounded-full hover:bg-[#1877F2]/90 transition-colors">
                <Image src="/facebook.svg" alt="Facebook" width={24} height={24} />
              </button>
              <button className="p-2 bg-black rounded-full hover:bg-gray-900 transition-colors">
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
  )
}

