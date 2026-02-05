"use client"

import * as React from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [showPassword, setShowPassword] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()

      if (res.ok) {
        router.push("/")
        router.refresh()
      } else {
        setError(data.error || "Invalid email or password")
        setIsLoading(false)
      }
    } catch {
      setError("An error occurred. Please try again.")
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left side - Image */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-black">
        <Image
          src="/login-image.webp"
          alt="Happy couple on a date"
          fill
          className="object-cover opacity-90"
          priority
        />
        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

        {/* Logo on image */}
        <div className="absolute top-8 left-8 z-10">
          <Image
            src="/logo-light.png"
            alt="Left Field"
            width={140}
            height={60}
            className="object-contain"
          />
        </div>

        {/* Text overlay */}
        <div className="absolute bottom-12 left-8 right-8 z-10">
          <h2 className="text-3xl font-light text-white mb-3">
            Where real connections happen
          </h2>
          <p className="text-white/70 text-lg">
            Manage your community with the Left Field Admin Dashboard
          </p>
        </div>
      </div>

      {/* Right side - Login Form */}
      <div className="flex-1 flex flex-col justify-center px-6 py-12 lg:px-16 bg-white">
        <div className="mx-auto w-full max-w-sm">
          {/* Mobile logo */}
          <div className="lg:hidden mb-10 flex justify-center">
            <div className="bg-[#00433a] p-4 rounded-xl">
              <Image
                src="/logo-light.png"
                alt="Left Field"
                width={120}
                height={50}
                className="object-contain"
              />
            </div>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-semibold text-gray-900">
              Welcome back
            </h1>
            <p className="mt-2 text-sm text-gray-500">
              Sign in to your admin account to continue
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@leftfield.app"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11"
                required
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <button
                  type="button"
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-11 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-11 bg-[#00433a] hover:bg-[#003029] text-white"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign in"
              )}
            </Button>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-center text-sm text-gray-500">
              Need help?{" "}
              <a href="mailto:support@leftfield.app" className="text-[#00433a] hover:underline font-medium">
                Contact support
              </a>
            </p>
          </div>

          <div className="mt-12 text-center">
            <p className="text-xs text-gray-400">
              &copy; {new Date().getFullYear()} Left Field. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
