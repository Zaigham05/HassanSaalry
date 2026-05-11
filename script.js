/**
 * SpendWise - Core Logic
 * Handles state, local storage, multi-view navigation, and smart filtering.
 */

class SpendWise {
    constructor() {
        this.transactions = JSON.parse(localStorage.getItem('transactions')) || [];
        this.budget = parseFloat(localStorage.getItem('monthlyBudget')) || 0;
        
        const defaultCategories = {
            Salary: { icon: 'banknote', color: '#00ff88' },
            Food: { icon: 'utensils', color: '#ffb703' },
            Transport: { icon: 'car', color: '#00e5ff' },
            Housing: { icon: 'home', color: '#7000ff' },
            Tech: { icon: 'cpu', color: '#ff4d6d' },
            Entertainment: { icon: 'clapperboard', color: '#ff00ff' },
            Debt: { icon: 'landmark', color: '#94a3b8' },
            Other: { icon: 'help-circle', color: '#94a3b8' }
        };
        this.categories = JSON.parse(localStorage.getItem('categories')) || defaultCategories;

        // Load Settings
        this.settings = JSON.parse(localStorage.getItem('settings')) || {
            username: 'Mr Hacker',
            accent: '#00e5ff'
        };

        this.editingId = null;
        this.editingCategoryId = null;
        
        this.init();
    }

    init() {
        this.cacheDOM();
        this.bindEvents();
        this.initCharts();
        this.applySettings();
        this.updatePeriodSelector();
        this.updateTransactionFormCategories();
        this.updateUI();
    }

    cacheDOM() {
        // Modals
        this.expenseModal = document.getElementById('expense-modal');
        this.budgetModal = document.getElementById('budget-modal');
        this.categoryModal = document.getElementById('category-modal');
        this.confirmModal = document.getElementById('confirm-modal');
        
        // Buttons
        this.addExpenseBtn = document.getElementById('add-expense-btn');
        this.addCategoryBtn = document.getElementById('add-category-btn');
        this.closeModalBtns = document.querySelectorAll('.close-modal');
        
        // Forms
        this.transactionForm = document.getElementById('transaction-form');
        this.budgetForm = document.getElementById('budget-form');
        this.categoryForm = document.getElementById('category-form');
        
        // Lists
        this.transactionList = document.getElementById('recent-transaction-list');
        this.fullTransactionList = document.getElementById('full-transaction-list');
        this.categoryListEl = document.getElementById('category-list');
        
        // Form Elements
        this.modalTitle = this.expenseModal.querySelector('h2');
        this.submitBtn = this.transactionForm.querySelector('.btn-submit');
        this.categoryModalTitle = document.getElementById('category-modal-title');
        this.categorySubmitBtn = document.getElementById('category-submit-btn');
        
        // Navigation & Filtering
        this.navLinks = document.querySelectorAll('.nav-link');
        this.views = document.querySelectorAll('.view');
        this.viewAllBtn = document.getElementById('view-all-transactions');
        this.monthSelector = document.getElementById('global-month-selector');
        this.searchField = document.getElementById('transaction-search');
        this.filterCategory = document.getElementById('filter-category');
        this.filterType = document.getElementById('filter-type');
        this.exportCsvBtn = document.getElementById('export-csv');
        this.exportPdfBtn = document.getElementById('export-pdf');
        
        // Stat Elements
        this.totalIncomeEl = document.getElementById('total-income');
        this.totalBudgetEl = document.getElementById('total-budget');
        this.totalSpentEl = document.getElementById('total-spent');
        this.debtBalanceEl = document.getElementById('debt-balance');
        this.spentPercentageEl = document.getElementById('spent-percentage');
        this.debtStatusEl = document.getElementById('debt-status');
        this.budgetCard = document.getElementById('budget-card');
    }

