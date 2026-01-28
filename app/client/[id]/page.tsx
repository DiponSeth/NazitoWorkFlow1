"use client"

import { useState, useEffect, use } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
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
  Calendar as CalendarIcon,
  Home,
  ListTodo,
  History,
  Menu,
  X,
  CreditCard,
  XCircle,
  FileText,
  MessageCircle,
  Star,
  Download,
  Eye,
  LogOut,
  Filter,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

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
  name: string
  email: string
  password: string
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

type ViewType = "home" | "tasks" | "add" | "history" | "payments" | "invoices"

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

// Delivery progress component
function DeliveryProgress({ status, dateReceived, dateDelivered }: { status: string; dateReceived: string; dateDelivered?: string }) {
  let percentage = 0
  let label = "Not Started"
  
  switch (status) {
    case "Done":
      percentage = 100
      label = "Delivered"
      break
    case "In Progress":
      percentage = 50
      label = "In Progress"
      break
    case "Not Done":
      percentage = 10
      label = "Pending"
      break
    case "Cancelled":
      percentage = 0
      label = "Cancelled"
      break
  }

  // Calculate speed if delivered
  let speedLabel = ""
  if (status === "Done" && dateDelivered) {
    const received = new Date(dateReceived)
    const delivered = new Date(dateDelivered)
    const days = Math.ceil((delivered.getTime() - received.getTime()) / (1000 * 60 * 60 * 24))
    if (days <= 1) speedLabel = "Lightning Fast"
    else if (days <= 3) speedLabel = "Fast"
    else if (days <= 7) speedLabel = "On Time"
    else speedLabel = "Extended"
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        {speedLabel && <span className="text-violet-600 font-medium">{speedLabel}</span>}
      </div>
      <div className="h-2 bg-violet-100 rounded-full overflow-hidden">
        <div
          className={cn(
            "h-full transition-all duration-500",
            status === "Done" ? "bg-emerald-500" :
            status === "In Progress" ? "bg-amber-500" :
            status === "Cancelled" ? "bg-red-500" : "bg-slate-300"
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}

export default function ClientDashboard({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const clientId = resolvedParams.id
  const router = useRouter()
  
  const [client, setClient] = useState<Client | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [isLoaded, setIsLoaded] = useState(false)
  const [activeView, setActiveView] = useState<ViewType>("home")
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date())
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split("T")[0])

  // Dialog states
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false)
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null)
  const [isFeedbackDialogOpen, setIsFeedbackDialogOpen] = useState(false)
  const [feedbackTask, setFeedbackTask] = useState<Task | null>(null)
  const [viewingInvoice, setViewingInvoice] = useState<string | null>(null)
  const [paymentSuccess, setPaymentSuccess] = useState(false)

  // Filter state
  const [filterMonth, setFilterMonth] = useState<number>(new Date().getMonth())
  const [filterYear, setFilterYear] = useState<number>(new Date().getFullYear())

  // Form states
  const [taskFormData, setTaskFormData] = useState({
    projectName: "",
    projectLink: "",
    comments: "",
  })
  const [feedbackData, setFeedbackData] = useState({
    feedback: "",
    rating: 5,
  })
  const [paymentFormData, setPaymentFormData] = useState({
    screenshot: "",
    utrNumber: "",
  })

  // Load data
  useEffect(() => {
    const saved = localStorage.getItem("nazitoWorkTrackerData")
    if (saved) {
      const data: AppState = JSON.parse(saved)
      const foundClient = data.clients?.find((c) => c.id === clientId)
      if (foundClient) {
        setClient(foundClient)
        setTasks(data.tasks?.filter((t) => t.clientId === clientId || t.clientName === foundClient.name) || [])
        setPayments(data.payments?.filter((p) => p.clientId === clientId || p.clientName === foundClient.name) || [])
      }
    }
    setIsLoaded(true)
  }, [clientId])

  // Save tasks back to main storage
  const saveData = (updatedTasks: Task[], updatedPayments: Payment[]) => {
    const saved = localStorage.getItem("nazitoWorkTrackerData")
    if (saved) {
      const data: AppState = JSON.parse(saved)
      // Update tasks
      const otherTasks = data.tasks?.filter((t) => t.clientId !== clientId && t.clientName !== client?.name) || []
      data.tasks = [...otherTasks, ...updatedTasks]
      // Update payments
      const otherPayments = data.payments?.filter((p) => p.clientId !== clientId && p.clientName !== client?.name) || []
      data.payments = [...otherPayments, ...updatedPayments]
      localStorage.setItem("nazitoWorkTrackerData", JSON.stringify(data))
    }
  }

  // Calculations
  const now = new Date()
  const currentMonthNum = now.getMonth()
  const currentYear = now.getFullYear()

  // Current month due
  const currentMonthDue = payments
    .filter((p) => {
      const pDate = new Date(p.date)
      return p.status === "Pending" && pDate.getMonth() === currentMonthNum && pDate.getFullYear() === currentYear
    })
    .reduce((sum, p) => sum + p.amount, 0)

  // Total due
  const totalDue = payments.filter((p) => p.status === "Pending").reduce((sum, p) => sum + p.amount, 0)

  // Filtered payments for history
  const filteredPayments = payments.filter((p) => {
    const pDate = new Date(p.date)
    return pDate.getMonth() === filterMonth && pDate.getFullYear() === filterYear
  })

  // Available years
  const availableYears = Array.from(
    new Set([...payments.map((p) => new Date(p.date).getFullYear()), currentYear])
  ).sort((a, b) => b - a)

  // Task handlers
  const handleTaskSubmit = () => {
    if (!taskFormData.projectName || !client) return

    const newTask: Task = {
      id: editingTask?.id || crypto.randomUUID(),
      clientId: clientId,
      clientName: client.name,
      projectName: taskFormData.projectName,
      projectLink: taskFormData.projectLink || undefined,
      comments: taskFormData.comments || undefined,
      workType: "Custom",
      amount: 0,
      status: "Not Done",
      dateReceived: new Date().toISOString().split("T")[0],
    }

    let updatedTasks: Task[]
    if (editingTask) {
      updatedTasks = tasks.map((t) => (t.id === editingTask.id ? { ...t, ...newTask, amount: t.amount, workType: t.workType, status: t.status } : t))
    } else {
      updatedTasks = [...tasks, newTask]
    }

    setTasks(updatedTasks)
    saveData(updatedTasks, payments)
    setTaskFormData({ projectName: "", projectLink: "", comments: "" })
    setEditingTask(null)
    setIsTaskDialogOpen(false)
  }

  const handleTaskEdit = (task: Task) => {
    if (task.status === "Done" || task.status === "Cancelled") return
    setEditingTask(task)
    setTaskFormData({
      projectName: task.projectName,
      projectLink: task.projectLink || "",
      comments: task.comments || "",
    })
    setIsTaskDialogOpen(true)
  }

  const handleTaskDelete = (id: string) => {
    const task = tasks.find((t) => t.id === id)
    if (task && (task.status === "Done" || task.status === "Cancelled")) return
    const updatedTasks = tasks.filter((t) => t.id !== id)
    setTasks(updatedTasks)
    saveData(updatedTasks, payments)
  }

  // Feedback handler
  const handleFeedbackSubmit = () => {
    if (!feedbackTask) return
    const updatedTasks = tasks.map((t) =>
      t.id === feedbackTask.id ? { ...t, feedback: feedbackData.feedback, rating: feedbackData.rating } : t
    )
    setTasks(updatedTasks)
    saveData(updatedTasks, payments)
    setFeedbackData({ feedback: "", rating: 5 })
    setFeedbackTask(null)
    setIsFeedbackDialogOpen(false)
  }

  // Payment handler
  const handlePaymentDone = () => {
    if (!selectedPayment || (!paymentFormData.screenshot && !paymentFormData.utrNumber)) return

    // Send to WhatsApp
    const message = `Payment Notification%0A%0AClient: ${client?.name}%0AAmount: ${formatCurrency(selectedPayment.amount)}%0ADate: ${selectedPayment.date}%0A${paymentFormData.utrNumber ? `UTR: ${paymentFormData.utrNumber}` : "Screenshot attached"}`
    window.open(`https://wa.me/917980131920?text=${message}`, "_blank")

    // Update payment status to pending verification
    const updatedPayments = payments.map((p) =>
      p.id === selectedPayment.id
        ? { ...p, screenshot: paymentFormData.screenshot, utrNumber: paymentFormData.utrNumber }
        : p
    )
    setPayments(updatedPayments)
    saveData(tasks, updatedPayments)

    setPaymentFormData({ screenshot: "", utrNumber: "" })
    setSelectedPayment(null)
    setIsPaymentDialogOpen(false)
    setPaymentSuccess(true)
  }

  const handleScreenshotUpload = (file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      setPaymentFormData((prev) => ({ ...prev, screenshot: e.target?.result as string }))
    }
    reader.readAsDataURL(file)
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

  // Calendar
  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))
  }

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))
  }

  const datesWithTasks = tasks.map((t) => t.dateReceived)

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
      days.push(<div key={`empty-${i}`} className="h-8" />)
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
      const isSelected = dateStr === selectedDate
      const isToday = dateStr === today
      const hasTask = datesWithTasks.includes(dateStr)

      days.push(
        <button
          key={day}
          onClick={() => setSelectedDate(dateStr)}
          className={cn(
            "h-8 w-8 mx-auto rounded-full flex items-center justify-center text-xs transition-all relative hover:scale-110",
            isSelected && "bg-violet-600 text-white font-medium shadow-lg",
            !isSelected && isToday && "border-2 border-violet-400 font-medium",
            !isSelected && !isToday && "hover:bg-violet-100",
            hasTask && !isSelected && "font-medium"
          )}
        >
          {day}
          {hasTask && !isSelected && (
            <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-violet-500 rounded-full" />
          )}
        </button>
      )
    }

    return days
  }

  const handleLogout = () => {
    localStorage.removeItem("nazitoClientSession")
    router.push("/client/login")
  }

  const navItems = [
    { id: "home" as ViewType, label: "Home", icon: Home },
    { id: "tasks" as ViewType, label: "All Tasks", icon: ListTodo },
    { id: "add" as ViewType, label: "Add Task", icon: Plus },
    { id: "payments" as ViewType, label: "Payment History", icon: History },
    { id: "invoices" as ViewType, label: "Invoices", icon: FileText },
  ]

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    )
  }

  if (!client) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-xl font-bold mb-2">Client Not Found</h1>
          <p className="text-muted-foreground mb-4">Please login to access your dashboard.</p>
          <Link href="/client/login">
            <Button className="bg-violet-600 hover:bg-violet-700 text-white">Go to Login</Button>
          </Link>
        </div>
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
                      setEditingTask(null)
                      setTaskFormData({ projectName: "", projectLink: "", comments: "" })
                      setIsTaskDialogOpen(true)
                    }
                  }}
                >
                  <item.icon className="h-4 w-4 mr-1.5" />
                  {item.label}
                </Button>
              ))}
            </div>

            {/* Profile & Logout */}
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center gap-2 text-sm">
                <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center font-medium">
                  {client.name.charAt(0).toUpperCase()}
                </div>
                <span>Hi, {client.name.split(" ")[0]}</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/10"
                onClick={handleLogout}
              >
                <LogOut className="h-5 w-5" />
              </Button>

              {/* Mobile Menu Button */}
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

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <div className="lg:hidden pb-4 space-y-1 border-t border-white/20 pt-2">
              <div className="px-3 py-2 text-white/80 text-sm flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center font-medium">
                  {client.name.charAt(0).toUpperCase()}
                </div>
                <span>Hi, {client.name}</span>
              </div>
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
                      setEditingTask(null)
                      setTaskFormData({ projectName: "", projectLink: "", comments: "" })
                      setIsTaskDialogOpen(true)
                    }
                  }}
                >
                  <item.icon className="h-4 w-4 mr-2" />
                  {item.label}
                </Button>
              ))}
            </div>
          )}
        </div>
      </nav>

      <main className="container mx-auto px-4 py-4 md:py-6 flex-1">
        {/* Home View */}
        {activeView === "home" && (
          <div className="grid gap-4 md:gap-6 lg:grid-cols-5">
            {/* Left Side - Due & Progress */}
            <div className="lg:col-span-3 space-y-4">
              {/* Due Amount Card */}
              <Card className="border-violet-100 bg-gradient-to-br from-amber-500 to-amber-600 text-white overflow-hidden">
                <CardContent className="py-4 md:py-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-amber-100 text-sm">Total Due Amount</p>
                      <p className="text-2xl md:text-3xl font-bold tabular-nums mt-1">{formatCurrency(totalDue)}</p>
                      <p className="text-amber-100 text-xs mt-1">Current Month: {formatCurrency(currentMonthDue)}</p>
                    </div>
                    <div className="h-12 w-12 md:h-14 md:w-14 rounded-full bg-white/20 flex items-center justify-center">
                      <IndianRupee className="h-6 w-6 md:h-7 md:w-7" />
                    </div>
                  </div>
                  {totalDue > 0 && (
                    <Button
                      className="mt-4 bg-white text-amber-600 hover:bg-amber-50 transition-all hover:scale-105"
                      onClick={() => {
                        const pendingPayment = payments.find((p) => p.status === "Pending")
                        if (pendingPayment) {
                          setSelectedPayment(pendingPayment)
                          setIsPaymentDialogOpen(true)
                        }
                      }}
                    >
                      <CreditCard className="h-4 w-4 mr-2" />
                      Clear Due
                    </Button>
                  )}
                </CardContent>
              </Card>

              {/* Current Month Tasks */}
              <Card className="border-violet-100 bg-white/80 backdrop-blur">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-medium">
                    {getMonthName(currentMonthNum)} {currentYear} Tasks
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {tasks.filter((t) => {
                    const tDate = new Date(t.dateReceived)
                    return tDate.getMonth() === currentMonthNum && tDate.getFullYear() === currentYear
                  }).length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <ListTodo className="h-10 w-10 mx-auto mb-2 opacity-20" />
                      <p className="text-sm">No tasks this month</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {tasks
                        .filter((t) => {
                          const tDate = new Date(t.dateReceived)
                          return tDate.getMonth() === currentMonthNum && tDate.getFullYear() === currentYear
                        })
                        .map((task) => (
                          <div
                            key={task.id}
                            className="p-4 rounded-lg border bg-white hover:shadow-md transition-all hover:border-violet-200"
                          >
                            <div className="flex flex-col gap-3">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <h3 className="font-medium">{task.projectName}</h3>
                                    <span
                                      className={cn(
                                        "inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs border",
                                        getStatusColor(task.status)
                                      )}
                                    >
                                      {getStatusIcon(task.status)}
                                      {task.status}
                                    </span>
                                  </div>
                                  <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                                    <span>{task.workType}</span>
                                    <span>|</span>
                                    <span>Received: {new Date(task.dateReceived).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}</span>
                                    {task.dateDelivered && (
                                      <>
                                        <span>|</span>
                                        <span>Delivered: {new Date(task.dateDelivered).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}</span>
                                      </>
                                    )}
                                  </div>
                                  <p className="text-sm font-semibold text-violet-600 mt-1">{formatCurrency(task.amount)}</p>
                                </div>
                              </div>
                              
                              {/* Delivery Progress */}
                              <DeliveryProgress status={task.status} dateReceived={task.dateReceived} dateDelivered={task.dateDelivered} />
                              
                              {/* Actions */}
                              <div className="flex items-center gap-2">
                                {task.status === "Done" && !task.feedback && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-8 hover:bg-violet-50 transition-colors bg-transparent"
                                    onClick={() => {
                                      setFeedbackTask(task)
                                      setIsFeedbackDialogOpen(true)
                                    }}
                                  >
                                    <Star className="h-3.5 w-3.5 mr-1" />
                                    Give Feedback
                                  </Button>
                                )}
                                {task.status !== "Done" && task.status !== "Cancelled" && (
                                  <>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="h-8 hover:bg-violet-50 transition-colors bg-transparent"
                                      onClick={() => handleTaskEdit(task)}
                                    >
                                      <Pencil className="h-3.5 w-3.5 mr-1" />
                                      Edit
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="h-8 hover:bg-red-50 hover:text-red-600 transition-colors bg-transparent"
                                      onClick={() => handleTaskDelete(task.id)}
                                    >
                                      <Trash2 className="h-3.5 w-3.5 mr-1" />
                                      Delete
                                    </Button>
                                  </>
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
                      <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-violet-100" onClick={prevMonth}>
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <span className="text-xs font-medium min-w-[100px] text-center">
                        {currentMonth.toLocaleString("default", { month: "short", year: "numeric" })}
                      </span>
                      <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-violet-100" onClick={nextMonth}>
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
                  <CardTitle className="text-sm font-medium">
                    Tasks for {new Date(selectedDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {tasks.filter((t) => t.dateReceived === selectedDate).length === 0 ? (
                    <div className="text-center py-6 text-muted-foreground">
                      <CalendarIcon className="h-8 w-8 mx-auto mb-2 opacity-20" />
                      <p className="text-sm">No tasks</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {tasks
                        .filter((t) => t.dateReceived === selectedDate)
                        .map((task) => (
                          <div key={task.id} className="p-3 rounded-lg border bg-white">
                            <div className="flex items-center justify-between">
                              <div>
                                <h3 className="font-medium text-sm">{task.projectName}</h3>
                                <p className="text-xs text-muted-foreground">{task.workType}</p>
                              </div>
                              <span
                                className={cn(
                                  "inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs border",
                                  getStatusColor(task.status)
                                )}
                              >
                                {getStatusIcon(task.status)}
                              </span>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* All Tasks View */}
        {activeView === "tasks" && (
          <Card className="border-violet-100 bg-white/80 backdrop-blur">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-medium">All Tasks ({tasks.length})</CardTitle>
                <Button
                  size="sm"
                  className="bg-violet-600 hover:bg-violet-700 text-white transition-all hover:scale-105"
                  onClick={() => {
                    setEditingTask(null)
                    setTaskFormData({ projectName: "", projectLink: "", comments: "" })
                    setIsTaskDialogOpen(true)
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
                  <ListTodo className="h-12 w-12 mx-auto mb-2 opacity-20" />
                  <p className="text-sm">No tasks yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {tasks
                    .sort((a, b) => new Date(b.dateReceived).getTime() - new Date(a.dateReceived).getTime())
                    .map((task) => (
                      <div
                        key={task.id}
                        className="p-4 rounded-lg border bg-white hover:shadow-md transition-all hover:border-violet-200"
                      >
                        <div className="flex flex-col gap-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-medium">{task.projectName}</h3>
                                <span
                                  className={cn(
                                    "inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs border",
                                    getStatusColor(task.status)
                                  )}
                                >
                                  {getStatusIcon(task.status)}
                                  {task.status}
                                </span>
                              </div>
                              <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                                <span>{task.workType}</span>
                                <span>|</span>
                                <span>
                                  {new Date(task.dateReceived).toLocaleDateString("en-IN", {
                                    day: "2-digit",
                                    month: "short",
                                    year: "numeric",
                                  })}
                                </span>
                              </div>
                              <p className="text-sm font-semibold text-violet-600 mt-1">{formatCurrency(task.amount)}</p>
                              {task.projectLink && (
                                <a
                                  href={task.projectLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-violet-600 hover:underline mt-1 block"
                                >
                                  View Project Link
                                </a>
                              )}
                              {task.comments && (
                                <p className="text-xs text-muted-foreground mt-1 italic">{task.comments}</p>
                              )}
                            </div>
                          </div>

                          <DeliveryProgress status={task.status} dateReceived={task.dateReceived} dateDelivered={task.dateDelivered} />

                          <div className="flex items-center gap-2">
                            {task.status === "Done" && !task.feedback && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 hover:bg-violet-50 transition-colors bg-transparent"
                                onClick={() => {
                                  setFeedbackTask(task)
                                  setIsFeedbackDialogOpen(true)
                                }}
                              >
                                <Star className="h-3.5 w-3.5 mr-1" />
                                Give Feedback
                              </Button>
                            )}
                            {task.feedback && (
                              <div className="flex items-center gap-1 text-amber-500">
                                {Array.from({ length: 5 }).map((_, i) => (
                                  <span key={i} className={i < (task.rating || 0) ? "text-amber-500" : "text-gray-200"}>
                                    ★
                                  </span>
                                ))}
                              </div>
                            )}
                            {task.status !== "Done" && task.status !== "Cancelled" && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-8 hover:bg-violet-50 transition-colors bg-transparent"
                                  onClick={() => handleTaskEdit(task)}
                                >
                                  <Pencil className="h-3.5 w-3.5 mr-1" />
                                  Edit
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-8 hover:bg-red-50 hover:text-red-600 transition-colors bg-transparent"
                                  onClick={() => handleTaskDelete(task.id)}
                                >
                                  <Trash2 className="h-3.5 w-3.5 mr-1" />
                                  Delete
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Payment History View */}
        {activeView === "payments" && (
          <div className="space-y-4">
            <Card className="border-violet-100 bg-white/80 backdrop-blur">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium flex items-center gap-2">
                  <History className="h-4 w-4 text-violet-500" />
                  Payment History
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Filter */}
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

                {filteredPayments.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <History className="h-12 w-12 mx-auto mb-2 opacity-20" />
                    <p className="text-sm">No payments for this period</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredPayments.map((payment) => (
                      <div
                        key={payment.id}
                        className="p-4 rounded-lg border bg-white hover:shadow-md transition-all hover:border-violet-200"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div>
                            <p className="text-xs text-muted-foreground">
                              {new Date(payment.date).toLocaleDateString("en-IN", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              })}
                            </p>
                            <p className="text-lg font-bold text-violet-600">{formatCurrency(payment.amount)}</p>
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={cn(
                                "px-2 py-1 rounded-full text-xs font-medium",
                                payment.status === "Verified"
                                  ? "bg-emerald-100 text-emerald-700"
                                  : "bg-amber-100 text-amber-700"
                              )}
                            >
                              {payment.status}
                            </span>
                            {payment.invoiceUrl && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-8 hover:bg-violet-50 bg-transparent"
                                  onClick={() => setViewingInvoice(payment.invoiceUrl!)}
                                >
                                  <Eye className="h-3.5 w-3.5 mr-1" />
                                  View
                                </Button>
                                <Button size="sm" variant="outline" className="h-8 hover:bg-violet-50 bg-transparent" asChild>
                                  <a href={payment.invoiceUrl} download>
                                    <Download className="h-3.5 w-3.5 mr-1" />
                                    Download
                                  </a>
                                </Button>
                              </>
                            )}
                            {payment.status === "Pending" && (
                              <Button
                                size="sm"
                                className="h-8 bg-emerald-600 hover:bg-emerald-700 text-white"
                                onClick={() => {
                                  setSelectedPayment(payment)
                                  setIsPaymentDialogOpen(true)
                                }}
                              >
                                <CreditCard className="h-3.5 w-3.5 mr-1" />
                                Pay Now
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

        {/* Invoices View */}
        {activeView === "invoices" && (
          <Card className="border-violet-100 bg-white/80 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <FileText className="h-4 w-4 text-violet-500" />
                Invoices
              </CardTitle>
            </CardHeader>
            <CardContent>
              {payments.filter((p) => p.invoiceUrl).length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-2 opacity-20" />
                  <p className="text-sm">No invoices available</p>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {payments
                    .filter((p) => p.invoiceUrl)
                    .map((payment) => (
                      <Card key={payment.id} className="border-violet-100 hover:shadow-md transition-all">
                        <CardContent className="py-4">
                          <p className="text-xs text-muted-foreground">
                            {new Date(payment.date).toLocaleDateString("en-IN", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })}
                          </p>
                          <p className="text-lg font-bold text-violet-600 mt-1">{formatCurrency(payment.amount)}</p>
                          <div className="flex gap-2 mt-3">
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1 h-8 hover:bg-violet-50 bg-transparent"
                              onClick={() => setViewingInvoice(payment.invoiceUrl!)}
                            >
                              <Eye className="h-3.5 w-3.5 mr-1" />
                              View
                            </Button>
                            <Button size="sm" variant="outline" className="flex-1 h-8 hover:bg-violet-50 bg-transparent" asChild>
                              <a href={payment.invoiceUrl} download>
                                <Download className="h-3.5 w-3.5 mr-1" />
                                Download
                              </a>
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
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
      <Dialog open={isTaskDialogOpen} onOpenChange={setIsTaskDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingTask ? "Edit Task" : "Add New Task"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label className="text-sm">Project Name *</Label>
              <Input
                value={taskFormData.projectName}
                onChange={(e) => setTaskFormData((prev) => ({ ...prev, projectName: e.target.value }))}
                className="mt-1 hover:border-violet-300 transition-colors"
                placeholder="Enter project name"
              />
            </div>
            <div>
              <Label className="text-sm">Project Link (Optional)</Label>
              <Input
                value={taskFormData.projectLink}
                onChange={(e) => setTaskFormData((prev) => ({ ...prev, projectLink: e.target.value }))}
                className="mt-1 hover:border-violet-300 transition-colors"
                placeholder="https://..."
              />
            </div>
            <div>
              <Label className="text-sm">Comments (Optional)</Label>
              <Textarea
                value={taskFormData.comments}
                onChange={(e) => setTaskFormData((prev) => ({ ...prev, comments: e.target.value }))}
                className="mt-1 hover:border-violet-300 transition-colors"
                placeholder="Any additional notes..."
                rows={3}
              />
            </div>
            <Button
              onClick={handleTaskSubmit}
              className="w-full bg-violet-600 hover:bg-violet-700 text-white transition-all"
            >
              {editingTask ? "Update Task" : "Add Task"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Feedback Dialog */}
      <Dialog open={isFeedbackDialogOpen} onOpenChange={setIsFeedbackDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Give Feedback</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label className="text-sm">Rating</Label>
              <div className="flex items-center gap-1 mt-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setFeedbackData((prev) => ({ ...prev, rating: i + 1 }))}
                    className={cn(
                      "text-2xl transition-colors",
                      i < feedbackData.rating ? "text-amber-500" : "text-gray-200 hover:text-amber-300"
                    )}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label className="text-sm">Feedback</Label>
              <Textarea
                value={feedbackData.feedback}
                onChange={(e) => setFeedbackData((prev) => ({ ...prev, feedback: e.target.value }))}
                className="mt-1 hover:border-violet-300 transition-colors"
                placeholder="Share your experience..."
                rows={4}
              />
            </div>
            <Button
              onClick={handleFeedbackSubmit}
              className="w-full bg-violet-600 hover:bg-violet-700 text-white transition-all"
            >
              Submit Feedback
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Payment Dialog */}
      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Clear Due Payment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {selectedPayment && (
              <div className="p-4 rounded-lg bg-violet-50 border border-violet-200 text-center">
                <p className="text-sm text-muted-foreground">Amount to Pay</p>
                <p className="text-2xl font-bold text-violet-600">{formatCurrency(selectedPayment.amount)}</p>
              </div>
            )}

            {/* QR Code */}
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-3">Scan QR to Pay</p>
              <div className="relative w-48 h-48 mx-auto rounded-lg overflow-hidden border">
                <Image src="/payment-qr.jpeg" alt="Payment QR" fill className="object-cover" />
              </div>
              <p className="text-xs text-muted-foreground mt-2">UPI ID: 9477235939@ibl</p>
            </div>

            <div className="border-t pt-4">
              <p className="text-sm font-medium mb-3 text-center">After Payment, Choose One:</p>

              <div className="space-y-3">
                <div>
                  <Label className="text-sm">Upload Screenshot</Label>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) handleScreenshotUpload(file)
                    }}
                    className="mt-1"
                  />
                </div>

                <div className="text-center text-xs text-muted-foreground">OR</div>

                <div>
                  <Label className="text-sm">Enter UTR Number</Label>
                  <Input
                    value={paymentFormData.utrNumber}
                    onChange={(e) => setPaymentFormData((prev) => ({ ...prev, utrNumber: e.target.value }))}
                    className="mt-1 hover:border-violet-300 transition-colors"
                    placeholder="Enter 12-digit UTR number"
                  />
                </div>
              </div>

              <Button
                onClick={handlePaymentDone}
                disabled={!paymentFormData.screenshot && !paymentFormData.utrNumber}
                className="w-full mt-4 bg-emerald-600 hover:bg-emerald-700 text-white transition-all"
              >
                Payment Done
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Payment Success Dialog */}
      <Dialog open={paymentSuccess} onOpenChange={setPaymentSuccess}>
        <DialogContent className="max-w-sm text-center">
          <div className="py-6">
            <div className="mx-auto mb-4 relative h-16 w-16">
              <Image src="/nazito-logo.png" alt="NAZITO Logo" fill className="object-contain" />
            </div>
            <Check className="h-12 w-12 mx-auto text-emerald-500 mb-4" />
            <h2 className="text-lg font-bold mb-2">Payment Submitted!</h2>
            <p className="text-sm text-muted-foreground">
              Wait within 24 hours your payment will be updated. Thank you for choosing NAZITO WORK TRACKER!
            </p>
            <Button
              onClick={() => setPaymentSuccess(false)}
              className="mt-6 bg-violet-600 hover:bg-violet-700 text-white"
            >
              <X className="h-4 w-4 mr-2" />
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Invoice Viewer */}
      <Dialog open={!!viewingInvoice} onOpenChange={() => setViewingInvoice(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Invoice</DialogTitle>
          </DialogHeader>
          {viewingInvoice && (
            <div className="relative aspect-[4/3] w-full">
              <Image src={viewingInvoice || "/placeholder.svg"} alt="Invoice" fill className="object-contain" />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
