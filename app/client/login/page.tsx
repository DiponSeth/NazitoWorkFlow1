"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { MessageCircle, Eye, EyeOff, ArrowLeft } from "lucide-react"

interface Client {
  id: string
  firstName: string
  middleName?: string
  lastName: string
  name: string
  email: string
  password: string
  originalEmail?: string
  phone?: string
  avatar?: string
  createdAt: string
}

// Admin credentials
const ADMIN_EMAIL = "diponseth40@gmail.com"
const ADMIN_PASSWORD = "diponseth123@#$"

export default function ClientLogin() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [forgotEmail, setForgotEmail] = useState("")
  const [recoveredPassword, setRecoveredPassword] = useState("")
  const [clientFirstName, setClientFirstName] = useState("")

  // Check if email matches a client and show personalized greeting
  useEffect(() => {
    if (email) {
      const saved = localStorage.getItem("nazitoWorkTrackerData")
      if (saved) {
        const data = JSON.parse(saved)
        const clients: Client[] = data.clients || []
        const client = clients.find((c) => c.email.toLowerCase() === email.toLowerCase())
        if (client) {
          setClientFirstName(client.firstName || client.name.split(" ")[0])
        } else {
          setClientFirstName("")
        }
      }
    } else {
      setClientFirstName("")
    }
  }, [email])

  const handleLogin = () => {
    setError("")

    // Check admin login first
    if (email.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
      if (password === ADMIN_PASSWORD) {
        router.push("/")
        return
      } else {
        setError("Incorrect password. Please try again.")
        return
      }
    }

    const saved = localStorage.getItem("nazitoWorkTrackerData")
    if (!saved) {
      setError("No account found. Please contact admin.")
      return
    }

    const data = JSON.parse(saved)
    const clients: Client[] = data.clients || []
    const client = clients.find((c) => c.email.toLowerCase() === email.toLowerCase())

    if (!client) {
      setError("Email not found. Please check your email or contact admin.")
      return
    }

    if (client.password !== password) {
      setError("Incorrect password. Please try again.")
      return
    }

    // Store client session
    localStorage.setItem("nazitoClientSession", JSON.stringify({ 
      id: client.id, 
      name: client.name, 
      firstName: client.firstName,
      email: client.email,
      avatar: client.avatar
    }))
    router.push(`/client/${client.id}`)
  }

  const handleForgotPassword = () => {
    setRecoveredPassword("")
    setError("")

    // Check admin
    if (forgotEmail.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
      setRecoveredPassword(ADMIN_PASSWORD)
      return
    }

    const saved = localStorage.getItem("nazitoWorkTrackerData")
    if (!saved) {
      setError("No account found.")
      return
    }

    const data = JSON.parse(saved)
    const clients: Client[] = data.clients || []
    const client = clients.find((c) => c.email.toLowerCase() === forgotEmail.toLowerCase())

    if (!client) {
      setError("Email not found.")
      return
    }

    setRecoveredPassword(client.password)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-violet-50/50 to-background flex flex-col">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-violet-600 text-white shadow-lg">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-14 md:h-16">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="relative h-8 w-8 md:h-10 md:w-10">
                <Image src="/nazito-logo.png" alt="NAZITO Logo" fill className="object-contain" />
              </div>
              <span className="font-bold text-lg md:text-xl tracking-tight">NAZITO</span>
            </div>
            <Link href="/" className="text-white/80 hover:text-white transition-colors flex items-center gap-2 hover:scale-105">
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Back to Admin</span>
            </Link>
          </div>
        </div>
      </nav>

      <main className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-violet-100 bg-white/80 backdrop-blur shadow-xl">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 relative h-16 w-16">
              <Image src="/nazito-logo.png" alt="NAZITO Logo" fill className="object-contain" />
            </div>
            {showForgotPassword ? (
              <>
                <CardTitle className="text-xl">Recover Password</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Enter your email to recover your password
                </p>
              </>
            ) : (
              <>
                <CardTitle className="text-2xl">
                  {clientFirstName ? (
                    <span>Hi, {clientFirstName}! 👋</span>
                  ) : (
                    <span>Client Login</span>
                  )}
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  {clientFirstName ? "Welcome back" : "Login to view your project dashboard"}
                </p>
              </>
            )}
          </CardHeader>
          <CardContent>
            {!showForgotPassword ? (
              <div className="space-y-4">
                <div>
                  <Label className="text-sm">Email</Label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="mt-1 hover:border-violet-300 focus:border-violet-500 transition-colors"
                  />
                </div>
                <div>
                  <Label className="text-sm">Password</Label>
                  <div className="relative mt-1">
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="pr-10 hover:border-violet-300 focus:border-violet-500 transition-colors"
                      onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors hover:scale-110"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {error && <p className="text-sm text-red-500">{error}</p>}

                <Button
                  onClick={handleLogin}
                  className="w-full bg-violet-600 hover:bg-violet-700 text-white transition-all hover:scale-[1.02]"
                >
                  Login
                </Button>

                <button
                  onClick={() => {
                    setShowForgotPassword(true)
                    setError("")
                  }}
                  className="w-full text-center text-sm text-violet-600 hover:text-violet-700 transition-colors hover:underline"
                >
                  Forgot Password?
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <Label className="text-sm">Email</Label>
                  <Input
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="mt-1 hover:border-violet-300 focus:border-violet-500 transition-colors"
                  />
                </div>

                {error && <p className="text-sm text-red-500">{error}</p>}

                {recoveredPassword && (
                  <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200">
                    <p className="text-sm text-emerald-700">Your password is:</p>
                    <p className="text-lg font-bold text-emerald-600 mt-1">{recoveredPassword}</p>
                  </div>
                )}

                <Button
                  onClick={handleForgotPassword}
                  className="w-full bg-violet-600 hover:bg-violet-700 text-white transition-all hover:scale-[1.02]"
                >
                  Recover Password
                </Button>

                <button
                  onClick={() => {
                    setShowForgotPassword(false)
                    setError("")
                    setRecoveredPassword("")
                  }}
                  className="w-full text-center text-sm text-violet-600 hover:text-violet-700 transition-colors hover:underline"
                >
                  Back to Login
                </button>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Footer */}
      <footer className="border-t bg-white/50 py-4">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          &copy;Copyright Dipon Seth 2026
        </div>
      </footer>

      {/* WhatsApp Floating Button */}
      <a
        href="https://wa.me/917980131920"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 h-14 w-14 bg-[#25D366] rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform z-50"
      >
        <MessageCircle className="h-7 w-7 text-white" />
      </a>
    </div>
  )
}
