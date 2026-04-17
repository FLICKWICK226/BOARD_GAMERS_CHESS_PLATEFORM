'use client'

import { useState, Suspense } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useSearchParams } from 'next/navigation'
import { signIn } from '@/app/actions/auth'

function LoginForm() {
  const searchParams = useSearchParams()
  const message = searchParams.get('message')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(formData: FormData) {
    setError(null)
    setLoading(true)
    const result = await signIn(formData)
    if (result?.error) {
      setError(result.error)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Image
              src="/logo.png"
              alt="EPO Board Gamer — Chess Section"
              width={450}
              height={120}
              className="w-[320px] sm:w-[420px] md:w-[450px] h-auto"
              priority
            />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">
            EPO <span className="text-[#92c753]">Board Gamer</span>
          </h1>
          <p className="text-gray-400 mt-2 text-sm">Connectez-vous à votre compte</p>
        </div>

        {/* Form Card */}
        <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-2xl p-8 shadow-xl">
          {message && (
            <div className="mb-6 bg-[#92c753]/10 border border-[#92c753]/30 rounded-xl px-4 py-3 text-[#92c753] text-sm">
              {message}
            </div>
          )}
          <form action={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1.5">
                Adresse email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="vous@exemple.com"
                className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#92c753]/50 focus:border-[#92c753] transition-all duration-200"
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1.5">
                Mot de passe
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                placeholder="••••••••"
                className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#92c753]/50 focus:border-[#92c753] transition-all duration-200"
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm">
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-gradient-to-r from-[#92c753] to-[#7db345] hover:from-[#a8d468] hover:to-[#92c753] text-[#152800] font-semibold rounded-xl shadow-lg shadow-[#92c753]/25 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-[#92c753]/50"
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Connexion...
                </span>
              ) : (
                'Se connecter'
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="mt-6 pt-6 border-t border-gray-800 text-center">
            <p className="text-gray-400 text-sm">
              Pas encore de compte ?{' '}
              <Link
                href="/register"
                className="text-[#92c753] hover:text-[#a8d468] font-medium transition-colors"
              >
                Créer un compte
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="animate-spin h-8 w-8 text-[#92c753]" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}
