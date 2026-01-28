/**
 * WorkFlow - Earnings Tracker
 * A minimal, modern work and earnings tracking application
 * All data persists in localStorage
 */

// ============================================
// State Management
// ============================================

const state = {
  tasks: [],
  monthlyTarget: 0,
  currentMonth: new Date().getMonth(),
  currentYear: new Date().getFullYear(),
  selectedDate: null,
  currentFilter: 'all',
  editingTaskId: null
};

// ============================================
// DOM Elements
// ============================================

const elements = {
  // Header
  totalEarnings: document.getElementById('totalEarnings'),
  
  // Target Section
  targetInputWrapper: document.getElementById('targetInputWrapper'),
  progressContainer: document.getElementById('progressContainer'),
  targetInput: document.getElementById('targetInput'),
  saveTargetBtn: document.getElementById('saveTargetBtn'),
  editTargetBtn: document.getElementById('editTargetBtn'),
  earnedAmount: document.getElementById('earnedAmount'),
  targetAmount: document.getElementById('targetAmount'),
  progressPercentage: document.getElementById('progressPercentage'),
  progressFill: document.getElementById('progressFill'),
  
  // Calendar
  calendarTitle: document.getElementById('calendarTitle'),
  calendarDays: document.getElementById('calendarDays'),
  prevMonth: document.getElementById('prevMonth'),
  nextMonth: document.getElementById('nextMonth'),
  
  // Tasks
  tasksList: document.getElementById('tasksList'),
  emptyState: document.getElementById('emptyState'),
  addTaskBtn: document.getElementById('addTaskBtn'),
  selectedDateInfo: document.getElementById('selectedDateInfo'),
  selectedDateDisplay: document.getElementById('selectedDateDisplay'),
  clearDateFilter: document.getElementById('clearDateFilter'),
  filterBtns: document.querySelectorAll('.filter-btn'),
  
  // Modal
  taskModal: document.getElementById('taskModal'),
  modalTitle: document.getElementById('modalTitle'),
  taskForm: document.getElementById('taskForm'),
  closeModal: document.getElementById('closeModal'),
  cancelBtn: document.getElementById('cancelBtn'),
  taskId: document.getElementById('taskId'),
  clientName: document.getElementById('clientName'),
  projectName: document.getElementById('projectName'),
  workType: document.getElementById('workType'),
  amount: document.getElementById('amount'),
  status: document.getElementById('status'),
  taskDate: document.getElementById('taskDate')
};

// ============================================
// LocalStorage Functions
// ============================================

/**
 * Load all data from localStorage
 */
function loadFromStorage() {
  try {
    const tasks = localStorage.getItem('workflow_tasks');
    const target = localStorage.getItem('workflow_target');
    const calendarState = localStorage.getItem('workflow_calendar');
    
    if (tasks) {
      state.tasks = JSON.parse(tasks);
    }
    
    if (target) {
      state.monthlyTarget = parseFloat(target);
    }
    
    if (calendarState) {
      const { month, year } = JSON.parse(calendarState);
      state.currentMonth = month;
      state.currentYear = year;
    }
  } catch (error) {
    console.error('Error loading from localStorage:', error);
  }
}

/**
 * Save tasks to localStorage
 */
function saveTasks() {
  try {
    localStorage.setItem('workflow_tasks', JSON.stringify(state.tasks));
  } catch (error) {
    console.error('Error saving tasks:', error);
  }
}

/**
 * Save monthly target to localStorage
 */
function saveTarget() {
  try {
    localStorage.setItem('workflow_target', state.monthlyTarget.toString());
  } catch (error) {
    console.error('Error saving target:', error);
  }
}

/**
 * Save calendar state to localStorage
 */
function saveCalendarState() {
  try {
    localStorage.setItem('workflow_calendar', JSON.stringify({
      month: state.currentMonth,
      year: state.currentYear
    }));
  } catch (error) {
    console.error('Error saving calendar state:', error);
  }
}

// ============================================
// Utility Functions
// ============================================

/**
 * Format a number as Indian Rupee currency
 * @param {number} amount - The amount to format
 * @returns {string} Formatted currency string
 */
function formatCurrency(amount) {
  return '₹' + amount.toLocaleString('en-IN');
}

/**
 * Format a date for display
 * @param {string} dateStr - ISO date string
 * @returns {string} Formatted date string
 */
function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}

/**
 * Get month name
 * @param {number} month - Month index (0-11)
 * @returns {string} Month name
 */
