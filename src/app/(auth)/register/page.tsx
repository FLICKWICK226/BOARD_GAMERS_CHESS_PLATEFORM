'use client'

import { useState } from 'react'
import Link from 'next/link'
import { signUp } from '@/app/actions/auth'

export default function RegisterPage() {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(formData: FormData) {
    setError(null)
    setLoading(true)
    const result = await signUp(formData)
    if (result?.error) {
      setError(result.error)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo / Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 mb-4 shadow-lg shadow-amber-500/20">
            <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">
            Rejoignez <span className="text-amber-500">Board Chess</span>
          </h1>
          <p className="text-gray-400 mt-2 text-sm">Créez votre compte et commencez à jouer</p>
        </div>

        {/* Form Card */}
        <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-2xl p-8 shadow-xl">
          <form action={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label htmlFor="register-email" className="block text-sm font-medium text-gray-300 mb-1.5">
                Adresse email
              </label>
              <input
                id="register-email"
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="vous@exemple.com"
                className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all duration-200"
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="register-password" className="block text-sm font-medium text-gray-300 mb-1.5">
                Mot de passe
              </label>
              <input
                id="register-password"
                name="password"
                type="password"
                required
                minLength={6}
                autoComplete="new-password"
                placeholder="Minimum 6 caractères"
                className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all duration-200"
              />
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="register-confirm" className="block text-sm font-medium text-gray-300 mb-1.5">
                Confirmer le mot de passe
              </label>
              <input
                id="register-confirm"
                name="confirmPassword"
                type="password"
                required
                minLength={6}
                autoComplete="new-password"
                placeholder="Retapez votre mot de passe"
                className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all duration-200"
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
              className="w-full py-3 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-semibold rounded-xl shadow-lg shadow-amber-500/25 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-amber-500/50"
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Inscription...
                </span>
              ) : (
                'Créer mon compte'
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="mt-6 pt-6 border-t border-gray-800 text-center">
            <p className="text-gray-400 text-sm">
              Déjà un compte ?{' '}
              <Link
                href="/login"
                className="text-amber-500 hover:text-amber-400 font-medium transition-colors"
              >
                Se connecter
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
