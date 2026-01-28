"use client"

import React from "react"

import { useState, useEffect, useCallback, useRef } from "react"
import Image from "next/image"
import Link from "next/link"
import {
  Plus,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Check,
  Clock,
  AlertCircle,
  IndianRupee,
  Target,
  Calendar as CalendarIcon,
  Home,
  ListTodo,
  History,
  Menu,
  X,
  TrendingUp,
  TrendingDown,
  Filter,
  Users,
  CreditCard,
  Search,
  Upload,
  Eye,
  Download,
  XCircle,
  BarChart3,
  FileText,
  MessageCircle,
  UserPlus,
  Phone,
  Mail,
  Camera,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { Textarea } from "@/components/ui/textarea"

// Types
interface Task {
  id: string
  clientId: string
  clientName: string
  projectName: string
  projectLink?: string
  comments?: string
  workType: "Long Form" | "Short Form" | "Reel" | "Thumbnail" | "Website" | "Custom"
  amount: number
  status: "Done" | "In Progress" | "Not Done" | "Cancelled"
  dateReceived: string
  dateDelivered?: string
  feedback?: string
  rating?: number
}

interface Payment {
  id: string
  clientId: string
  clientName: string
  amount: number
  date: string
  invoiceUrl?: string
  status: "Paid" | "Pending" | "Verified"
  screenshot?: string
  utrNumber?: string
}

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

interface AppState {
  tasks: Task[]
  payments: Payment[]
  clients: Client[]
  monthlyTarget: number
  selectedDate: string
}

type ViewType = "home" | "tasks" | "add" | "history" | "payments" | "clients" | "services" | "profile" | "createClient"

// Admin credentials
const ADMIN_EMAIL = "diponseth40@gmail.com"
const ADMIN_PASSWORD = "diponseth123@#$"

// Default clients
const DEFAULT_CLIENTS: Client[] = [
  {
    id: "client-yash",
    firstName: "Yash",
    middleName: "",
    lastName: "Garg",
    name: "Yash Garg",
    email: "yashgarg@nazito.in",
    password: "yash@123",
    originalEmail: "",
    phone: "",
    createdAt: new Date().toISOString(),
  },
  {
    id: "client-sahil",
    firstName: "Sahil",
    middleName: "",
    lastName: "Gohri",
    name: "Sahil Gohri",
    email: "sahilgohri@nazito.in",
    password: "sahil@123",
    originalEmail: "",
    phone: "",
    createdAt: new Date().toISOString(),
  },
  {
    id: "client-fahima",
    firstName: "Fahima",
    middleName: "",
    lastName: "Ahmed",
    name: "Fahima Ahmed",
    email: "fahimaahmed@nazito.in",
    password: "fahima@123",
    originalEmail: "",
    phone: "",
    createdAt: new Date().toISOString(),
  },
]

// Helper functions
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount)
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay()
}

function getMonthName(month: number): string {
  return new Date(2000, month, 1).toLocaleString("default", { month: "long" })
}

const WORK_TYPES = ["Long Form", "Short Form", "Reel", "Thumbnail", "Website", "Custom"] as const
const STATUS_OPTIONS = ["Done", "In Progress", "Not Done", "Cancelled"] as const

// Semi-circle progress component
function SemiCircleProgress({ percentage, size = 200, strokeWidth = 24 }: { percentage: number; size?: number; strokeWidth?: number }) {
  const radius = (size - strokeWidth) / 2
  const circumference = Math.PI * radius
  const progress = Math.min(percentage, 100)
  const offset = circumference - (progress / 100) * circumference

  return (
    <div className="relative" style={{ width: size, height: size / 2 + 20 }}>
      <svg width={size} height={size / 2 + 20} className="overflow-visible">
        {/* Background arc */}
        <path
          d={`M ${strokeWidth / 2} ${size / 2} A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${size / 2}`}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-violet-100"
        />
        {/* Progress arc */}
        <path
          d={`M ${strokeWidth / 2} ${size / 2} A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${size / 2}`}
          fill="none"
          stroke="url(#gradient)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-1000 ease-out"
        />
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#a78bfa" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-end pb-2">
        <span className="text-3xl md:text-4xl font-bold text-violet-600">{progress.toFixed(1)}%</span>
        <span className="text-xs text-muted-foreground">of target</span>
      </div>
    </div>
  )
}