function getMonthName(month) {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return months[month];
}

/**
 * Generate a unique ID
 * @returns {string} Unique identifier
 */
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

/**
 * Animate a number change
 * @param {HTMLElement} element - The element to animate
 * @param {number} newValue - The new value to display
 * @param {function} formatter - Function to format the value
 */
function animateNumber(element, newValue, formatter = formatCurrency) {
  element.classList.add('updating');
  setTimeout(() => {
    element.textContent = formatter(newValue);
    element.classList.remove('updating');
  }, 150);
}

// ============================================
// Earnings Calculations
// ============================================

/**
 * Calculate total earnings from all completed tasks
 * @returns {number} Total earnings
 */
function calculateTotalEarnings() {
  return state.tasks
    .filter(task => task.status === 'Done')
    .reduce((sum, task) => sum + task.amount, 0);
}

/**
 * Calculate earnings for the current month
 * @returns {number} Monthly earnings
 */
function calculateMonthlyEarnings() {
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  
  return state.tasks
    .filter(task => {
      const taskDate = new Date(task.date);
      return task.status === 'Done' &&
             taskDate.getMonth() === currentMonth &&
             taskDate.getFullYear() === currentYear;
    })
    .reduce((sum, task) => sum + task.amount, 0);
}

/**
 * Update the earnings display
 */
function updateEarningsDisplay() {
  const totalEarnings = calculateTotalEarnings();
  animateNumber(elements.totalEarnings, totalEarnings);
}

// ============================================
// Target Progress
// ============================================

/**
 * Update the target progress display
 */
function updateProgressDisplay() {
  if (state.monthlyTarget > 0) {
    elements.targetInputWrapper.classList.remove('active');
    elements.progressContainer.classList.add('active');
    
    const earned = calculateMonthlyEarnings();
    const percentage = Math.min(100, (earned / state.monthlyTarget) * 100);
    
    elements.earnedAmount.textContent = formatCurrency(earned);
    elements.targetAmount.textContent = formatCurrency(state.monthlyTarget);
    elements.progressPercentage.textContent = Math.round(percentage) + '%';
    
    // Animate progress bar
    setTimeout(() => {
      elements.progressFill.style.width = percentage + '%';
    }, 100);
  } else {
    elements.targetInputWrapper.classList.add('active');
    elements.progressContainer.classList.remove('active');
  }
}

/**
 * Handle saving the monthly target
 */
function handleSaveTarget() {
  const value = parseFloat(elements.targetInput.value) || 0;
  if (value > 0) {
    state.monthlyTarget = value;
    saveTarget();
    updateProgressDisplay();
  }
}

/**
 * Handle editing the target
 */
function handleEditTarget() {
  elements.targetInput.value = state.monthlyTarget;
  elements.targetInputWrapper.classList.add('active');
  elements.progressContainer.classList.remove('active');
  elements.targetInput.focus();
}

// ============================================
// Calendar Functions
// ============================================

/**
 * Get dates that have completed tasks
 * @returns {Set} Set of date strings with completed tasks
 */
function getDatesWithTasks() {
  const dates = new Set();
  state.tasks.forEach(task => {
    if (task.status === 'Done') {
      dates.add(task.date);
    }
  });
  return dates;
}

/**
 * Render the calendar
 */
function renderCalendar() {
  const year = state.currentYear;
  const month = state.currentMonth;
  
  elements.calendarTitle.textContent = `${getMonthName(month)} ${year}`;
  
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startingDay = firstDay.getDay();
  const totalDays = lastDay.getDate();
  
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const datesWithTasks = getDatesWithTasks();
  
  let html = '';
  
  // Previous month's days
  const prevMonthLastDay = new Date(year, month, 0).getDate();
  for (let i = startingDay - 1; i >= 0; i--) {
    const day = prevMonthLastDay - i;
    html += `<button class="calendar-day other-month" disabled>${day}</button>`;
  }
  
  // Current month's days
  for (let day = 1; day <= totalDays; day++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const isToday = dateStr === todayStr;
    const isSelected = state.selectedDate === dateStr;
    const hasTasks = datesWithTasks.has(dateStr);
    
    let classes = 'calendar-day';
    if (isToday) classes += ' today';
    if (isSelected) classes += ' selected';
    if (hasTasks) classes += ' has-tasks';
    
    html += `<button class="${classes}" data-date="${dateStr}">${day}</button>`;
  }
  
  // Next month's days
  const remainingDays = 42 - (startingDay + totalDays);
  for (let day = 1; day <= remainingDays; day++) {
    html += `<button class="calendar-day other-month" disabled>${day}</button>`;
  }
  
  elements.calendarDays.innerHTML = html;
  
  // Add click listeners to calendar days
  elements.calendarDays.querySelectorAll('.calendar-day:not(.other-month)').forEach(btn => {
    btn.addEventListener('click', () => handleDateClick(btn.dataset.date));
  });
}

