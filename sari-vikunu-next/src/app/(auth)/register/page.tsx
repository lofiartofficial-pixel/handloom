'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion } from 'framer-motion'
import { Eye, EyeOff, Mail, Lock, User, Phone, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { registerSchema, type RegisterInput } from '@/lib/validations'

export default function RegisterPage() {
  const router = useRouter()
  const supabase = createClient()
  const [showPassword, setShowPassword] = useState(false)

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
  })

  const onSubmit = async (data: RegisterInput) => {
    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: { data: { name: data.name, phone: data.phone } },
    })

    if (error) {
      toast.error(error.message)
      return
    }

    toast.success('Account created! Welcome to Sari Vikunu 🌸')
    router.push('/')
    router.refresh()
  }

  return (
    <main className="min-h-screen hero-bg flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center mx-auto mb-3 shadow-xl">
              <span className="text-white font-bold text-2xl font-display">S</span>
            </div>
            <div className="font-display text-2xl font-bold text-yellow-300">Sari Vikunu</div>
          </Link>
        </div>

        <div className="bg-white rounded-3xl shadow-2xl p-8">
          <h1 className="font-display text-2xl font-bold text-gray-800 mb-1">Create Account</h1>
          <p className="font-sinhala text-gray-500 text-sm mb-6">නව account හදාගන්න</p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Full Name *</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input {...register('name')} placeholder="ඔබේ නම" className="w-full pl-11 pr-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-400" />
              </div>
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Email *</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input {...register('email')} type="email" placeholder="your@email.com" className="w-full pl-11 pr-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-400" />
              </div>
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Phone</label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input {...register('phone')} type="tel" placeholder="+94 7X XXX XXXX" className="w-full pl-11 pr-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-400" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Password * (min 8 chars)</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input {...register('password')} type={showPassword ? 'text' : 'password'} placeholder="••••••••" className="w-full pl-11 pr-12 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-400" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
            </div>

            <button type="submit" disabled={isSubmitting}
              className="w-full btn-gold py-3 rounded-full font-semibold flex items-center justify-center gap-2 disabled:opacity-60 mt-2">
              {isSubmitting ? <><Loader2 size={16} className="animate-spin" /> Creating...</> : 'Create Account'}
            </button>

            <p className="text-center text-sm text-gray-500">
              Have account? <Link href="/login" className="text-purple-600 font-semibold hover:underline">Login</Link>
            </p>
          </form>
        </div>
        <div className="text-center mt-5">
          <Link href="/" className="text-yellow-200/60 hover:text-yellow-200 text-sm">← Back to Home</Link>
        </div>
      </motion.div>
    </main>
  )
}
