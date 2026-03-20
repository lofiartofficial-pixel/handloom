'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion } from 'framer-motion'
import { Eye, EyeOff, Mail, Lock, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { loginSchema, type LoginInput } from '@/lib/validations'

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect') || '/'
  const supabase = createClient()

  const [showPassword, setShowPassword] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  })

  // ============================================
  // EMAIL/PASSWORD LOGIN
  // ============================================
  const onSubmit = async (data: LoginInput) => {
    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    })

    if (error) {
      toast.error(
        error.message === 'Invalid login credentials'
          ? 'Invalid email or password | වැරදි email හෝ password'
          : error.message
      )
      return
    }

    toast.success('Welcome back! | ආයුබෝවන්! 🌸')
    router.push(redirect)
    router.refresh()
  }

  // ============================================
  // GOOGLE OAUTH
  // ============================================
  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?redirect=${redirect}`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    })

    if (error) {
      toast.error('Google login failed')
      setIsGoogleLoading(false)
    }
  }

  return (
    <main className="min-h-screen hero-bg flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center mx-auto mb-3 shadow-xl">
              <span className="text-white font-bold text-2xl font-display">S</span>
            </div>
            <div className="font-display text-2xl font-bold text-yellow-300">Sari Vikunu</div>
            <div className="font-sinhala text-yellow-200/70 text-sm">සාරි විකුණු</div>
          </Link>
        </div>

        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="p-8 pb-0">
            <h1 className="font-display text-2xl font-bold text-gray-800">Welcome Back!</h1>
            <p className="font-sinhala text-gray-500 text-sm mt-1">ඔබේ account log in කරන්න</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="p-8 space-y-4">
            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input
                  {...register('email')}
                  type="email"
                  placeholder="your@email.com"
                  autoComplete="email"
                  className="w-full pl-11 pr-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                />
              </div>
              {errors.email && (
                <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="w-full pl-11 pr-12 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 disabled:opacity-60 text-white py-3 rounded-full font-semibold transition flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <><Loader2 size={16} className="animate-spin" /> Logging in...</>
              ) : (
                'Login'
              )}
            </button>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-xs text-gray-400">
                <span className="bg-white px-3">Or continue with</span>
              </div>
            </div>

            {/* Google Login */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={isGoogleLoading}
              className="w-full border border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50 text-gray-700 py-3 rounded-full font-semibold transition flex items-center justify-center gap-3 disabled:opacity-60"
            >
              {isGoogleLoading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              )}
              Continue with Google
            </button>

            <p className="text-center text-sm text-gray-500">
              No account?{' '}
              <Link href="/register" className="text-purple-600 font-semibold hover:underline">
                Register
              </Link>
            </p>
          </form>
        </div>

        <div className="text-center mt-5">
          <Link href="/" className="text-yellow-200/60 hover:text-yellow-200 text-sm transition">
            ← Back to Home
          </Link>
        </div>
      </motion.div>
    </main>
  )
}