/**
 * Handle calendar date click
 * @param {string} dateStr - The clicked date string
 */
function handleDateClick(dateStr) {
  if (state.selectedDate === dateStr) {
    // Deselect if clicking the same date
    state.selectedDate = null;
    elements.selectedDateInfo.classList.remove('active');
  } else {
    state.selectedDate = dateStr;
    elements.selectedDateDisplay.textContent = formatDate(dateStr);
    elements.selectedDateInfo.classList.add('active');
  }
  
  renderCalendar();
  renderTasks();
}

/**
 * Handle previous month navigation
 */
function handlePrevMonth() {
  state.currentMonth--;
  if (state.currentMonth < 0) {
    state.currentMonth = 11;
    state.currentYear--;
  }
  saveCalendarState();
  renderCalendar();
}

/**
 * Handle next month navigation
 */
function handleNextMonth() {
  state.currentMonth++;
  if (state.currentMonth > 11) {
    state.currentMonth = 0;
    state.currentYear++;
  }
  saveCalendarState();
  renderCalendar();
}

/**
 * Clear date filter
 */
function handleClearDateFilter() {
  state.selectedDate = null;
  elements.selectedDateInfo.classList.remove('active');
  renderCalendar();
  renderTasks();
}

// ============================================
// Task Management
// ============================================

/**
 * Get filtered tasks based on current filters
 * @returns {Array} Filtered tasks
 */
function getFilteredTasks() {
  let filtered = [...state.tasks];
  
  // Filter by date if selected
  if (state.selectedDate) {
    filtered = filtered.filter(task => task.date === state.selectedDate);
  }
  
  // Filter by status
  if (state.currentFilter !== 'all') {
    const statusMap = {
      'done': 'Done',
      'in-progress': 'In Progress',
      'not-done': 'Not Done'
    };
    filtered = filtered.filter(task => task.status === statusMap[state.currentFilter]);
  }
  
  // Sort by date (most recent first)
  filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
  
  return filtered;
}

/**
 * Render the tasks list
 */
function renderTasks() {
  const filteredTasks = getFilteredTasks();
  
  if (filteredTasks.length === 0) {
    elements.tasksList.style.display = 'none';
    elements.emptyState.classList.add('active');
    return;
  }
  
  elements.tasksList.style.display = 'flex';
  elements.emptyState.classList.remove('active');
  
  const html = filteredTasks.map(task => {
    const statusClass = task.status.toLowerCase().replace(' ', '-');
    return `
      <div class="task-card" data-id="${task.id}">
        <div class="task-header">
          <div class="task-info">
            <h4>${escapeHtml(task.projectName)}</h4>
            <p>${escapeHtml(task.clientName)}</p>
          </div>
          <div class="task-actions">
            <button class="btn-icon edit-task" data-id="${task.id}" aria-label="Edit task">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
            </button>
            <button class="btn-icon delete-task" data-id="${task.id}" aria-label="Delete task">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
            </button>
          </div>
        </div>
        <div class="task-meta">
          <span class="task-badge type">${escapeHtml(task.workType)}</span>
          <span class="task-badge status-${statusClass}">${escapeHtml(task.status)}</span>
        </div>
        <div class="task-footer">
          <span class="task-amount">${formatCurrency(task.amount)}</span>
          <span class="task-date">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
            ${formatDate(task.date)}
          </span>
        </div>
      </div>
    `;
  }).join('');
  
  elements.tasksList.innerHTML = html;
  
  // Add event listeners for edit and delete buttons
  elements.tasksList.querySelectorAll('.edit-task').forEach(btn => {
    btn.addEventListener('click', () => handleEditTask(btn.dataset.id));
  });
  
  elements.tasksList.querySelectorAll('.delete-task').forEach(btn => {
    btn.addEventListener('click', () => handleDeleteTask(btn.dataset.id));
  });
}

