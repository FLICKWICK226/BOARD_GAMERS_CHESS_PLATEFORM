'use client'

import { useState } from 'react'
import Link from 'next/link'
import { signUp } from '@/app/actions/auth'

export default function RegisterPage() {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [level, setLevel] = useState<string>('beginner')

  async function handleSubmit(formData: FormData) {
    setError(null)
    setLoading(true)
    
    // Append the level to the formData since it's a manual selector
    formData.set('level', level)
    
    const result = await signUp(formData)
    if (result?.error) {
      setError(result.error)
      setLoading(false)
    }
  }

  const levels = [
    {
      id: 'beginner',
      name: 'Débutant',
      desc: 'Je connais les règles de base',
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
        </svg>
      )
    },
    {
      id: 'intermediate',
      name: 'Intermédiaire',
      desc: 'Je joue régulièrement',
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M20 12V8H6a2 2 0 100 4h14v4H6a2 2 0 110-4" />
        </svg>
      )
    },
    {
      id: 'expert',
      name: 'Expert',
      desc: 'Je suis un joueur confirmé',
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      )
    }
  ]

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-full">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-amber-700/10 rounded-full blur-[120px]" />
      </div>

      <div className="w-full max-w-xl relative z-10">
        {/* Logo / Header */}
        <div className="text-center mb-10">
          <div className="relative inline-block">
            <div className="absolute inset-0 bg-amber-500 blur-2xl opacity-20 animate-pulse" />
            <div className="relative inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 mb-6 shadow-2xl rotate-3 transform transition-transform hover:rotate-0">
              <svg className="w-10 h-10 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
              </svg>
            </div>
          </div>
          <h1 className="text-4xl font-extrabold text-white tracking-tight mb-3">
            Rejoignez <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-600">Board Chess</span>
          </h1>
          <p className="text-gray-400 text-lg">Prêt à relever le défi ?</p>
        </div>

        {/* Form Card */}
        <div className="bg-gray-900/40 backdrop-blur-xl border border-white/10 rounded-3xl p-8 md:p-10 shadow-3xl">
          <form action={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column: Auth Info */}
              <div className="space-y-5">
                <div>
                  <label htmlFor="register-email" className="block text-sm font-semibold text-gray-300 mb-2 ml-1">
                    Adresse email
                  </label>
                  <input
                    id="register-email"
                    name="email"
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="vous@exemple.com"
                    className="w-full px-5 py-3.5 bg-gray-800/40 border border-gray-700/50 rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500/50 transition-all duration-300"
                  />
                </div>

                <div>
                  <label htmlFor="register-password" className="block text-sm font-semibold text-gray-300 mb-2 ml-1">
                    Mot de passe
                  </label>
                  <input
                    id="register-password"
                    name="password"
                    type="password"
                    required
                    minLength={6}
                    autoComplete="new-password"
                    placeholder="6+ caractères"
                    className="w-full px-5 py-3.5 bg-gray-800/40 border border-gray-700/50 rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500/50 transition-all duration-300"
                  />
                </div>

                <div>
                  <label htmlFor="register-confirm" className="block text-sm font-semibold text-gray-300 mb-2 ml-1">
                    Confirmer
                  </label>
                  <input
                    id="register-confirm"
                    name="confirmPassword"
                    type="password"
                    required
                    minLength={6}
                    autoComplete="new-password"
                    placeholder="Confirmation"
                    className="w-full px-5 py-3.5 bg-gray-800/40 border border-gray-700/50 rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500/50 transition-all duration-300"
                  />
                </div>
              </div>

              {/* Right Column: Level Selection */}
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-3 ml-1">
                  Votre niveau actuel
                </label>
                <div className="space-y-3">
                  {levels.map((l) => (
                    <button
                      key={l.id}
                      type="button"
                      onClick={() => setLevel(l.id)}
                      className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all duration-300 text-left ${
                        level === l.id
                          ? 'bg-amber-500/10 border-amber-500/50 shadow-inner'
                          : 'bg-gray-800/20 border-gray-700/30 hover:bg-gray-800/40 hover:border-gray-600/50'
                      }`}
                    >
                      <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-colors duration-300 ${
                        level === l.id ? 'bg-amber-500 text-white' : 'bg-gray-700/50 text-gray-400'
                      }`}>
                        {l.icon}
                      </div>
                      <div>
                        <div className={`font-bold ${level === l.id ? 'text-white' : 'text-gray-300'}`}>
                          {l.name}
                        </div>
                        <div className="text-xs text-gray-500 font-medium">
                          {l.desc}
                        </div>
                      </div>
                      {level === l.id && (
                        <div className="ml-auto">
                          <svg className="w-5 h-5 text-amber-500" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-2xl px-5 py-4 text-red-400 text-sm flex items-center gap-3 animate-head-shake">
                <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 px-6 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-white font-bold text-lg rounded-2xl shadow-xl shadow-amber-500/20 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-1 active:translate-y-0"
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Initialisation...
                </span>
              ) : (
                'Créer mon compte'
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="mt-8 pt-8 border-t border-white/5 text-center">
            <p className="text-gray-400">
              Déjà un compte ?{' '}
              <Link
                href="/login"
                className="text-amber-500 hover:text-amber-400 font-bold underline decoration-amber-500/30 underline-offset-4 transition-colors"
              >
                Connectez-vous ici
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