export default function WorkTracker() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [monthlyTarget, setMonthlyTarget] = useState<number>(100000)
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split("T")[0])
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date())
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [animatedEarnings, setAnimatedEarnings] = useState(0)
  const [isLoaded, setIsLoaded] = useState(false)
  const [activeView, setActiveView] = useState<ViewType>("home")
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)

  // Refs for click outside detection
  const profileMenuRef = useRef<HTMLDivElement>(null)
  const mobileMenuRef = useRef<HTMLDivElement>(null)

  // History filter state
  const [filterMonth, setFilterMonth] = useState<number>(new Date().getMonth())
  const [filterYear, setFilterYear] = useState<number>(new Date().getFullYear())

  // Payment dialog state
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false)
  const [paymentSearch, setPaymentSearch] = useState("")
  const [paymentDateFilter, setPaymentDateFilter] = useState("")

  // Client dialog state
  const [isClientDialogOpen, setIsClientDialogOpen] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [clientSearch, setClientSearch] = useState("")

  // Invoice viewer
  const [viewingInvoice, setViewingInvoice] = useState<string | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    clientId: "",
    clientName: "",
    projectName: "",
    projectLink: "",
    comments: "",
    workType: "Long Form" as Task["workType"],
    amount: "",
    status: "Not Done" as Task["status"],
    dateReceived: new Date().toISOString().split("T")[0],
    dateDelivered: "",
  })

  // Payment form state
  const [paymentFormData, setPaymentFormData] = useState({
    clientId: "",
    clientName: "",
    amount: "",
    date: new Date().toISOString().split("T")[0],
    invoiceUrl: "",
  })

  // Client form state
  const [clientFormData, setClientFormData] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    email: "",
    password: "",
    originalEmail: "",
    phone: "",
    avatar: "",
  })

  const fileInputRef = useRef<HTMLInputElement>(null)
  const avatarInputRef = useRef<HTMLInputElement>(null)

  // Click outside handler for menus
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setProfileMenuOpen(false)
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        setMobileMenuOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("nazitoWorkTrackerData")
    if (saved) {
      const data: AppState = JSON.parse(saved)
      setTasks(data.tasks || [])
      setPayments(data.payments || [])
      // Merge default clients with saved clients
      const savedClients = data.clients || []
      const mergedClients = [...DEFAULT_CLIENTS]
      savedClients.forEach((sc: Client) => {
        if (!mergedClients.find((dc) => dc.id === sc.id)) {
          mergedClients.push(sc)
        } else {
          // Update existing client with saved data
          const index = mergedClients.findIndex((dc) => dc.id === sc.id)
          if (index !== -1) {
            mergedClients[index] = { ...mergedClients[index], ...sc }
          }
        }
      })
      setClients(mergedClients)
      setMonthlyTarget(data.monthlyTarget || 100000)
      setSelectedDate(data.selectedDate || new Date().toISOString().split("T")[0])
    } else {
      // Set default clients if no saved data
      setClients(DEFAULT_CLIENTS)
    }
    setIsLoaded(true)
  }, [])

  // Save to localStorage
  useEffect(() => {
    if (isLoaded) {
      const data: AppState = { tasks, payments, clients, monthlyTarget, selectedDate }
      localStorage.setItem("nazitoWorkTrackerData", JSON.stringify(data))
    }
  }, [tasks, payments, clients, monthlyTarget, selectedDate, isLoaded])

  // Calculate earnings
  const now = new Date()
  const currentMonthNum = now.getMonth()
  const currentYear = now.getFullYear()
  const previousMonthNum = currentMonthNum === 0 ? 11 : currentMonthNum - 1
  const previousMonthYear = currentMonthNum === 0 ? currentYear - 1 : currentYear

  // Total lifetime earnings
  const totalEarnings = tasks
    .filter((task) => task.status === "Done")
    .reduce((sum, task) => sum + task.amount, 0)

  // Current month earnings
  const currentMonthEarnings = tasks
    .filter((task) => {
      const taskDate = new Date(task.dateReceived)
      return (
        task.status === "Done" &&
        taskDate.getMonth() === currentMonthNum &&
        taskDate.getFullYear() === currentYear
      )
    })
    .reduce((sum, task) => sum + task.amount, 0)

  // Previous month earnings
  const previousMonthEarnings = tasks
    .filter((task) => {
      const taskDate = new Date(task.dateReceived)
      return (
        task.status === "Done" &&
        taskDate.getMonth() === previousMonthNum &&
        taskDate.getFullYear() === previousMonthYear
      )
    })
    .reduce((sum, task) => sum + task.amount, 0)

  // Service-wise earnings (lifetime)
  const serviceEarnings = WORK_TYPES.reduce((acc, type) => {
    acc[type] = tasks
      .filter((task) => task.status === "Done" && task.workType === type)
      .reduce((sum, task) => sum + task.amount, 0)
    return acc
  }, {} as Record<string, number>)

  // Service-wise task count
  const serviceTaskCount = WORK_TYPES.reduce((acc, type) => {
    acc[type] = tasks.filter((task) => task.status === "Done" && task.workType === type).length
    return acc
  }, {} as Record<string, number>)

  // Filtered earnings for history view
  const filteredEarnings = tasks
    .filter((task) => {
      const taskDate = new Date(task.dateReceived)
      return (
        task.status === "Done" &&
        taskDate.getMonth() === filterMonth &&
        taskDate.getFullYear() === filterYear
      )
    })
    .reduce((sum, task) => sum + task.amount, 0)

  // Filtered tasks for history view
  const filteredTasks = tasks.filter((task) => {
    const taskDate = new Date(task.dateReceived)
    return taskDate.getMonth() === filterMonth && taskDate.getFullYear() === filterYear
  })

  // Filtered payments
  const filteredPayments = payments.filter((payment) => {
    const matchesSearch = paymentSearch === "" || 
      payment.clientName.toLowerCase().includes(paymentSearch.toLowerCase())
    const matchesDate = paymentDateFilter === "" || payment.date === paymentDateFilter
    return matchesSearch && matchesDate
  })

  // Total due amount (pending payments)
  const totalDue = payments
    .filter((p) => p.status === "Pending")
    .reduce((sum, p) => sum + p.amount, 0)

  // Animate earnings
  useEffect(() => {
    const duration = 500
    const steps = 30
    const increment = (totalEarnings - animatedEarnings) / steps
    let current = animatedEarnings
    let step = 0

    const timer = setInterval(() => {
      step++
      current += increment
      if (step >= steps) {
        setAnimatedEarnings(totalEarnings)
        clearInterval(timer)
      } else {
        setAnimatedEarnings(Math.round(current))
      }
    }, duration / steps)

    return () => clearInterval(timer)
  }, [totalEarnings])

  // Progress percentage
  const progressPercentage = monthlyTarget > 0 ? Math.min((currentMonthEarnings / monthlyTarget) * 100, 100) : 0

  // Tasks for selected date
  const tasksForSelectedDate = tasks.filter((task) => task.dateReceived === selectedDate)

  // Get dates with completed tasks for the current month
  const datesWithCompletedTasks = tasks
    .filter((task) => {
      const taskDate = new Date(task.dateReceived)
      return (
        task.status === "Done" &&
        taskDate.getMonth() === currentMonth.getMonth() &&
        taskDate.getFullYear() === currentMonth.getFullYear()
      )
    })
    .map((task) => task.dateReceived)

  // Handle form submission
  const handleSubmit = useCallback(() => {
    if (!formData.clientName || !formData.projectName || !formData.amount) return

    const newTask: Task = {
      id: editingTask?.id || crypto.randomUUID(),
      clientId: formData.clientId || crypto.randomUUID(),
      clientName: formData.clientName,
      projectName: formData.projectName,
      projectLink: formData.projectLink,
      comments: formData.comments,
      workType: formData.workType,
      amount: Number(formData.amount),
      status: formData.status,
      dateReceived: formData.dateReceived,
      dateDelivered: formData.dateDelivered || undefined,
    }

    if (editingTask) {
      setTasks((prev) => prev.map((t) => (t.id === editingTask.id ? newTask : t)))
    } else {
      setTasks((prev) => [...prev, newTask])
    }

    resetForm()
    setIsDialogOpen(false)
  }, [formData, editingTask])

  const resetForm = () => {
    setFormData({
      clientId: "",
      clientName: "",
      projectName: "",
      projectLink: "",
      comments: "",
      workType: "Long Form",
      amount: "",
      status: "Not Done",
      dateReceived: new Date().toISOString().split("T")[0],
      dateDelivered: "",
    })
    setEditingTask(null)
  }

  const handleEdit = (task: Task) => {
    setEditingTask(task)
    setFormData({
      clientId: task.clientId,
      clientName: task.clientName,
      projectName: task.projectName,
      projectLink: task.projectLink || "",
      comments: task.comments || "",
      workType: task.workType,
      amount: task.amount.toString(),
      status: task.status,
      dateReceived: task.dateReceived,
      dateDelivered: task.dateDelivered || "",
    })
    setIsDialogOpen(true)
  }

  const handleDelete = (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id))
  }

  // Payment handlers
  const handlePaymentSubmit = () => {
    if (!paymentFormData.clientName || !paymentFormData.amount) return

    const client = clients.find((c) => c.name === paymentFormData.clientName)

    const newPayment: Payment = {
      id: crypto.randomUUID(),
      clientId: client?.id || crypto.randomUUID(),
      clientName: paymentFormData.clientName,
      amount: Number(paymentFormData.amount),
      date: paymentFormData.date,
      invoiceUrl: paymentFormData.invoiceUrl || undefined,
      status: "Pending",
    }

    setPayments((prev) => [...prev, newPayment])

    // Send WhatsApp message for invoice (simulated)
    if (client?.phone && paymentFormData.invoiceUrl) {
      const message = `New invoice added for ${client.name}. Amount: ${formatCurrency(Number(paymentFormData.amount))}. Date: ${paymentFormData.date}`
      window.open(`https://wa.me/91${client.phone}?text=${encodeURIComponent(message)}`, "_blank")
    }

    setPaymentFormData({
      clientId: "",
      clientName: "",
      amount: "",
      date: new Date().toISOString().split("T")[0],
      invoiceUrl: "",
    })
    setIsPaymentDialogOpen(false)
  }

  const handleInvoiceUpload = (paymentId: string, file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const url = e.target?.result as string
      setPayments((prev) =>
        prev.map((p) => (p.id === paymentId ? { ...p, invoiceUrl: url } : p))
      )
    }
    reader.readAsDataURL(file)
  }

  const clearDue = (paymentId: string) => {
    const payment = payments.find((p) => p.id === paymentId)
    const client = clients.find((c) => c.id === payment?.clientId)

    setPayments((prev) =>
      prev.map((p) => (p.id === paymentId ? { ...p, status: "Verified" as const } : p))
    )

    // Send thank you message (simulated)
    if (client?.phone && payment) {
      const message = `Thank you for your payment! Due Cleared: ${formatCurrency(payment.amount)}. Date: ${new Date().toISOString().split("T")[0]}. Thank you for choosing NAZITO WORK TRACKER!`
      window.open(`https://wa.me/91${client.phone}?text=${encodeURIComponent(message)}`, "_blank")
    }
  }

  // Client handlers
  const handleClientSubmit = () => {
    if (!clientFormData.firstName || !clientFormData.lastName || !clientFormData.email || !clientFormData.password) return

    const fullName = [clientFormData.firstName, clientFormData.middleName, clientFormData.lastName].filter(Boolean).join(" ")

    if (editingClient) {
      setClients((prev) =>
        prev.map((c) =>
          c.id === editingClient.id
            ? {
                ...c,
                firstName: clientFormData.firstName,
                middleName: clientFormData.middleName,
                lastName: clientFormData.lastName,
                name: fullName,
                email: clientFormData.email,
                password: clientFormData.password,
                originalEmail: clientFormData.originalEmail,
                phone: clientFormData.phone,
                avatar: clientFormData.avatar,
              }
            : c
        )
      )
    } else {
      const newClient: Client = {
        id: crypto.randomUUID(),
        firstName: clientFormData.firstName,
        middleName: clientFormData.middleName,
        lastName: clientFormData.lastName,
        name: fullName,
        email: clientFormData.email,
        password: clientFormData.password,
        originalEmail: clientFormData.originalEmail,
        phone: clientFormData.phone,
        avatar: clientFormData.avatar,
        createdAt: new Date().toISOString(),
      }
      setClients((prev) => [...prev, newClient])
    }

    resetClientForm()
    setIsClientDialogOpen(false)
  }

  const resetClientForm = () => {
    setClientFormData({
      firstName: "",
      middleName: "",
      lastName: "",
      email: "",
      password: "",
      originalEmail: "",
      phone: "",
      avatar: "",
    })
    setEditingClient(null)
  }

  const handleClientEdit = (client: Client) => {
    setEditingClient(client)
    setClientFormData({
      firstName: client.firstName || client.name.split(" ")[0] || "",
      middleName: client.middleName || "",
      lastName: client.lastName || client.name.split(" ").slice(-1)[0] || "",
      email: client.email,
      password: client.password,
      originalEmail: client.originalEmail || "",
      phone: client.phone || "",
      avatar: client.avatar || "",
    })
    setIsClientDialogOpen(true)
  }

  const handleClientDelete = (id: string) => {
    setClients((prev) => prev.filter((c) => c.id !== id))
  }

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setClientFormData((prev) => ({ ...prev, avatar: e.target?.result as string }))
      }
      reader.readAsDataURL(file)
    }
  }

  const getStatusIcon = (status: Task["status"]) => {
    switch (status) {
      case "Done":
        return <Check className="h-4 w-4 text-emerald-500" />
      case "In Progress":
        return <Clock className="h-4 w-4 text-amber-500" />
      case "Cancelled":
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <AlertCircle className="h-4 w-4 text-muted-foreground" />
    }
  }

  const getStatusColor = (status: Task["status"]) => {
    switch (status) {
      case "Done":
        return "bg-emerald-50 text-emerald-700 border-emerald-200"
      case "In Progress":
        return "bg-amber-50 text-amber-700 border-amber-200"
      case "Cancelled":
        return "bg-red-50 text-red-700 border-red-200"
      default:
        return "bg-secondary text-muted-foreground border-border"
    }
  }

  // Calendar navigation
  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))
  }

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))
  }

  // Available years for filter
  const availableYears = Array.from(
    new Set([...tasks.map((t) => new Date(t.dateReceived).getFullYear()), currentYear])
  ).sort((a, b) => b - a)

  // Render calendar
  const renderCalendar = () => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    const daysInMonth = getDaysInMonth(year, month)
    const firstDay = getFirstDayOfMonth(year, month)
    const today = new Date().toISOString().split("T")[0]

    const days = []
    const weekDays = ["S", "M", "T", "W", "T", "F", "S"]

    for (const day of weekDays) {
      days.push(
        <div key={`header-${day}-${days.length}`} className="text-center text-xs font-medium text-muted-foreground py-1">
          {day}
        </div>
      )
    }

    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-8 md:h-9" />)
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
      const isSelected = dateStr === selectedDate
      const isToday = dateStr === today
      const hasCompletedTasks = datesWithCompletedTasks.includes(dateStr)

      days.push(
        <button
          key={day}
          onClick={() => setSelectedDate(dateStr)}
          className={cn(
            "h-8 w-8 md:h-9 md:w-9 mx-auto rounded-full flex items-center justify-center text-xs md:text-sm transition-all relative hover:scale-110",
            isSelected && "bg-violet-600 text-white font-medium shadow-lg",
            !isSelected && isToday && "border-2 border-violet-400 font-medium",
            !isSelected && !isToday && "hover:bg-violet-100",
            hasCompletedTasks && !isSelected && "font-medium"
          )}
        >
          {day}
          {hasCompletedTasks && !isSelected && (
            <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-violet-500 rounded-full" />
          )}
        </button>
      )
    }

    return days
  }

  const navItems = [
    { id: "home" as ViewType, label: "Home", icon: Home },
    { id: "tasks" as ViewType, label: "All Tasks", icon: ListTodo },
    { id: "add" as ViewType, label: "Add Task", icon: Plus },
    { id: "history" as ViewType, label: "Earning History", icon: History },
    { id: "payments" as ViewType, label: "Payment History", icon: CreditCard },
    { id: "services" as ViewType, label: "Services", icon: BarChart3 },
    { id: "clients" as ViewType, label: "Client Dashboard", icon: Users },
  ]

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-violet-50/50 to-background flex flex-col">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-violet-600 text-white shadow-lg">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-14 md:h-16">
            {/* Logo */}
            <div className="flex items-center gap-2 md:gap-3">
              <div className="relative h-8 w-8 md:h-10 md:w-10">
                <Image src="/nazito-logo.png" alt="NAZITO Logo" fill className="object-contain" />
              </div>
              <span className="font-bold text-lg md:text-xl tracking-tight">NAZITO</span>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-1">
              {navItems.map((item) => (
                <Button
                  key={item.id}
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "text-white/80 hover:text-white hover:bg-white/10 transition-all",
                    activeView === item.id && "bg-white/20 text-white"
                  )}
                  onClick={() => {
                    setActiveView(item.id)
                    if (item.id === "add") {
                      resetForm()
                      setIsDialogOpen(true)
                    }
                  }}
                >
                  <item.icon className="h-4 w-4 mr-1.5" />
                  {item.label}
                </Button>
              ))}
            </div>

            {/* Profile & Mobile Menu */}
            <div className="flex items-center gap-2">
              {/* Profile Dropdown */}
              <div className="relative" ref={profileMenuRef}>
                <button
                  onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                  className="relative h-8 w-8 rounded-full overflow-hidden border-2 border-white/30 hover:border-white transition-all hover:scale-105"
                >
                  <Image src="/admin-dp.png" alt="Admin" fill className="object-cover" />
                </button>
                {profileMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-lg shadow-lg py-2 text-foreground">
                    <div className="px-4 py-2 border-b">
                      <p className="font-medium text-sm">Dipon Seth</p>
                      <p className="text-xs text-muted-foreground">Admin</p>
                    </div>
                    <button
                      className="w-full text-left px-4 py-2 text-sm hover:bg-secondary transition-colors flex items-center gap-2"
                      onClick={() => {
                        setActiveView("profile")
                        setProfileMenuOpen(false)
                      }}
                    >
                      <FileText className="h-4 w-4" />
                      View Feedback
                    </button>
                    <button
                      className="w-full text-left px-4 py-2 text-sm hover:bg-secondary transition-colors flex items-center gap-2"
                      onClick={() => {
                        setActiveView("createClient")
                        setProfileMenuOpen(false)
                      }}
                    >
                      <UserPlus className="h-4 w-4" />
                      Create/Edit Client
                    </button>
                    <button
                      className="w-full text-left px-4 py-2 text-sm hover:bg-secondary transition-colors flex items-center gap-2"
                      onClick={() => {
                        setProfileMenuOpen(false)
                      }}
                    >
                      <X className="h-4 w-4" />
                      Close
                    </button>
                  </div>
                )}
              </div>

              {/* Mobile Menu Button */}
              <div ref={mobileMenuRef}>
                <Button
                  variant="ghost"
                  size="icon"
                  className="lg:hidden text-white hover:bg-white/10"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                >
                  {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </Button>
              </div>
            </div>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <div className="lg:hidden pb-4 space-y-1 border-t border-white/20 pt-2">
              {navItems.map((item) => (
                <Button
                  key={item.id}
                  variant="ghost"
                  className={cn(
                    "w-full justify-start text-white/80 hover:text-white hover:bg-white/10",
                    activeView === item.id && "bg-white/20 text-white"
                  )}
                  onClick={() => {
                    setActiveView(item.id)
                    setMobileMenuOpen(false)
                    if (item.id === "add") {
                      resetForm()
                      setIsDialogOpen(true)
                    }
                  }}
                >
                  <item.icon className="h-4 w-4 mr-2" />
                  {item.label}
                </Button>
              ))}
              <Button
                variant="ghost"
                className="w-full justify-start text-white/80 hover:text-white hover:bg-white/10"
                onClick={() => {
                  setActiveView("createClient")
                  setMobileMenuOpen(false)
                }}
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Create/Edit Client
              </Button>
            </div>
          )}
        </div>
      </nav>

      <main className="container mx-auto px-4 py-4 md:py-6 flex-1">
        {/* Home View */}
        {activeView === "home" && (
          <div className="space-y-4 md:space-y-6">
            {/* Main Grid: Earnings Left, Calendar Right */}
            <div className="grid gap-4 md:gap-6 lg:grid-cols-5">
              {/* Left Side - Earnings Section */}
              <div className="lg:col-span-3 space-y-4">
                {/* Semi-Circle Progress Bar */}
                <Card className="border-violet-100 bg-white/80 backdrop-blur">
                  <CardHeader className="pb-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <CardTitle className="text-base font-medium flex items-center gap-2">
                        <Target className="h-4 w-4 text-violet-500" />
                        Monthly Target Progress
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">Target:</span>
                        <div className="flex items-center gap-1">
                          <IndianRupee className="h-3 w-3 text-muted-foreground" />
                          <Input
                            type="text"
                            inputMode="numeric"
                            value={monthlyTarget}
                            onChange={(e) => setMonthlyTarget(Number(e.target.value.replace(/\D/g, "")) || 0)}
                            className="w-20 md:w-24 h-7 text-xs hover:border-violet-300 focus:border-violet-500 transition-colors [appearance:textfield]"
                          />
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="flex flex-col items-center">
                    <SemiCircleProgress percentage={progressPercentage} size={220} strokeWidth={28} />
                    <div className="flex justify-between w-full mt-2 text-sm">
                      <span className="text-muted-foreground">
                        {formatCurrency(currentMonthEarnings)} earned
                      </span>
                      <span className="font-medium text-violet-600">
                        {formatCurrency(monthlyTarget)} target
                      </span>
                    </div>
                  </CardContent>
                </Card>

                {/* Total Earnings */}
                <Card className="border-violet-100 bg-gradient-to-br from-violet-600 to-violet-700 text-white overflow-hidden relative">
                  <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djZoNnYtNmgtNnptMC0zMHY2aDZ2LTZoLTZ6TTAgMzR2Nmg2di02SDB6TTAgNHY2aDZWNEgweiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
                  <CardContent className="py-4 md:py-6 relative">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-violet-200 text-sm">Total Lifetime Earnings</p>
                        <p className="text-2xl md:text-3xl font-bold tabular-nums mt-1">
                          {formatCurrency(animatedEarnings)}
                        </p>
                      </div>
                      <div className="h-12 w-12 md:h-14 md:w-14 rounded-full bg-white/20 flex items-center justify-center">
                        <IndianRupee className="h-6 w-6 md:h-7 md:w-7" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Current & Previous Month Grid */}
                <div className="grid gap-4 sm:grid-cols-2">
                  {/* Current Month */}
                  <Card className="border-violet-100 bg-white/80 backdrop-blur hover:shadow-md transition-shadow">
                    <CardContent className="py-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-muted-foreground text-xs">
                            {getMonthName(currentMonthNum)} {currentYear}
                          </p>
                          <p className="text-xl md:text-2xl font-bold text-foreground mt-1">
                            {formatCurrency(currentMonthEarnings)}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">Current Month</p>
                        </div>
                        <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center hover:scale-110 transition-transform">
                          <TrendingUp className="h-5 w-5 text-emerald-600" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Previous Month */}
                  <Card className="border-violet-100 bg-white/80 backdrop-blur hover:shadow-md transition-shadow">
                    <CardContent className="py-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-muted-foreground text-xs">
                            {getMonthName(previousMonthNum)} {previousMonthYear}
                          </p>
                          <p className="text-xl md:text-2xl font-bold text-foreground mt-1">
                            {formatCurrency(previousMonthEarnings)}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">Previous Month</p>
                        </div>
                        <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center hover:scale-110 transition-transform">
                          <TrendingDown className="h-5 w-5 text-slate-500" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Month/Year Filter */}
                <Card className="border-violet-100 bg-white/80 backdrop-blur">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base font-medium flex items-center gap-2">
                      <Filter className="h-4 w-4 text-violet-500" />
                      Filter by Month/Year
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <div className="flex-1">
                        <Label className="text-xs text-muted-foreground">Month</Label>
                        <Select value={filterMonth.toString()} onValueChange={(v) => setFilterMonth(Number(v))}>
                          <SelectTrigger className="mt-1 hover:border-violet-300 transition-colors">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from({ length: 12 }, (_, i) => (
                              <SelectItem key={i} value={i.toString()}>
                                {getMonthName(i)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex-1">
                        <Label className="text-xs text-muted-foreground">Year</Label>
                        <Select value={filterYear.toString()} onValueChange={(v) => setFilterYear(Number(v))}>
                          <SelectTrigger className="mt-1 hover:border-violet-300 transition-colors">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {availableYears.map((year) => (
                              <SelectItem key={year} value={year.toString()}>
                                {year}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="mt-4 p-4 rounded-lg bg-violet-50 border border-violet-100">
                      <p className="text-xs text-muted-foreground">
                        {getMonthName(filterMonth)} {filterYear} Earnings
                      </p>
                      <p className="text-2xl font-bold text-violet-600 mt-1">{formatCurrency(filteredEarnings)}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {filteredTasks.filter((t) => t.status === "Done").length} completed tasks
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Right Side - Calendar */}
              <div className="lg:col-span-2 space-y-4">
                <Card className="border-violet-100 bg-white/80 backdrop-blur">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base font-medium flex items-center gap-2">
                        <CalendarIcon className="h-4 w-4 text-violet-500" />
                        Calendar
                      </CardTitle>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 hover:bg-violet-100 transition-colors hover:scale-110"
                          onClick={prevMonth}
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <span className="text-xs md:text-sm font-medium min-w-[100px] md:min-w-[120px] text-center">
                          {currentMonth.toLocaleString("default", { month: "short", year: "numeric" })}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 hover:bg-violet-100 transition-colors hover:scale-110"
                          onClick={nextMonth}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-7 gap-1">{renderCalendar()}</div>
                  </CardContent>
                </Card>

                {/* Tasks for Selected Date */}
                <Card className="border-violet-100 bg-white/80 backdrop-blur">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm md:text-base font-medium">
                        Tasks for{" "}
                        {new Date(selectedDate).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                        })}
                      </CardTitle>
                      <Button
                        size="sm"
                        className="bg-violet-600 hover:bg-violet-700 text-white h-8 transition-all hover:scale-105"
                        onClick={() => {
                          resetForm()
                          setFormData((prev) => ({ ...prev, dateReceived: selectedDate }))
                          setIsDialogOpen(true)
                        }}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {tasksForSelectedDate.length === 0 ? (
                      <div className="text-center py-6 text-muted-foreground">
                        <CalendarIcon className="h-10 w-10 mx-auto mb-2 opacity-20" />
                        <p className="text-sm">No tasks</p>
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-[300px] overflow-y-auto">
                        {tasksForSelectedDate.map((task) => (
                          <div
                            key={task.id}
                            className="p-3 rounded-lg border bg-white hover:shadow-md transition-all hover:border-violet-200"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <h3 className="font-medium text-sm text-foreground truncate">{task.projectName}</h3>
                                  <span
                                    className={cn(
                                      "inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs border",
                                      getStatusColor(task.status)
                                    )}
                                  >
                                    {getStatusIcon(task.status)}
                                  </span>
                                </div>
                                <p className="text-xs text-muted-foreground">{task.clientName}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-xs px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">
                                    {task.workType}
                                  </span>
                                  <span className="text-sm font-semibold text-violet-600">
                                    {formatCurrency(task.amount)}
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center gap-0.5">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-violet-50 transition-colors"
                                  onClick={() => handleEdit(task)}
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-red-50 transition-colors"
                                  onClick={() => handleDelete(task.id)}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        )}

        {/* All Tasks View */}
        {activeView === "tasks" && (
          <Card className="border-violet-100 bg-white/80 backdrop-blur">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-medium">All Tasks</CardTitle>
                <Button
                  size="sm"
                  className="bg-violet-600 hover:bg-violet-700 text-white transition-all hover:scale-105"
                  onClick={() => {
                    resetForm()
                    setIsDialogOpen(true)
                  }}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Task
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {tasks.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <ListTodo className="h-12 w-12 mx-auto mb-3 opacity-20" />
                  <p>No tasks yet. Add your first task!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {tasks.map((task) => (
                    <div
                      key={task.id}
                      className="p-4 rounded-lg border bg-white hover:shadow-md transition-all hover:border-violet-200"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-medium text-foreground truncate">{task.projectName}</h3>
                            <span
                              className={cn(
                                "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border",
                                getStatusColor(task.status)
                              )}
                            >
                              {getStatusIcon(task.status)}
                              {task.status}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground">{task.clientName}</p>
                          <div className="flex flex-wrap items-center gap-2 mt-2">
                            <span className="text-xs px-2 py-0.5 rounded bg-secondary text-muted-foreground">
                              {task.workType}
                            </span>
                            <span className="text-sm font-semibold text-violet-600">
                              {formatCurrency(task.amount)}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {new Date(task.dateReceived).toLocaleDateString("en-IN", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-violet-50 transition-colors"
                            onClick={() => handleEdit(task)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-red-50 transition-colors"
                            onClick={() => handleDelete(task.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Earning History View */}
        {activeView === "history" && (
          <div className="space-y-4">
            <Card className="border-violet-100 bg-white/80 backdrop-blur">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-medium flex items-center gap-2">
                  <History className="h-5 w-5 text-violet-500" />
                  Earning History
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row gap-3 mb-4">
                  <div className="flex-1">
                    <Label className="text-xs text-muted-foreground">Month</Label>
                    <Select value={filterMonth.toString()} onValueChange={(v) => setFilterMonth(Number(v))}>
                      <SelectTrigger className="mt-1 hover:border-violet-300 transition-colors">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 12 }, (_, i) => (
                          <SelectItem key={i} value={i.toString()}>
                            {getMonthName(i)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex-1">
                    <Label className="text-xs text-muted-foreground">Year</Label>
                    <Select value={filterYear.toString()} onValueChange={(v) => setFilterYear(Number(v))}>
                      <SelectTrigger className="mt-1 hover:border-violet-300 transition-colors">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {availableYears.map((year) => (
                          <SelectItem key={year} value={year.toString()}>
                            {year}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-violet-50 border border-violet-100 mb-4">
                  <p className="text-xs text-muted-foreground">
                    {getMonthName(filterMonth)} {filterYear} Earnings
                  </p>
                  <p className="text-3xl font-bold text-violet-600 mt-1">{formatCurrency(filteredEarnings)}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {filteredTasks.filter((t) => t.status === "Done").length} completed tasks
                  </p>
                </div>

                {filteredTasks.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <History className="h-10 w-10 mx-auto mb-2 opacity-20" />
                    <p>No tasks for this period</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredTasks.map((task) => (
                      <div
                        key={task.id}
                        className="p-3 rounded-lg border bg-white hover:shadow-sm transition-all flex items-center justify-between"
                      >
                        <div>
                          <p className="font-medium text-sm">{task.projectName}</p>
                          <p className="text-xs text-muted-foreground">{task.clientName}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-violet-600">{formatCurrency(task.amount)}</p>
                          <span
                            className={cn(
                              "inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs",
                              getStatusColor(task.status)
                            )}
                          >
                            {getStatusIcon(task.status)}
                            {task.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Payment History View */}
        {activeView === "payments" && (
          <div className="space-y-4">
            <Card className="border-violet-100 bg-white/80 backdrop-blur">
              <CardHeader className="pb-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <CardTitle className="text-lg font-medium flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-violet-500" />
                    Payment History
                  </CardTitle>
                  <Button
                    size="sm"
                    className="bg-violet-600 hover:bg-violet-700 text-white transition-all hover:scale-105"
                    onClick={() => setIsPaymentDialogOpen(true)}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Payment
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row gap-3 mb-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by client name..."
                      value={paymentSearch}
                      onChange={(e) => setPaymentSearch(e.target.value)}
                      className="pl-9 hover:border-violet-300 focus:border-violet-500 transition-colors"
                    />
                  </div>
                  <div className="flex-1">
                    <Input
                      type="date"
                      value={paymentDateFilter}
                      onChange={(e) => setPaymentDateFilter(e.target.value)}
                      className="hover:border-violet-300 focus:border-violet-500 transition-colors"
                    />
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-red-50 border border-red-100 mb-4">
                  <p className="text-xs text-red-600">Total Due Amount</p>
                  <p className="text-2xl font-bold text-red-600 mt-1">{formatCurrency(totalDue)}</p>
                </div>

                {filteredPayments.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <CreditCard className="h-10 w-10 mx-auto mb-2 opacity-20" />
                    <p>No payments found</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredPayments.map((payment) => (
                      <div
                        key={payment.id}
                        className="p-4 rounded-lg border bg-white hover:shadow-md transition-all"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <p className="font-medium">{payment.clientName}</p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(payment.date).toLocaleDateString("en-IN", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })}
                            </p>
                            <p className="text-lg font-bold text-violet-600 mt-1">{formatCurrency(payment.amount)}</p>
                            <span
                              className={cn(
                                "inline-block px-2 py-0.5 rounded-full text-xs mt-1",
                                payment.status === "Verified"
                                  ? "bg-emerald-100 text-emerald-700"
                                  : payment.status === "Pending"
                                  ? "bg-amber-100 text-amber-700"
                                  : "bg-secondary text-muted-foreground"
                              )}
                            >
                              {payment.status}
                            </span>
                          </div>
                          <div className="flex flex-col gap-2">
                            {/* Upload Invoice */}
                            <div>
                              <input
                                type="file"
                                id={`invoice-${payment.id}`}
                                accept="image/*,.pdf"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0]
                                  if (file) handleInvoiceUpload(payment.id, file)
                                }}
                              />
                              <Button
                                variant="outline"
                                size="sm"
                                className="hover:bg-violet-50 hover:border-violet-300 transition-colors bg-transparent"
                                onClick={() => document.getElementById(`invoice-${payment.id}`)?.click()}
                              >
                                <Upload className="h-3 w-3 mr-1" />
                                Upload
                              </Button>
                            </div>
                            {/* View Invoice */}
                            {payment.invoiceUrl && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="hover:bg-violet-50 hover:border-violet-300 transition-colors bg-transparent"
                                onClick={() => setViewingInvoice(payment.invoiceUrl!)}
                              >
                                <Eye className="h-3 w-3 mr-1" />
                                View
                              </Button>
                            )}
                            {/* Download Invoice */}
                            {payment.invoiceUrl && (
                              <a href={payment.invoiceUrl} download={`invoice-${payment.clientName}.png`}>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="w-full hover:bg-violet-50 hover:border-violet-300 transition-colors bg-transparent"
                                >
                                  <Download className="h-3 w-3 mr-1" />
                                  Download
                                </Button>
                              </a>
                            )}
                            {/* Clear Due */}
                            {payment.status === "Pending" && (
                              <Button
                                size="sm"
                                className="bg-emerald-600 hover:bg-emerald-700 text-white transition-all hover:scale-105"
                                onClick={() => clearDue(payment.id)}
                              >
                                <Check className="h-3 w-3 mr-1" />
                                Clear Due
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Services View */}
        {activeView === "services" && (
          <div className="space-y-4">
            <Card className="border-violet-100 bg-white/80 backdrop-blur">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-medium flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-violet-500" />
                  Service-wise Earnings (Lifetime)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="p-4 rounded-lg bg-violet-50 border border-violet-100 mb-4">
                  <p className="text-xs text-muted-foreground">Total Lifetime Earnings</p>
                  <p className="text-3xl font-bold text-violet-600 mt-1">{formatCurrency(totalEarnings)}</p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {WORK_TYPES.map((type) => (
                    <Card key={type} className="border hover:shadow-md transition-all hover:border-violet-200">
                      <CardContent className="py-4">
                        <h3 className="font-medium text-sm text-muted-foreground">{type}</h3>
                        <p className="text-2xl font-bold text-violet-600 mt-1">
                          {formatCurrency(serviceEarnings[type])}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {serviceTaskCount[type]} tasks completed
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Client Dashboard View */}
        {activeView === "clients" && (
          <div className="space-y-4">
            <Card className="border-violet-100 bg-white/80 backdrop-blur">
              <CardHeader className="pb-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <CardTitle className="text-lg font-medium flex items-center gap-2">
                    <Users className="h-5 w-5 text-violet-500" />
                    Client Dashboard
                  </CardTitle>
                  <Button
                    size="sm"
                    className="bg-violet-600 hover:bg-violet-700 text-white transition-all hover:scale-105"
                    onClick={() => {
                      resetClientForm()
                      setIsClientDialogOpen(true)
                    }}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Client
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search client by name..."
                      value={clientSearch}
                      onChange={(e) => setClientSearch(e.target.value)}
                      className="pl-9 hover:border-violet-300 focus:border-violet-500 transition-colors"
                    />
                  </div>
                </div>

                {clients.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="h-10 w-10 mx-auto mb-2 opacity-20" />
                    <p>No clients yet</p>
                  </div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {clients
                      .filter((c) =>
                        clientSearch === "" || c.name.toLowerCase().includes(clientSearch.toLowerCase())
                      )
                      .map((client) => (
                        <Card key={client.id} className="border hover:shadow-md transition-all hover:border-violet-200">
                          <CardContent className="py-4">
                            <div className="flex items-center gap-3 mb-3">
                              <div className="relative h-12 w-12 rounded-full overflow-hidden bg-violet-100 flex items-center justify-center">
                                {client.avatar ? (
                                  <Image src={client.avatar || "/placeholder.svg"} alt={client.name} fill className="object-cover" />
                                ) : (
                                  <span className="text-violet-600 font-bold text-lg">
                                    {client.name.charAt(0).toUpperCase()}
                                  </span>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="font-medium truncate">{client.name}</h3>
                                <p className="text-xs text-muted-foreground truncate">{client.email}</p>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Link href={`/client/${client.id}`} className="flex-1">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="w-full hover:bg-violet-50 hover:border-violet-300 transition-colors bg-transparent"
                                >
                                  <Eye className="h-3 w-3 mr-1" />
                                  View
                                </Button>
                              </Link>
                              <Button
                                variant="outline"
                                size="sm"
                                className="hover:bg-violet-50 hover:border-violet-300 transition-colors bg-transparent"
                                onClick={() => handleClientEdit(client)}
                              >
                                <Pencil className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="hover:bg-red-50 hover:border-red-300 hover:text-red-600 transition-colors bg-transparent"
                                onClick={() => handleClientDelete(client.id)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Create/Edit Client View */}
        {activeView === "createClient" && (
          <div className="space-y-4">
            <Card className="border-violet-100 bg-white/80 backdrop-blur">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-medium flex items-center gap-2">
                  <UserPlus className="h-5 w-5 text-violet-500" />
                  Create / Edit Client
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <Label className="text-sm">Search Client to Edit</Label>
                  <div className="relative mt-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by name..."
                      value={clientSearch}
                      onChange={(e) => setClientSearch(e.target.value)}
                      className="pl-9 hover:border-violet-300 focus:border-violet-500 transition-colors"
                    />
                  </div>
                </div>

                {clientSearch && (
                  <div className="mb-6 space-y-2">
                    {clients
                      .filter((c) => c.name.toLowerCase().includes(clientSearch.toLowerCase()))
                      .map((client) => (
                        <div
                          key={client.id}
                          className="p-3 rounded-lg border bg-white hover:shadow-sm transition-all flex items-center justify-between cursor-pointer hover:border-violet-300"
                          onClick={() => {
                            handleClientEdit(client)
                            setClientSearch("")
                          }}
                        >
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-violet-100 flex items-center justify-center overflow-hidden">
                              {client.avatar ? (
                                <Image src={client.avatar || "/placeholder.svg"} alt={client.name} fill className="object-cover" />
                              ) : (
                                <span className="text-violet-600 font-bold">
                                  {client.name.charAt(0).toUpperCase()}
                                </span>
                              )}
                            </div>
                            <div>
                              <p className="font-medium text-sm">{client.name}</p>
                              <p className="text-xs text-muted-foreground">{client.email}</p>
                            </div>
                          </div>
                          <Button variant="ghost" size="sm" className="hover:bg-violet-50">
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                  </div>
                )}

                <div className="border-t pt-6">
                  <h3 className="font-medium mb-4">
                    {editingClient ? `Edit: ${editingClient.name}` : "Create New Client"}
                  </h3>

                  {/* Avatar Upload */}
                  <div className="flex items-center gap-4 mb-6">
                    <div className="relative h-20 w-20 rounded-full overflow-hidden bg-violet-100 flex items-center justify-center">
                      {clientFormData.avatar ? (
                        <Image src={clientFormData.avatar || "/placeholder.svg"} alt="Avatar" fill className="object-cover" />
                      ) : (
                        <Camera className="h-8 w-8 text-violet-300" />
                      )}
                    </div>
                    <div className="space-y-2">
                      <input
                        type="file"
                        ref={avatarInputRef}
                        accept="image/*"
                        className="hidden"
                        onChange={handleAvatarUpload}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => avatarInputRef.current?.click()}
                        className="hover:bg-violet-50 hover:border-violet-300 transition-colors"
                      >
                        <Upload className="h-4 w-4 mr-1" />
                        Upload Photo
                      </Button>
                      {clientFormData.avatar && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setClientFormData((prev) => ({ ...prev, avatar: "" }))}
                          className="hover:bg-red-50 hover:border-red-300 hover:text-red-600 transition-colors"
                        >
                          <X className="h-4 w-4 mr-1" />
                          Remove
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-3">
                    <div>
                      <Label className="text-sm">First Name *</Label>
                      <Input
                        value={clientFormData.firstName}
                        onChange={(e) => setClientFormData((prev) => ({ ...prev, firstName: e.target.value }))}
                        className="mt-1 hover:border-violet-300 focus:border-violet-500 transition-colors"
                      />
                    </div>
                    <div>
                      <Label className="text-sm">Middle Name</Label>
                      <Input
                        value={clientFormData.middleName}
                        onChange={(e) => setClientFormData((prev) => ({ ...prev, middleName: e.target.value }))}
                        className="mt-1 hover:border-violet-300 focus:border-violet-500 transition-colors"
                      />
                    </div>
                    <div>
                      <Label className="text-sm">Last Name *</Label>
                      <Input
                        value={clientFormData.lastName}
                        onChange={(e) => setClientFormData((prev) => ({ ...prev, lastName: e.target.value }))}
                        className="mt-1 hover:border-violet-300 focus:border-violet-500 transition-colors"
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2 mt-4">
                    <div>
                      <Label className="text-sm flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        Login Email (NAZITO) *
                      </Label>
                      <Input
                        type="email"
                        value={clientFormData.email}
                        onChange={(e) => setClientFormData((prev) => ({ ...prev, email: e.target.value }))}
                        placeholder="name@nazito.in"
                        className="mt-1 hover:border-violet-300 focus:border-violet-500 transition-colors"
                      />
                    </div>
                    <div>
                      <Label className="text-sm">Password *</Label>
                      <Input
                        type="text"
                        value={clientFormData.password}
                        onChange={(e) => setClientFormData((prev) => ({ ...prev, password: e.target.value }))}
                        placeholder="name@123"
                        className="mt-1 hover:border-violet-300 focus:border-violet-500 transition-colors"
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2 mt-4">
                    <div>
                      <Label className="text-sm flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        Original Email (for invoices)
                      </Label>
                      <Input
                        type="email"
                        value={clientFormData.originalEmail}
                        onChange={(e) => setClientFormData((prev) => ({ ...prev, originalEmail: e.target.value }))}
                        placeholder="client@gmail.com"
                        className="mt-1 hover:border-violet-300 focus:border-violet-500 transition-colors"
                      />
                    </div>
                    <div>
                      <Label className="text-sm flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        Phone Number
                      </Label>
                      <Input
                        type="tel"
                        value={clientFormData.phone}
                        onChange={(e) => setClientFormData((prev) => ({ ...prev, phone: e.target.value }))}
                        placeholder="9876543210"
                        className="mt-1 hover:border-violet-300 focus:border-violet-500 transition-colors"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 mt-6">
                    <Button
                      onClick={handleClientSubmit}
                      className="bg-violet-600 hover:bg-violet-700 text-white transition-all hover:scale-105"
                    >
                      <Check className="h-4 w-4 mr-1" />
                      {editingClient ? "Save Changes" : "Create Client"}
                    </Button>
                    {editingClient && (
                      <Button
                        variant="outline"
                        onClick={resetClientForm}
                        className="hover:bg-secondary transition-colors bg-transparent"
                      >
                        Cancel
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Profile/Feedback View */}
        {activeView === "profile" && (
          <div className="space-y-4">
            <Card className="border-violet-100 bg-white/80 backdrop-blur">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-medium flex items-center gap-2">
                  <FileText className="h-5 w-5 text-violet-500" />
                  Client Feedback
                </CardTitle>
              </CardHeader>
              <CardContent>
                {tasks.filter((t) => t.feedback).length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-10 w-10 mx-auto mb-2 opacity-20" />
                    <p>No feedback received yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {tasks
                      .filter((t) => t.feedback)
                      .map((task) => (
                        <Card key={task.id} className="border hover:shadow-sm transition-all">
                          <CardContent className="py-4">
                            <div className="flex items-start justify-between">
                              <div>
                                <p className="font-medium">{task.clientName}</p>
                                <p className="text-sm text-muted-foreground">{task.projectName}</p>
                              </div>
                              {task.rating && (
                                <div className="flex gap-0.5">
                                  {Array.from({ length: 5 }, (_, i) => (
                                    <span
                                      key={i}
                                      className={i < task.rating! ? "text-amber-400" : "text-gray-200"}
                                    >
                                      ★
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                            <p className="mt-3 text-sm bg-violet-50 p-3 rounded-lg">{task.feedback}</p>
                          </CardContent>
                        </Card>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t bg-white/50 py-4 mt-auto">
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

      {/* Task Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingTask ? "Edit Task" : "Add New Task"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label className="text-sm">Client Name *</Label>
              <Select
                value={formData.clientName}
                onValueChange={(v) => {
                  const client = clients.find((c) => c.name === v)
                  setFormData((prev) => ({
                    ...prev,
                    clientName: v,
                    clientId: client?.id || "",
                  }))
                }}
              >
                <SelectTrigger className="mt-1 hover:border-violet-300 transition-colors">
                  <SelectValue placeholder="Select client" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.name}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm">Project Name *</Label>
              <Input
                value={formData.projectName}
                onChange={(e) => setFormData((prev) => ({ ...prev, projectName: e.target.value }))}
                className="mt-1 hover:border-violet-300 focus:border-violet-500 transition-colors"
              />
            </div>
            <div>
              <Label className="text-sm">Project Link</Label>
              <Input
                value={formData.projectLink}
                onChange={(e) => setFormData((prev) => ({ ...prev, projectLink: e.target.value }))}
                className="mt-1 hover:border-violet-300 focus:border-violet-500 transition-colors"
              />
            </div>
            <div>
              <Label className="text-sm">Work Type</Label>
              <Select
                value={formData.workType}
                onValueChange={(v) => setFormData((prev) => ({ ...prev, workType: v as Task["workType"] }))}
              >
                <SelectTrigger className="mt-1 hover:border-violet-300 transition-colors">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {WORK_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm">Amount (₹) *</Label>
              <Input
                type="text"
                inputMode="numeric"
                value={formData.amount}
                onChange={(e) => setFormData((prev) => ({ ...prev, amount: e.target.value.replace(/\D/g, "") }))}
                className="mt-1 hover:border-violet-300 focus:border-violet-500 transition-colors [appearance:textfield]"
              />
            </div>
            <div>
              <Label className="text-sm">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(v) => setFormData((prev) => ({ ...prev, status: v as Task["status"] }))}
              >
                <SelectTrigger className="mt-1 hover:border-violet-300 transition-colors">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm">Date Received</Label>
              <Input
                type="date"
                value={formData.dateReceived}
                onChange={(e) => setFormData((prev) => ({ ...prev, dateReceived: e.target.value }))}
                className="mt-1 hover:border-violet-300 focus:border-violet-500 transition-colors"
              />
            </div>
            <div>
              <Label className="text-sm">Date Delivered</Label>
              <Input
                type="date"
                value={formData.dateDelivered}
                onChange={(e) => setFormData((prev) => ({ ...prev, dateDelivered: e.target.value }))}
                className="mt-1 hover:border-violet-300 focus:border-violet-500 transition-colors"
              />
            </div>
            <div>
              <Label className="text-sm">Comments</Label>
              <Textarea
                value={formData.comments}
                onChange={(e) => setFormData((prev) => ({ ...prev, comments: e.target.value }))}
                className="mt-1 hover:border-violet-300 focus:border-violet-500 transition-colors"
                rows={3}
              />
            </div>
            <div className="flex gap-3 pt-2">
              <Button
                onClick={handleSubmit}
                className="flex-1 bg-violet-600 hover:bg-violet-700 text-white transition-all hover:scale-105"
              >
                {editingTask ? "Save Changes" : "Add Task"}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  resetForm()
                  setIsDialogOpen(false)
                }}
                className="hover:bg-secondary transition-colors"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Payment Dialog */}
      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Payment Record</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label className="text-sm">Client Name *</Label>
              <Select
                value={paymentFormData.clientName}
                onValueChange={(v) => {
                  const client = clients.find((c) => c.name === v)
                  setPaymentFormData((prev) => ({
                    ...prev,
                    clientName: v,
                    clientId: client?.id || "",
                  }))
                }}
              >
                <SelectTrigger className="mt-1 hover:border-violet-300 transition-colors">
                  <SelectValue placeholder="Select client" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.name}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm">Amount (₹) *</Label>
              <Input
                type="text"
                inputMode="numeric"
                value={paymentFormData.amount}
                onChange={(e) => setPaymentFormData((prev) => ({ ...prev, amount: e.target.value.replace(/\D/g, "") }))}
                className="mt-1 hover:border-violet-300 focus:border-violet-500 transition-colors [appearance:textfield]"
              />
            </div>
            <div>
              <Label className="text-sm">Date</Label>
              <Input
                type="date"
                value={paymentFormData.date}
                onChange={(e) => setPaymentFormData((prev) => ({ ...prev, date: e.target.value }))}
                className="mt-1 hover:border-violet-300 focus:border-violet-500 transition-colors"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <Button
                onClick={handlePaymentSubmit}
                className="flex-1 bg-violet-600 hover:bg-violet-700 text-white transition-all hover:scale-105"
              >
                Add Payment
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsPaymentDialogOpen(false)}
                className="hover:bg-secondary transition-colors"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Client Dialog */}
      <Dialog open={isClientDialogOpen} onOpenChange={setIsClientDialogOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingClient ? "Edit Client" : "Add New Client"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Avatar Upload */}
            <div className="flex items-center gap-4">
              <div className="relative h-16 w-16 rounded-full overflow-hidden bg-violet-100 flex items-center justify-center">
                {clientFormData.avatar ? (
                  <Image src={clientFormData.avatar || "/placeholder.svg"} alt="Avatar" fill className="object-cover" />
                ) : (
                  <Camera className="h-6 w-6 text-violet-300" />
                )}
              </div>
              <div className="space-y-1">
                <input
                  type="file"
                  id="avatar-upload-dialog"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarUpload}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById("avatar-upload-dialog")?.click()}
                  className="hover:bg-violet-50 hover:border-violet-300 transition-colors"
                >
                  <Upload className="h-3 w-3 mr-1" />
                  Upload
                </Button>
                {clientFormData.avatar && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setClientFormData((prev) => ({ ...prev, avatar: "" }))}
                    className="text-red-500 hover:text-red-600 hover:bg-red-50"
                  >
                    Remove
                  </Button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-sm">First Name *</Label>
                <Input
                  value={clientFormData.firstName}
                  onChange={(e) => setClientFormData((prev) => ({ ...prev, firstName: e.target.value }))}
                  className="mt-1 hover:border-violet-300 focus:border-violet-500 transition-colors"
                />
              </div>
              <div>
                <Label className="text-sm">Last Name *</Label>
                <Input
                  value={clientFormData.lastName}
                  onChange={(e) => setClientFormData((prev) => ({ ...prev, lastName: e.target.value }))}
                  className="mt-1 hover:border-violet-300 focus:border-violet-500 transition-colors"
                />
              </div>
            </div>
            <div>
              <Label className="text-sm">Middle Name</Label>
              <Input
                value={clientFormData.middleName}
                onChange={(e) => setClientFormData((prev) => ({ ...prev, middleName: e.target.value }))}
                className="mt-1 hover:border-violet-300 focus:border-violet-500 transition-colors"
              />
            </div>
            <div>
              <Label className="text-sm">Login Email *</Label>
              <Input
                type="email"
                value={clientFormData.email}
                onChange={(e) => setClientFormData((prev) => ({ ...prev, email: e.target.value }))}
                placeholder="name@nazito.in"
                className="mt-1 hover:border-violet-300 focus:border-violet-500 transition-colors"
              />
            </div>
            <div>
              <Label className="text-sm">Password *</Label>
              <Input
                type="text"
                value={clientFormData.password}
                onChange={(e) => setClientFormData((prev) => ({ ...prev, password: e.target.value }))}
                placeholder="name@123"
                className="mt-1 hover:border-violet-300 focus:border-violet-500 transition-colors"
              />
            </div>
            <div>
              <Label className="text-sm">Original Email</Label>
              <Input
                type="email"
                value={clientFormData.originalEmail}
                onChange={(e) => setClientFormData((prev) => ({ ...prev, originalEmail: e.target.value }))}
                placeholder="For invoices"
                className="mt-1 hover:border-violet-300 focus:border-violet-500 transition-colors"
              />
            </div>
            <div>
              <Label className="text-sm">Phone Number</Label>
              <Input
                type="tel"
                value={clientFormData.phone}
                onChange={(e) => setClientFormData((prev) => ({ ...prev, phone: e.target.value }))}
                placeholder="For WhatsApp"
                className="mt-1 hover:border-violet-300 focus:border-violet-500 transition-colors"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <Button
                onClick={handleClientSubmit}
                className="flex-1 bg-violet-600 hover:bg-violet-700 text-white transition-all hover:scale-105"
              >
                {editingClient ? "Save Changes" : "Add Client"}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  resetClientForm()
                  setIsClientDialogOpen(false)
                }}
                className="hover:bg-secondary transition-colors"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Invoice Viewer Dialog */}
      <Dialog open={!!viewingInvoice} onOpenChange={() => setViewingInvoice(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Invoice</DialogTitle>
          </DialogHeader>
          {viewingInvoice && (
            <div className="relative aspect-[3/4] w-full">
              <Image src={viewingInvoice || "/placeholder.svg"} alt="Invoice" fill className="object-contain" />
            </div>
          )}
          <div className="flex justify-end gap-2">
            {viewingInvoice && (
              <a href={viewingInvoice} download="invoice.png">
                <Button className="bg-violet-600 hover:bg-violet-700 text-white">
                  <Download className="h-4 w-4 mr-1" />
                  Download
                </Button>
              </a>
            )}
            <Button variant="outline" onClick={() => setViewingInvoice(null)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