/**
 * Escape HTML to prevent XSS
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Handle filter button click
 * @param {string} filter - The filter to apply
 */
function handleFilterChange(filter) {
  state.currentFilter = filter;
  
  elements.filterBtns.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.filter === filter);
  });
  
  renderTasks();
}

// ============================================
// Modal Functions
// ============================================

/**
 * Open the task modal
 * @param {boolean} isEdit - Whether this is an edit operation
 */
function openModal(isEdit = false) {
  elements.modalTitle.textContent = isEdit ? 'Edit Task' : 'Add New Task';
  elements.taskModal.classList.add('active');
  
  if (!isEdit) {
    elements.taskForm.reset();
    elements.taskId.value = '';
    // Set default date to today or selected date
    elements.taskDate.value = state.selectedDate || new Date().toISOString().split('T')[0];
  }
  
  // Focus on first input
  setTimeout(() => {
    elements.clientName.focus();
  }, 100);
}

/**
 * Close the task modal
 */
function closeModal() {
  elements.taskModal.classList.remove('active');
  state.editingTaskId = null;
  elements.taskForm.reset();
}

/**
 * Handle form submission
 * @param {Event} e - The submit event
 */
function handleFormSubmit(e) {
  e.preventDefault();
  
  const taskData = {
    id: elements.taskId.value || generateId(),
    clientName: elements.clientName.value.trim(),
    projectName: elements.projectName.value.trim(),
    workType: elements.workType.value,
    amount: parseFloat(elements.amount.value) || 0,
    status: elements.status.value,
    date: elements.taskDate.value
  };
  
  if (state.editingTaskId) {
    // Update existing task
    const index = state.tasks.findIndex(t => t.id === state.editingTaskId);
    if (index !== -1) {
      state.tasks[index] = taskData;
    }
  } else {
    // Add new task
    state.tasks.push(taskData);
  }
  
  saveTasks();
  closeModal();
  renderAll();
}

/**
 * Handle editing a task
 * @param {string} id - The task ID to edit
 */
function handleEditTask(id) {
  const task = state.tasks.find(t => t.id === id);
  if (!task) return;
  
  state.editingTaskId = id;
  
  elements.taskId.value = task.id;
  elements.clientName.value = task.clientName;
  elements.projectName.value = task.projectName;
  elements.workType.value = task.workType;
  elements.amount.value = task.amount;
  elements.status.value = task.status;
  elements.taskDate.value = task.date;
  
  openModal(true);
}

/**
 * Handle deleting a task
 * @param {string} id - The task ID to delete
 */
function handleDeleteTask(id) {
  if (confirm('Are you sure you want to delete this task?')) {
    state.tasks = state.tasks.filter(t => t.id !== id);
    saveTasks();
    renderAll();
  }
}

// ============================================
// Render All Function
// ============================================

/**
 * Render all components
 */
function renderAll() {
  updateEarningsDisplay();
  updateProgressDisplay();
  renderCalendar();
  renderTasks();
}

// ============================================
// Event Listeners
// ============================================

function initEventListeners() {
  // Target section
  elements.saveTargetBtn.addEventListener('click', handleSaveTarget);
  elements.editTargetBtn.addEventListener('click', handleEditTarget);
  elements.targetInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleSaveTarget();
  });
  
  // Calendar navigation
  elements.prevMonth.addEventListener('click', handlePrevMonth);
  elements.nextMonth.addEventListener('click', handleNextMonth);
  elements.clearDateFilter.addEventListener('click', handleClearDateFilter);
  
  // Task filters
  elements.filterBtns.forEach(btn => {
    btn.addEventListener('click', () => handleFilterChange(btn.dataset.filter));
  });
  
  // Modal
  elements.addTaskBtn.addEventListener('click', () => openModal(false));
  elements.closeModal.addEventListener('click', closeModal);
  elements.cancelBtn.addEventListener('click', closeModal);
  elements.taskForm.addEventListener('submit', handleFormSubmit);
  
  // Close modal on overlay click
  elements.taskModal.addEventListener('click', (e) => {
    if (e.target === elements.taskModal) closeModal();
  });
  
  // Close modal on escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && elements.taskModal.classList.contains('active')) {
      closeModal();
    }
  });
}

// ============================================
// Initialize Application
// ============================================

function init() {
  loadFromStorage();
  initEventListeners();
  renderAll();
}

// Start the application when DOM is ready
document.addEventListener('DOMContentLoaded', init);
