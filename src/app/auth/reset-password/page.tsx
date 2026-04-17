'use client'

import { useState } from 'react'
import Image from 'next/image'
import { updatePassword } from '@/app/actions/auth'

export default function ResetPasswordPage() {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(formData: FormData) {
    setError(null)
    setLoading(true)
    const result = await updatePassword(formData)
    if (result?.error) {
      setError(result.error)
      setLoading(false)
    }
    // On success, updatePassword redirects to /dashboard automatically
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Image
              src="/logo.png"
              alt="EPO Board Gamer"
              width={450}
              height={120}
              className="w-[280px] h-auto"
              priority
            />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Nouveau mot de passe
          </h1>
          <p className="text-gray-400 mt-2 text-sm">
            Choisissez un nouveau mot de passe sécurisé (8+ caractères).
          </p>
        </div>

        <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-2xl p-8 shadow-xl">
          <form action={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="new-password" className="block text-sm font-medium text-gray-300 mb-1.5">
                Nouveau mot de passe
              </label>
              <input
                id="new-password"
                name="password"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                placeholder="8+ caractères"
                className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500
                  focus:outline-none focus:ring-2 focus:ring-[#92c753]/50 focus:border-[#92c753] transition-all duration-200"
              />
            </div>

            <div>
              <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-300 mb-1.5">
                Confirmer le mot de passe
              </label>
              <input
                id="confirm-password"
                name="confirmPassword"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                placeholder="Confirmation"
                className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500
                  focus:outline-none focus:ring-2 focus:ring-[#92c753]/50 focus:border-[#92c753] transition-all duration-200"
              />
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-gradient-to-r from-[#92c753] to-[#7db345]
                hover:from-[#a8d468] hover:to-[#92c753] text-[#152800] font-semibold rounded-xl
                shadow-lg shadow-[#92c753]/25 transition-all duration-200
                disabled:opacity-50 disabled:cursor-not-allowed
                focus:outline-none focus:ring-2 focus:ring-[#92c753]/50"
            >
              {loading ? 'Mise à jour...' : 'Mettre à jour le mot de passe'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
