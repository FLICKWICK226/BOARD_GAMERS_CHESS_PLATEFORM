'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { resetPassword } from '@/app/actions/auth'

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    await resetPassword(formData)
    // Always show the same success message — never confirm if email exists
    setSent(true)
    setLoading(false)
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
            Réinitialiser le mot de passe
          </h1>
          <p className="text-gray-400 mt-2 text-sm">
            Entrez votre email pour recevoir un lien de réinitialisation.
          </p>
        </div>

        <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-2xl p-8 shadow-xl">
          {sent ? (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-[#92c753]/10 flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-[#92c753]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-white font-semibold">Email envoyé</p>
              <p className="text-gray-400 text-sm">
                Si un compte existe avec cette adresse, vous recevrez un email
                dans les prochaines minutes. Vérifiez aussi vos spams.
              </p>
              <p className="text-xs text-gray-600 mt-2">
                Le lien expire dans 1 heure.
              </p>
              <Link
                href="/login"
                className="block mt-4 text-[#92c753] hover:text-[#a8d468] text-sm transition-colors"
              >
                ← Retour à la connexion
              </Link>
            </div>
          ) : (
            <form action={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="forgot-email" className="block text-sm font-medium text-gray-300 mb-1.5">
                  Adresse email
                </label>
                <input
                  id="forgot-email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="vous@exemple.com"
                  className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500
                    focus:outline-none focus:ring-2 focus:ring-[#92c753]/50 focus:border-[#92c753] transition-all duration-200"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 bg-gradient-to-r from-[#92c753] to-[#7db345]
                  hover:from-[#a8d468] hover:to-[#92c753] text-[#152800] font-semibold rounded-xl
                  shadow-lg shadow-[#92c753]/25 transition-all duration-200
                  disabled:opacity-50 disabled:cursor-not-allowed
                  focus:outline-none focus:ring-2 focus:ring-[#92c753]/50"
              >
                {loading ? 'Envoi...' : 'Envoyer le lien'}
              </button>

              <p className="text-center text-sm text-gray-500">
                <Link href="/login" className="text-[#92c753]/70 hover:text-[#92c753] transition-colors">
                  ← Retour à la connexion
                </Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