    bindEvents() {
        // Sidebar Navigation
        this.navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const viewName = link.id.replace('nav-', '');
                this.switchView(viewName);
            });
        });

        this.viewAllBtn.addEventListener('click', (e) => {
            e.preventDefault();
            this.switchView('transactions');
        });

        // Export Events
        this.exportCsvBtn.addEventListener('click', () => this.exportToCSV());
        this.exportPdfBtn.addEventListener('click', () => this.exportToPDF());

        // Global Filters
        this.monthSelector.addEventListener('change', () => this.updateUI());
        
        [this.searchField, this.filterCategory, this.filterType].forEach(el => {
            if (el) el.addEventListener('input', () => this.renderFullTransactions());
        });

        // Smart Calculator Listener
        const amountInput = document.getElementById('amount');
        const calcResult = document.getElementById('calc-result');
        amountInput.addEventListener('input', (e) => {
            const val = e.target.value;
            if (/[+\-*/]/.test(val)) {
                try {
                    // Safe evaluation of simple math
                    const result = Function(`'use strict'; return (${val})`)();
                    if (!isNaN(result) && isFinite(result)) {
                        calcResult.textContent = `= ${this.formatCurrency(result)}`;
                    } else {
                        calcResult.textContent = '';
                    }
                } catch {
                    calcResult.textContent = '';
                }
            } else {
                calcResult.textContent = '';
            }
        });

        // Icon Picker Events
        document.getElementById('open-icon-picker').addEventListener('click', () => this.toggleModal(document.getElementById('icon-picker-modal'), true));
        document.getElementById('close-icon-picker').addEventListener('click', () => this.toggleModal(document.getElementById('icon-picker-modal'), false));
        document.getElementById('icon-search').addEventListener('input', (e) => this.renderIconPicker(e.target.value));

        // Modal Toggles
        this.addExpenseBtn.addEventListener('click', () => {
            this.editingId = null;
            this.modalTitle.textContent = 'Add New Transaction';
            this.submitBtn.textContent = 'Add Transaction';
            this.transactionForm.reset();
            this.toggleModal(this.expenseModal, true);
        });

        this.addCategoryBtn.addEventListener('click', () => {
            this.editingCategoryId = null;
            this.categoryModalTitle.textContent = 'Add New Category';
            this.categorySubmitBtn.textContent = 'Add Category';
            this.categoryForm.reset();
            this.toggleModal(this.categoryModal, true);
        });
        
        this.closeModalBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                this.toggleModal(this.expenseModal, false);
                this.toggleModal(this.budgetModal, false);
                this.toggleModal(this.categoryModal, false);
            });
        });

        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.toggleModal(e.target, false);
            }
        });

        // Form Submissions
        this.transactionForm.addEventListener('submit', (e) => this.handleAddTransaction(e));
        this.budgetForm.addEventListener('submit', (e) => this.handleSetBudget(e));
        this.categoryForm.addEventListener('submit', (e) => this.handleCategorySubmit(e));

        this.budgetCard.addEventListener('click', () => this.toggleModal(this.budgetModal, true));
    }

    // --- Core Logic & Data ---

    getFilteredTransactions(forMonthOnly = false) {
        const selectedPeriod = this.monthSelector.value;
        
        // 1. Filter by Month
        let filtered = this.transactions.filter(t => {
            const tPeriod = new Date(t.date).toLocaleDateString('en-PK', { month: 'long', year: 'numeric' });
            return tPeriod === selectedPeriod;
        });

        // 2. Filter by Search/Category/Type (only for full list)
        if (!forMonthOnly) {
            const search = (this.searchField?.value || '').toLowerCase();
            const cat = this.filterCategory?.value || 'all';
            const type = this.filterType?.value || 'all';

            filtered = filtered.filter(t => {
                const matchesSearch = !search || 
                    (t.note && t.note.toLowerCase().includes(search)) || 
                    t.category.toLowerCase().includes(search);
                const matchesCat = cat === 'all' || t.category === cat;
                const matchesType = type === 'all' || t.type === type;
                return matchesSearch && matchesCat && matchesType;
            });
        }

        return filtered;
    }

    updateUI() {
        this.updatePeriodSelector(); 
        const monthlyData = this.getFilteredTransactions(true);

        // Dynamic Greeting
        const hour = new Date().getHours();
        const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';
        document.getElementById('user-greeting').textContent = `${greeting}, Mr Hacker!`;
        document.getElementById('current-date-display').textContent = new Date().toLocaleDateString('en-PK', { weekday: 'long', day: 'numeric', month: 'long' });

        // Calculations
        const totalIncome = monthlyData.filter(t => t.type === 'Income').reduce((s, t) => s + t.amount, 0);
        const totalSpent = monthlyData.filter(t => t.type === 'Expense').reduce((s, t) => s + t.amount, 0);
        const totalLent = monthlyData.filter(t => t.type === 'Lend').reduce((s, t) => s + t.amount, 0);
        const totalRepaid = monthlyData.filter(t => t.type === 'Repay').reduce((s, t) => s + t.amount, 0);

        const debtBalance = totalLent - totalRepaid;
        const spentPercent = this.budget > 0 ? (totalSpent / this.budget) * 100 : 0;

        // Display Stats
        this.totalIncomeEl.textContent = this.formatCurrency(totalIncome);
        this.totalBudgetEl.textContent = this.formatCurrency(this.budget);
        this.totalSpentEl.textContent = this.formatCurrency(totalSpent);
        this.debtBalanceEl.textContent = this.formatCurrency(debtBalance);
        this.spentPercentageEl.textContent = `${spentPercent.toFixed(1)}% of budget`;
        this.debtStatusEl.textContent = debtBalance > 0 ? 'Outstanding Lends' : 'No active lends';

        // Update Lists & Charts
        this.renderTransactions();
        this.renderFullTransactions();
        this.updateCharts(monthlyData);
        
        if (window.lucide) lucide.createIcons();
    }

    // --- Views & Rendering ---

    switchView(viewName) {
        this.navLinks.forEach(link => link.classList.toggle('active', link.id === `nav-${viewName}`));
        this.views.forEach(view => view.classList.toggle('active', view.id === `view-${viewName}`));

        // Update Header Title
        const titles = {
            dashboard: 'Financial Dashboard',
            transactions: 'Transaction Vault',
            categories: 'Category Management',
            analytics: 'Spending Heatmap',
            settings: 'System Settings'
        };
        document.getElementById('active-view-title').textContent = titles[viewName] || 'SpendWise';

        if (viewName === 'transactions') this.renderFullTransactions();
        if (viewName === 'categories') this.renderCategories();
        if (viewName === 'analytics') this.renderHeatmap();
    }

    renderTransactions() {
        const transactions = this.getFilteredTransactions(true).slice(0, 10);
        
        if (transactions.length === 0) {
            this.transactionList.innerHTML = '<div class="empty-state"><p>No records for this month.</p></div>';
            return;
        }

        this.transactionList.innerHTML = transactions.map(t => this.createTransactionHTML(t)).join('');
    }

    renderFullTransactions() {
        const list = document.getElementById('full-transaction-list');
        const countEl = document.getElementById('transaction-count');
        const filtered = this.getFilteredTransactions();
        
        if (countEl) countEl.textContent = `Found ${filtered.length} records`;

        if (filtered.length === 0) {
            this.fullTransactionList.innerHTML = '<div class="empty-state"><p>No matching transactions found.</p></div>';
            return;
        }

        this.fullTransactionList.innerHTML = filtered.map(t => this.createTransactionHTML(t)).join('');
        if (window.lucide) lucide.createIcons();
    }

    createTransactionHTML(t) {
        const cat = this.categories[t.category] || this.categories.Other;
        const isOut = t.type === 'Expense' || t.type === 'Lend';
        return `
            <div class="transaction-item">
                <div class="item-left">
                    <div class="item-icon" style="background: ${cat.color}20; color: ${cat.color}">
                        <i data-lucide="${cat.icon}"></i>
                    </div>
                    <div class="item-info">
                        <h4>${t.note || t.category}</h4>
                        <p>${new Date(t.date).toLocaleDateString('en-PK', { month: 'short', day: 'numeric' })} • ${t.type}</p>
                    </div>
                </div>
                <div class="item-right">
                    <div class="item-actions">
                        <button class="action-btn edit" onclick="app.editTransaction(${t.id})"><i data-lucide="edit-3"></i></button>
                        <button class="action-btn delete" onclick="app.deleteTransaction(${t.id})"><i data-lucide="trash-2"></i></button>
                    </div>
                    <p class="item-amount ${isOut ? 'negative' : 'positive'}">${isOut ? '-' : '+'}${this.formatCurrency(t.amount)}</p>
                </div>
            </div>
        `;
    }

    renderCategories() {
        this.categoryListEl.innerHTML = Object.entries(this.categories).map(([name, data]) => `
            <div class="category-item glass">
                <div class="cat-actions">
                    <button class="action-btn edit" onclick="app.editCategory('${name}')"><i data-lucide="edit-3"></i></button>
                    <button class="action-btn delete" onclick="app.deleteCategory('${name}')"><i data-lucide="trash-2"></i></button>
                </div>
                <div class="cat-icon-large" style="background: ${data.color}20; color: ${data.color}">
                    <i data-lucide="${data.icon}"></i>
                </div>
                <div class="cat-info"><h3>${name}</h3></div>
            </div>
        `).join('');
        if (window.lucide) lucide.createIcons();
    }

    // --- Charting ---

    initCharts() {
        const trendsCtx = document.getElementById('trendsChart').getContext('2d');
        const categoryCtx = document.getElementById('categoryChart').getContext('2d');

        this.trendsChart = new Chart(trendsCtx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [
                    { label: 'Income', data: [], borderColor: '#00ff88', backgroundColor: 'rgba(0, 255, 136, 0.1)', fill: true, tension: 0.4, borderWidth: 3, pointRadius: 2 },
                    { label: 'Expense', data: [], borderColor: '#ff4d6d', backgroundColor: 'rgba(255, 77, 109, 0.1)', fill: true, tension: 0.4, borderWidth: 3, pointRadius: 2 }
                ]
            },
            options: { 
                responsive: true, 
                maintainAspectRatio: false, 
                plugins: { 
                    legend: { display: false },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        backgroundColor: 'rgba(15, 23, 42, 0.9)',
                        titleColor: '#fff',
                        bodyColor: '#94a3b8',
                        borderColor: 'rgba(255, 255, 255, 0.1)',
                        borderWidth: 1,
                        padding: 12,
                        callbacks: {
                            label: (context) => {
                                let label = context.dataset.label || '';
                                if (label) label += ': ';
                                if (context.parsed.y !== null) label += this.formatCurrency(context.parsed.y);
                                return label;
                            },
                            title: (tooltipItems) => {
                                return `Date: ${tooltipItems[0].label} ${this.monthSelector.value}`;
                            }
                        }
                    }
                },
                scales: {
                    y: { 
                        beginAtZero: true,
                        grid: { color: 'rgba(255,255,255,0.05)', drawBorder: false }, 
                        ticks: { color: '#94a3b8', font: { size: 10 } } 
                    },
                    x: { 
                        grid: { display: false }, 
                        ticks: { color: '#94a3b8', font: { size: 10 }, maxRotation: 0 } 
                    }
                }
            }
        });

        this.categoryChart = new Chart(categoryCtx, {
            type: 'doughnut',
            data: { labels: [], datasets: [{ data: [], backgroundColor: [], borderWidth: 0 }] },
            options: { responsive: true, maintainAspectRatio: false, cutout: '75%' }
        });
    }

    updateCharts(data) {
        if (!this.trendsChart || !this.categoryChart) return;

        // 1. Category Chart
        const catMap = {};
        data.filter(t => t.type === 'Expense').forEach(t => catMap[t.category] = (catMap[t.category] || 0) + t.amount);
        
        this.categoryChart.data.labels = Object.keys(catMap);
        this.categoryChart.data.datasets[0].data = Object.values(catMap);
        this.categoryChart.data.datasets[0].backgroundColor = Object.keys(catMap).map(c => this.categories[c]?.color || '#94a3b8');
        this.categoryChart.update();

        // 2. Trends Chart (Every single day of the selected month)
        const selectedPeriod = this.monthSelector.value; // e.g. "May 2026"
        const [monthName, year] = selectedPeriod.split(' ');
        
        const monthIndex = new Date(`${monthName} 1, ${year}`).getMonth();
        const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
        
        const labels = [];
        const incomeData = [];
        const expenseData = [];

        for (let day = 1; day <= daysInMonth; day++) {
            const dateObj = new Date(year, monthIndex, day);
            const dateStr = dateObj.toISOString().split('T')[0];
            
            labels.push(day); // Show day number for clarity on mobile
            
            const dayIncome = data
                .filter(t => t.date === dateStr && t.type === 'Income')
                .reduce((s, t) => s + t.amount, 0);
            const dayExpense = data
                .filter(t => t.type === 'Expense')
                .reduce((s, t) => s + t.amount, 0);

            incomeData.push(dayIncome);
            expenseData.push(dayExpense);
        }

        this.trendsChart.data.labels = labels;
        this.trendsChart.data.datasets[0].data = incomeData;
        this.trendsChart.data.datasets[1].data = expenseData;
        this.trendsChart.update();
    }

    // --- Helper Methods ---

    updatePeriodSelector() {
        const months = [];
        this.transactions.forEach(t => {
            const period = new Date(t.date).toLocaleDateString('en-PK', { month: 'long', year: 'numeric' });
            if (!months.includes(period)) months.push(period);
        });

        const currentPeriod = new Date().toLocaleDateString('en-PK', { month: 'long', year: 'numeric' });
        if (!months.includes(currentPeriod)) months.unshift(currentPeriod);

        const currentSelection = this.monthSelector.value;
        this.monthSelector.innerHTML = months.map(m => `<option value="${m}">${m}</option>`).join('');
        if (currentSelection && months.includes(currentSelection)) this.monthSelector.value = currentSelection;
        else this.monthSelector.value = currentPeriod;
    }

    updateTransactionFormCategories() {
        const catSelect = document.getElementById('category');
        const filterSelect = document.getElementById('filter-category');
        
        const options = Object.keys(this.categories).map(name => `<option value="${name}">${name}</option>`).join('');
        
        if (catSelect) catSelect.innerHTML = options;
        if (filterSelect) {
            const currentFilter = filterSelect.value;
            filterSelect.innerHTML = '<option value="all">All Categories</option>' + options;
            filterSelect.value = currentFilter || 'all';
        }
    }

    toggleModal(modal, show) {
        modal.style.display = show ? 'flex' : 'none';
        if (show && modal === this.expenseModal && !this.editingId) document.getElementById('date').valueAsDate = new Date();
    }

    handleAddTransaction(e) {
        e.preventDefault();
        
        let amountVal = document.getElementById('amount').value;
        // Evaluate if it's a math expression
        try {
            if (/[+\-*/]/.test(amountVal)) {
                amountVal = Function(`'use strict'; return (${amountVal})`)();
            } else {
                amountVal = parseFloat(amountVal);
            }
        } catch {
            amountVal = parseFloat(amountVal);
        }

        const t = {
            id: this.editingId || Date.now(),
            type: document.getElementById('type').value,
            amount: amountVal,
            category: document.getElementById('category').value,
            date: document.getElementById('date').value,
            note: document.getElementById('note').value
        };

        if (this.editingId) {
            const index = this.transactions.findIndex(item => item.id === this.editingId);
            if (index !== -1) this.transactions[index] = t;
        } else {
            this.transactions.unshift(t);
        }

        this.saveAndRefresh();
        this.toggleModal(this.expenseModal, false);
    }

    handleCategorySubmit(e) {
        e.preventDefault();
        const name = document.getElementById('cat-name').value;
        const icon = document.getElementById('cat-icon').value;
        const color = document.getElementById('cat-color').value;

        if (this.editingCategoryId && this.editingCategoryId !== name) delete this.categories[this.editingCategoryId];
        this.categories[name] = { icon, color };
        
        localStorage.setItem('categories', JSON.stringify(this.categories));
        this.renderCategories();
        this.updateTransactionFormCategories();
        this.toggleModal(this.categoryModal, false);
    }

    handleSetBudget(e) {
        e.preventDefault();
        this.budget = parseFloat(document.getElementById('budget-amount').value);
        localStorage.setItem('monthlyBudget', this.budget);
        this.updateUI();
        this.toggleModal(this.budgetModal, false);
    }

    editTransaction(id) {
        const t = this.transactions.find(item => item.id === id);
        if (!t) return;
        this.editingId = id;
        this.modalTitle.textContent = 'Edit Transaction';
        document.getElementById('type').value = t.type;
        document.getElementById('amount').value = t.amount;
        document.getElementById('category').value = t.category;
        document.getElementById('date').value = t.date;
        document.getElementById('note').value = t.note;
        this.toggleModal(this.expenseModal, true);
    }

    deleteTransaction(id) {
        this.confirmDialog('Are you sure you want to delete this transaction?').then(ok => {
            if (ok) {
                this.transactions = this.transactions.filter(t => t.id !== id);
                this.saveAndRefresh();
            }
        });
    }

    saveAndRefresh() {
        localStorage.setItem('transactions', JSON.stringify(this.transactions));
        this.updateUI();
    }

    confirmDialog(message) {
        return new Promise(resolve => {
            const modal = document.getElementById('confirm-modal');
            document.getElementById('confirm-message').textContent = message;
            modal.style.display = 'flex';
            const cleanup = (res) => {
                modal.style.display = 'none';
                document.getElementById('confirm-ok').onclick = null;
                document.getElementById('confirm-cancel').onclick = null;
                resolve(res);
            };
            document.getElementById('confirm-ok').onclick = () => cleanup(true);
            document.getElementById('confirm-cancel').onclick = () => cleanup(false);
        });
    }

    formatCurrency(amount) {
        return new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', minimumFractionDigits: 0 }).format(amount);
    }

    // --- Export Logic ---

    exportToCSV() {
        const data = this.getFilteredTransactions();
        if (data.length === 0) return alert('No data to export!');

        const headers = ['Date', 'Type', 'Category', 'Amount (PKR)', 'Note'];
        const csvRows = [headers.join(',')];

        data.forEach(t => {
            const row = [
                t.date,
                t.type,
                t.category,
                t.amount,
                `"${(t.note || '').replace(/"/g, '""')}"`
            ];
            csvRows.push(row.join(','));
        });

        const csvContent = csvRows.join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        link.setAttribute('href', url);
        link.setAttribute('download', `SpendWise_Report_${this.monthSelector.value}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    async exportToPDF() {
        const { jsPDF } = window.jspdf;
        const data = this.getFilteredTransactions();
        if (data.length === 0) return alert('No data to export!');

        const doc = new jsPDF();
        const period = this.monthSelector.value;

        // Header
        doc.setFontSize(22);
        doc.setTextColor(0, 229, 255); // Cyan
        doc.text('SpendWise Financial Report', 14, 20);
        
        doc.setFontSize(12);
        doc.setTextColor(100);
        doc.text(`Period: ${period}`, 14, 30);
        doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 38);

        // Summary Box
        const monthlyData = this.getFilteredTransactions(true);
        const income = monthlyData.filter(t => t.type === 'Income').reduce((s, t) => s + t.amount, 0);
        const expense = monthlyData.filter(t => t.type === 'Expense').reduce((s, t) => s + t.amount, 0);

        doc.setDrawColor(200);
        doc.line(14, 45, 196, 45);
        
        doc.setFontSize(14);
        doc.setTextColor(0);
        doc.text('Monthly Summary', 14, 55);
        
        doc.setFontSize(11);
        doc.text(`Total Income: ${this.formatCurrency(income)}`, 14, 65);
        doc.text(`Total Expenses: ${this.formatCurrency(expense)}`, 14, 72);
        doc.text(`Net Savings: ${this.formatCurrency(income - expense)}`, 14, 79);

        // Table
        const tableData = data.map(t => [
            t.date,
            t.type,
            t.category,
            this.formatCurrency(t.amount),
            t.note || '-'
        ]);

        doc.autoTable({
            startY: 90,
            head: [['Date', 'Type', 'Category', 'Amount', 'Note']],
            body: tableData,
            theme: 'striped',
            headStyles: { fillColor: [112, 0, 255] }, // Purple
            alternateRowStyles: { fillColor: [245, 245, 255] }
        });

        doc.save(`SpendWise_Report_${period}.pdf`);
    }
    // --- New Features Logic ---

    renderHeatmap() {
        const container = document.getElementById('heatmap-container');
        const selectedPeriod = this.monthSelector.value;
        const [monthName, year] = selectedPeriod.split(' ');
        const monthIndex = new Date(`${monthName} 1, ${year}`).getMonth();
        const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
        const firstDay = new Date(year, monthIndex, 1).getDay();

        let html = '';
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        
        // Headers
        dayNames.forEach(day => html += `<div class="calendar-header" style="text-align:center; font-weight:700; color:var(--primary); font-size:0.8rem;">${day}</div>`);

        // Empty days
        for (let i = 0; i < firstDay; i++) html += '<div class="calendar-day empty"></div>';

        // Calculate Max Spend for scaling
        const dailyTotals = {};
        this.transactions
            .filter(t => t.type === 'Expense' && new Date(t.date).toLocaleDateString('en-PK', { month: 'long', year: 'numeric' }) === selectedPeriod)
            .forEach(t => dailyTotals[t.date] = (dailyTotals[t.date] || 0) + t.amount);
        
        const maxSpend = Math.max(...Object.values(dailyTotals), 1);

        // Render Days
        for (let day = 1; day <= daysInMonth; day++) {
            const dateObj = new Date(year, monthIndex, day);
            const dateStr = dateObj.toISOString().split('T')[0];
            const amount = dailyTotals[dateStr] || 0;
            
            let level = 0;
            if (amount > 0) {
                const ratio = amount / maxSpend;
                level = ratio > 0.75 ? 4 : ratio > 0.5 ? 3 : ratio > 0.25 ? 2 : 1;
            }

            html += `
                <div class="calendar-day level-${level} ${amount > 0 ? 'has-spend' : ''}" title="${amount > 0 ? this.formatCurrency(amount) : 'No spending'}">
                    <span class="day-num">${day}</span>
                    ${amount > 0 ? `<span class="day-amount">${(amount/1000).toFixed(1)}k</span>` : ''}
                </div>
            `;
        }

        container.innerHTML = html;
    }

    renderIconPicker(query = '') {
        const grid = document.getElementById('icon-grid');
        const commonIcons = [
            'home', 'utensils', 'car', 'shopping-cart', 'briefcase', 'gift', 
            'heart', 'coffee', 'bus', 'plane', 'smartphone', 'laptop', 
            'book', 'music', 'tv', 'gamepad', 'dumbbell', 'stethoscop',
            'droplets', 'zap', 'wifi', 'banknote', 'credit-card', 'wallet',
            'shopping-bag', 'package', 'truck', 'tool', 'hammer', 'wrench'
        ];

        const filtered = commonIcons.filter(icon => icon.includes(query.toLowerCase()));
        
        grid.innerHTML = filtered.map(icon => `
            <div class="icon-item-pick" onclick="app.selectIcon('${icon}')" title="${icon}">
                <i data-lucide="${icon}"></i>
            </div>
        `).join('');
        
        if (window.lucide) lucide.createIcons();
    }

    selectIcon(icon) {
        document.getElementById('cat-icon').value = icon;
        this.toggleModal(document.getElementById('icon-picker-modal'), false);
    }

    // --- Command Center (Settings) Logic ---

    applySettings() {
        // Apply Profile
        document.getElementById('user-greeting').textContent = `Good Afternoon, ${this.settings.username}!`;
        document.querySelector('.user-name').textContent = this.settings.username;
        document.querySelector('.avatar').textContent = this.settings.username.split(' ').map(n => n[0]).join('').toUpperCase();
        document.getElementById('settings-username').value = this.settings.username;

        // Apply Accent
        document.documentElement.style.setProperty('--primary', this.settings.accent);
        document.querySelectorAll('.color-swatch').forEach(sw => {
            sw.classList.toggle('active', sw.style.backgroundColor === this.settings.accent);
        });
    }

    updateProfile() {
        const newName = document.getElementById('settings-username').value;
        if (!newName) return;
        this.settings.username = newName;
        localStorage.setItem('settings', JSON.stringify(this.settings));
        this.applySettings();
        alert('Profile updated successfully!');
    }

    setAccent(color, el) {
        this.settings.accent = color;
        localStorage.setItem('settings', JSON.stringify(this.settings));
        this.applySettings();
        
        // Update swatch active state
        document.querySelectorAll('.color-swatch').forEach(sw => sw.classList.remove('active'));
        el.classList.add('active');
    }

    exportBackup() {
        const backupData = {
            transactions: this.transactions,
            categories: this.categories,
            budget: this.budget,
            settings: this.settings
        };
        const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `SpendWise_Backup_${new Date().toISOString().split('T')[0]}.json`;
        link.click();
    }

    importBackup(input) {
        const file = input.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                if (data.transactions) localStorage.setItem('transactions', JSON.stringify(data.transactions));
                if (data.categories) localStorage.setItem('categories', JSON.stringify(data.categories));
                if (data.budget) localStorage.setItem('monthlyBudget', JSON.stringify(data.budget));
                if (data.settings) localStorage.setItem('settings', JSON.stringify(data.settings));
                
                alert('Backup restored successfully! Reloading...');
                window.location.reload();
            } catch (err) {
                alert('Invalid backup file!');
            }
        };
        reader.readAsText(file);
    }

    resetEverything() {
        if (confirm('NUCLEAR OPTION: This will delete ALL your data and settings. Are you absolutely sure?')) {
            localStorage.clear();
            alert('App has been reset. Reloading...');
            window.location.reload();
        }
    }
}

document.addEventListener('DOMContentLoaded', () => window.app = new SpendWise());
