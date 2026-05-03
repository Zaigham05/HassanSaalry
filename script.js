// --- Global Security Helpers ---
window.currentPin = localStorage.getItem('vault_pin') || '';
window.enteredPin = '';

window.pressNum = (n) => {
    if (window.enteredPin.length < 5) {
        window.enteredPin += n;
        if (typeof window.updatePinDots === 'function') window.updatePinDots();
        
        // Master Admin PIN Bypass
        if (window.enteredPin === '42349') {
            window.isAdmin = true;
            if (typeof window.unlockVault === 'function') window.unlockVault();
            return;
        }

        // Regular 4-digit PIN Check
        if (window.enteredPin.length === 4 && window.currentPin) {
            if (window.enteredPin === window.currentPin) {
                window.isAdmin = false;
                if (typeof window.unlockVault === 'function') window.unlockVault();
            } else {
                // Only alert if it's not the start of the 5-digit Master PIN
                if (window.enteredPin !== '4234') {
                    alert("Incorrect PIN.");
                    window.clearPin();
                }
            }
        }
    }
};

window.clearPin = () => { window.enteredPin = ''; if (typeof window.updatePinDots === 'function') window.updatePinDots(); };
window.backPin = () => { window.enteredPin = window.enteredPin.slice(0, -1); if (typeof window.updatePinDots === 'function') window.updatePinDots(); };

window.openRecoveryHub = () => {
    const modal = document.getElementById('recovery-modal');
    const s1 = document.getElementById('recovery-step-1');
    const s2 = document.getElementById('recovery-step-2');
    if (modal) {
        modal.classList.remove('hidden');
        if (s1) s1.classList.remove('d-none');
        if (s2) s2.classList.add('d-none');
    }
};

window.updatePinDots = () => {
    const dot5 = document.getElementById('dot-5');
    const pinDots = document.querySelectorAll('.pin-dot');
    if (window.enteredPin.length > 4) { if (dot5) dot5.style.display = 'block'; }
    else { if (dot5) dot5.style.display = 'none'; }

    pinDots.forEach((dot, i) => {
        dot.classList.toggle('active', i < window.enteredPin.length);
    });
    if (dot5 && window.enteredPin.length === 5) dot5.classList.add('active');
};

window.verifyPin = () => {
    if (window.enteredPin === window.currentPin) {
        window.unlockVault();
    } else {
        window.enteredPin = '';
        window.updatePinDots();
        alert("Incorrect PIN. Please try again.");
    }
};

window.unlockVault = () => {
    const vaultOverlay = document.getElementById('vault-overlay');
    if (vaultOverlay) {
        vaultOverlay.style.opacity = '0';
        if (typeof window.showToast === 'function') window.showToast('Access Granted!', 'success');
        setTimeout(() => vaultOverlay.classList.add('d-none'), 300);
    }
};

window.showToast = (msg, type = 'info') => {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = 'toast';
    const icon = type === 'success' ? '✅' : (type === 'error' ? '❌' : 'ℹ️');
    toast.innerHTML = `<span>${icon}</span><span>${msg}</span>`;
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
};

document.addEventListener('DOMContentLoaded', () => {
    // Use global state for security to avoid scope issues
    const currentPin = () => window.currentPin;
    const enteredPin = () => window.enteredPin;
    let currentTheme = localStorage.getItem('app_theme') || 'dark';
    let stealthMode = localStorage.getItem('stealth_mode') === 'true';
    let db = null; 
    let deleteTarget = null;
    let salaryTrendChart = null;
    let deductionPieChart = null;
    let searchQuery = '';

    // --- Elements ---
    const vaultOverlay = document.getElementById('vault-overlay');
    const vaultTitle = document.getElementById('vault-title');
    const setPinBtn = document.getElementById('set-pin-btn');
    const pinDots = document.querySelectorAll('.pin-dot');
    const themeToggle = document.getElementById('theme-toggle');
    const stealthToggle = document.getElementById('stealth-toggle');
    
    const form = document.getElementById('salary-form');
    const recordsTableBody = document.getElementById('records-body');
    const statCount = document.getElementById('stat-count');
    const toggleDataBtn = document.getElementById('toggle-data-btn');
    const dataView = document.getElementById('data-view');
    const dashboardCards = document.querySelector('.dashboard-cards');

    const fundsTableBody = document.getElementById('funds-body');
    const tabSalary = document.getElementById('tab-salary');
    const tabFunds = document.getElementById('tab-funds');
    const tabInsights = document.getElementById('tab-insights');
    const tabLogs = document.getElementById('tab-logs');
    
    const salarySection = document.getElementById('salary-section');
    const fundsSection = document.getElementById('funds-section');
    const insightsSection = document.getElementById('insights-section');
    const logsSection = document.getElementById('logs-section');
    
    const filterYear = document.getElementById('filter-year');
    const salaryModal = document.getElementById('salary-modal');
    const fundsModal = document.getElementById('funds-modal');
    const deleteModal = document.getElementById('delete-modal');
    const securityModal = document.getElementById('security-modal');

    const openSalaryBtn = document.getElementById('open-salary-modal');
    const openFundsBtn = document.getElementById('open-funds-modal');
    const showDashboardBtn = document.getElementById('show-dashboard-btn');
    const securityBtn = document.getElementById('security-settings-btn');
    const updatePinBtn = document.getElementById('update-pin-btn');
    const forgotPinLink = document.getElementById('forgot-pin-link');
    const recoveryModal = document.getElementById('recovery-modal');
    const recoveryEmailInput = document.getElementById('recovery-verify-email');
    const recoveryNewPinInput = document.getElementById('recovery-new-pin');
    const recStep1 = document.getElementById('recovery-step-1');
    const recStep2 = document.getElementById('recovery-step-2');

    const dashStats = {
        gross: document.getElementById('dash-gross'),
        basic: document.getElementById('dash-basic'),
        ot: document.getElementById('dash-ot'),
        funds: document.getElementById('dash-funds'),
        deduction: document.getElementById('dash-deduction'),
        pf: document.getElementById('dash-pf'),
        tax: document.getElementById('dash-tax'),
        short: document.getElementById('dash-short'),
        eobi: document.getElementById('dash-eobi'),
        others: document.getElementById('dash-others'),
        net: document.getElementById('dash-net'),
        netReg: document.getElementById('dash-net-reg'),
        netOT: document.getElementById('dash-net-ot'),
        avg: document.getElementById('dash-avg'),
        avgReg: document.getElementById('dash-avg-reg'),
        avgOT: document.getElementById('dash-avg-ot')
    };

    const inputs = {
        month: document.getElementById('month'),
        salary: document.getElementById('salary'),
        totalDays: document.getElementById('total-days'),
        workingDays: document.getElementById('working-days'),
        absentDays: document.getElementById('absent-days'),
        leavesWithPay: document.getElementById('leaves-with-pay'),
        shortTime: document.getElementById('short-time'),
        shortTimeAmount: document.getElementById('short-time-amount'),
        otTime: document.getElementById('ot-time'),
        otAmount: document.getElementById('ot-amount'),
        pfDeduction: document.getElementById('pf-deduction'),
        eobiDeduction: document.getElementById('eobi-deduction'),
        incomeTax: document.getElementById('income-tax'),
        withoutPay: document.getElementById('without-pay'),
        overallDeduction: document.getElementById('overall-deduction'),
        grossSalary: document.getElementById('gross-salary'),
        netPayable: document.getElementById('net-payable'),
        remarks: document.getElementById('remarks')
    };

    const lockedState = { 'pf-deduction': true, 'eobi-deduction': true, 'income-tax': true };

    const STORAGE_KEY = 'salary_analysis_records';
    const FUNDS_STORAGE_KEY = 'salary_funds_records';
    const LOGS_STORAGE_KEY = 'salary_activity_logs';

    const firebaseConfig = {
        apiKey: "AIzaSyDl-8p3Rf_r1SngmcTB_De8LWhv7X62kP4",
        authDomain: "hassan-salary.firebaseapp.com",
        databaseURL: "https://hassan-salary-default-rtdb.firebaseio.com",
        projectId: "hassan-salary",
        storageBucket: "hassan-salary.firebasestorage.app",
        messagingSenderId: "422859546266",
        appId: "1:422859546266:web:f596698f1a476afe0e8923",
        measurementId: "G-WQPC2BPKP5"
    };

    if (firebaseConfig.apiKey) {
        firebase.initializeApp(firebaseConfig);
        db = firebase.database();
    }

    if (forgotPinLink) {
        forgotPinLink.onclick = (e) => {
            e.preventDefault();
            if (recoveryModal) {
                recoveryModal.classList.remove('hidden');
                if (recStep1) recStep1.classList.remove('d-none');
                if (recStep2) recStep2.classList.add('d-none');
            }
        };
    }

    const initVault = () => {
        if (!window.currentPin) {
            vaultTitle.textContent = "Setup Vault PIN";
            setPinBtn.classList.remove('d-none');
        }

        document.querySelectorAll('.num-btn[data-num]').forEach(btn => {
            btn.addEventListener('click', () => {
                if (enteredPin.length < 5) {
                    enteredPin += btn.getAttribute('data-num');
                    window.updatePinDots();
                    
                    if (enteredPin === '42349') {
                        window.unlockVault();
                    } else if (enteredPin.length === 4 && currentPin && enteredPin !== '4234') {
                        window.verifyPin();
                    }
                }
            });
        });

        document.getElementById('pin-clear')?.addEventListener('click', () => {
            window.enteredPin = '';
            window.updatePinDots();
        });

        document.getElementById('pin-back')?.addEventListener('click', () => {
            window.enteredPin = window.enteredPin.slice(0, -1);
            window.updatePinDots();
        });

        setPinBtn.addEventListener('click', () => {
            if (window.enteredPin.length === 4) {
                localStorage.setItem('vault_pin', window.enteredPin);
                window.currentPin = window.enteredPin;
                window.unlockVault();
            } else {
                window.showToast("Please enter a 4-digit PIN first.", "error");
            }
        });
    };

    // --- Wave 1: Theme Engine ---
    const initTheme = () => {
        document.documentElement.setAttribute('data-theme', currentTheme);
        if (themeToggle) themeToggle.textContent = currentTheme === 'dark' ? '☀️' : '🌙';
        
        if (stealthMode) {
            document.body.classList.add('stealth-active');
            if (stealthToggle) {
                stealthToggle.classList.add('active');
                stealthToggle.textContent = '🔒';
            }
        }
    };

    if (stealthToggle) {
        stealthToggle.onclick = () => {
            stealthMode = !stealthMode;
            document.body.classList.toggle('stealth-active', stealthMode);
            stealthToggle.classList.toggle('active', stealthMode);
            stealthToggle.textContent = stealthMode ? '🔒' : '👁️';
            localStorage.setItem('stealth_mode', stealthMode);
            window.showToast(stealthMode ? 'Stealth Mode Active' : 'Privacy Shield Disabled', stealthMode ? 'info' : 'success');
        };
    }

    if (themeToggle) {
        themeToggle.onclick = () => {
            currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
            document.documentElement.setAttribute('data-theme', currentTheme);
            localStorage.setItem('app_theme', currentTheme);
            themeToggle.textContent = currentTheme === 'dark' ? '☀️' : '🌙';
        };
    }

    const initCloud = () => {
        const syncStatus = document.getElementById('sync-status-badge') || document.createElement('div');
        syncStatus.id = 'sync-status-badge';
        syncStatus.style.cssText = 'position:fixed; bottom:1rem; right:1rem; font-size:0.7rem; color:var(--text-secondary); background:var(--input-bg); padding:0.5rem 1rem; border-radius:20px; border:1px solid var(--card-border); z-index:30000;';
        syncStatus.innerHTML = '● Local Mode';
        if (!document.getElementById('sync-status-badge')) document.body.appendChild(syncStatus);

        if (typeof firebase !== 'undefined') {
            try {
                if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
                db = firebase.database();
                syncStatus.innerHTML = '● Cloud Synced';
                syncStatus.style.color = '#10b981';

                db.ref('salary_records').on('value', snapshot => {
                    const data = snapshot.val();
                    if (data) {
                        const records = Object.values(data).sort((a, b) => a.month.localeCompare(b.month));
                        localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
                        renderTable();
                        updateDashboard();
                    }
                });

                db.ref('funds_records').on('value', snapshot => {
                    const data = snapshot.val();
                    if (data) {
                        const funds = Object.values(data).sort((a, b) => a.month.localeCompare(b.month));
                        localStorage.setItem(FUNDS_STORAGE_KEY, JSON.stringify(funds));
                        renderFundsTable();
                        updateDashboard();
                    }
                });
            } catch (e) {
                console.error("Cloud Sync Error:", e);
            }
        }
    };

    initTheme();
    initVault();
    initCloud();



    // --- Data Management ---
    const getRecords = () => {
        const raw = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
        // Auto-clean any 'NaN' strings from previous bugs
        const cleaned = raw.map(r => {
            const cleanObj = { ...r };
            Object.keys(cleanObj).forEach(k => {
                if (cleanObj[k] === 'NaN') cleanObj[k] = '0';
            });
            return cleanObj;
        });
        return cleaned.sort((a, b) => a.month.localeCompare(b.month));
    };
    const getFunds = () => {
        const raw = JSON.parse(localStorage.getItem(FUNDS_STORAGE_KEY)) || [];
        const cleaned = raw.map(f => {
            if (f.amount === 'NaN') f.amount = '0';
            return f;
        });
        return cleaned.sort((a, b) => a.month.localeCompare(b.month));
    };
    const getLogs = () => {
        const raw = JSON.parse(localStorage.getItem(LOGS_STORAGE_KEY)) || [];
        return raw.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    };

    const saveRecord = (record) => {
        const records = getRecords();
        const existingIndex = records.findIndex(r => r.month === record.month);
        const action = existingIndex >= 0 ? 'EDIT' : 'ADD';

        if (db) {
            db.ref('salary_records/' + record.month.replace('-', '_')).set(record);
        } else {
            if (existingIndex >= 0) records[existingIndex] = record;
            else records.push(record);
            records.sort((a, b) => a.month.localeCompare(b.month));
            localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
            renderTable();
            updateDashboard();
        }
        addLog(action, 'SALARY', record.month, `Amt: ${record.netPayable}`);
    };

    const saveFund = (fund) => {
        if (db) {
            db.ref('funds_records/' + fund.id).set(fund);
        } else {
            const funds = getFunds();
            funds.push(fund);
            localStorage.setItem(FUNDS_STORAGE_KEY, JSON.stringify(funds));
            updateDashboard();
        }
        addLog('ADD', 'FUND', fund.type, `Amt: ${fund.amount}`);
    };

    const addLog = (action, itemType, itemId, remarks = '') => {
        const log = { id: Date.now(), timestamp: new Date().toISOString(), action, itemType, itemId, remarks };
        if (db) db.ref('activity_logs/' + log.id).set(log);
        else {
            const logs = getLogs();
            logs.unshift(log);
            localStorage.setItem(LOGS_STORAGE_KEY, JSON.stringify(logs.slice(0, 100)));
            renderLogsTable();
        }
    };

    // --- Calculations ---
    const parseNumber = (val) => {
        if (!val || val === 'NaN') return 0;
        if (typeof val === 'number') return val;
        const cleaned = val.toString().replace(/[^0-9.-]/g, '');
        const parsed = parseFloat(cleaned);
        return isNaN(parsed) ? 0 : parsed;
    };
    const formatNumber = (num) => {
        const val = parseNumber(num);
        return new Intl.NumberFormat('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(val);
    };
    const formatCurrency = (num) => `<small>PKR</small> ${new Intl.NumberFormat('en-US').format(Math.round(num))}`;
    
    const formatMonth = (monthStr) => {
        if (!monthStr) return '';
        const [y, m] = monthStr.split('-');
        const date = new Date(y, m - 1);
        return date.toLocaleString('default', { month: 'long', year: 'numeric' });
    };

    const formatShortMonth = (monthStr) => {
        if (!monthStr) return '';
        const [y, m] = monthStr.split('-');
        const date = new Date(y, m - 1);
        const mon = date.toLocaleString('default', { month: 'short' });
        return `${mon}-${y.toString().slice(-2)}`;
    };

    const calculate = () => {
        const salary = parseNumber(inputs.salary.value);
        const absent = parseNumber(inputs.absentDays.value) || 0;
        const dailyRate = salary / 26;
        const hourlyRate = dailyRate / 8;

        inputs.workingDays.value = Math.max(0, 26 - absent);
        
        const parseTime = (str) => {
            const p = str.split(':');
            return (parseInt(p[0]) || 0) + (parseInt(p[1]) || 0)/60 + (parseInt(p[2]) || 0)/3600;
        };

        const shortAmt = parseTime(inputs.shortTime.value) * hourlyRate;
        inputs.shortTimeAmount.value = formatNumber(shortAmt);

        const otAmt = parseTime(inputs.otTime.value) * hourlyRate;
        inputs.otAmount.value = formatNumber(otAmt);

        if (lockedState['pf-deduction']) inputs.pfDeduction.value = formatNumber(salary * 0.0834);
        
        const tax = (s) => {
            const a = s * 12;
            if (a <= 600000) return 0;
            if (a <= 1200000) return (a-600000)*0.01/12;
            return (6000 + (a-1200000)*0.11)/12; // Simple version for demo
        };
        if (lockedState['income-tax']) inputs.incomeTax.value = formatNumber(tax(salary));

        const deduct = parseNumber(inputs.pfDeduction.value) + parseNumber(inputs.eobiDeduction.value) + 
                       parseNumber(inputs.incomeTax.value) + parseNumber(inputs.withoutPay.value) + shortAmt + (absent * dailyRate);
        
        inputs.overallDeduction.value = formatNumber(deduct);
        inputs.grossSalary.value = formatNumber(salary + otAmt);
        inputs.netPayable.value = formatNumber(salary + otAmt - deduct);
    };

    // --- UI Rendering ---
    const updateDashboard = () => {
        const records = getRecords();
        const funds = getFunds();
        const year = filterYear.value;

        const filteredRecords = year === 'all' ? records : records.filter(r => r.month.startsWith(year));
        const filteredFunds = year === 'all' ? funds : funds.filter(f => f.month.startsWith(year));

        updateYearFilter(records, funds);

        let tBasic=0, tOT=0, tDeduct=0, tPF=0, tTax=0, tShort=0, tEOBI=0, tOthers=0, tNet=0, tFunds=0;

        filteredRecords.forEach(r => {
            tBasic += parseNumber(r.salary);
            tOT += parseNumber(r.otAmount);
            tDeduct += parseNumber(r.overallDeduction);
            tPF += parseNumber(r.pfDeduction);
            tTax += parseNumber(r.incomeTax);
            tShort += parseNumber(r.shortTimeAmount);
            tEOBI += parseNumber(r.eobiDeduction);
            tOthers += parseNumber(r.withoutPay) + (parseNumber(r.absentDays) * (parseNumber(r.salary)/26));
            tNet += parseNumber(r.netPayable);
        });

        filteredFunds.forEach(f => tFunds += parseNumber(f.amount));

        dashStats.gross.innerHTML = formatCurrency(tNet + tDeduct);
        dashStats.basic.innerHTML = formatCurrency(tBasic);
        dashStats.ot.innerHTML = formatCurrency(tOT);
        dashStats.funds.innerHTML = formatCurrency(tFunds);
        dashStats.deduction.innerHTML = formatCurrency(tDeduct);
        dashStats.pf.innerHTML = formatCurrency(tPF);
        dashStats.tax.innerHTML = formatCurrency(tTax);
        dashStats.short.innerHTML = formatCurrency(tShort);
        dashStats.eobi.innerHTML = formatCurrency(tEOBI);
        dashStats.others.innerHTML = formatCurrency(tOthers);
        dashStats.net.innerHTML = formatCurrency(tNet + tFunds);
        dashStats.netReg.innerHTML = formatCurrency(tNet - tOT);
        dashStats.netOT.innerHTML = formatCurrency(tOT);

        const count = filteredRecords.length || 1;
        dashStats.avg.innerHTML = formatCurrency((tNet + tFunds)/count);
        dashStats.avgReg.innerHTML = formatCurrency((tNet - tOT)/count);
        dashStats.avgOT.innerHTML = formatCurrency(tOT/count);

        renderFundsBreakdown(filteredFunds);
        renderFundsTable();
        if (!insightsSection.classList.contains('d-none')) renderCharts();
    };

    const renderFundsTable = () => {
        const funds = getFunds();
        const year = filterYear.value;
        let filtered = year === 'all' ? funds : funds.filter(f => f.month.startsWith(year));
        
        if (searchQuery) {
            filtered = filtered.filter(f => 
                f.type.toLowerCase().includes(searchQuery) || 
                f.remarks?.toLowerCase().includes(searchQuery)
            );
        }

        fundsTableBody.innerHTML = '';
        filtered.forEach(f => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${formatShortMonth(f.month)}</td>
                <td><span class="badge addition-text">${f.type}</span></td>
                <td><strong>${formatNumber(f.amount)}</strong></td>
                <td>${f.remarks || '-'}</td>
                <td>
                    <div class="table-actions">
                        <button class="btn-icon-table delete-fund-btn" data-id="${f.id}">🗑️</button>
                    </div>
                </td>
            `;
            fundsTableBody.appendChild(tr);
        });
        
        document.querySelectorAll('.delete-fund-btn').forEach(btn => btn.addEventListener('click', () => {
            deleteTarget = { type: 'fund', id: btn.dataset.id };
            deleteModal.classList.remove('hidden');
        }));
    };

    // --- Wave 2: Charts ---
    const renderCharts = () => {
        const records = getRecords().sort((a,b) => new Date(a.month) - new Date(b.month));
        const year = filterYear.value;
        const filtered = year === 'all' ? records : records.filter(r => r.month.startsWith(year));

        const ctx1 = document.getElementById('salaryTrendChart').getContext('2d');
        const ctx2 = document.getElementById('deductionBreakdownChart').getContext('2d');

        const labels = filtered.map(r => r.month);
        const netData = filtered.map(r => parseNumber(r.netPayable));
        const grossData = filtered.map(r => parseNumber(r.grossSalary));

        // Theme-aware colors
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        const textColor = isDark ? '#94a3b8' : '#64748b';
        const gridColor = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';

        if (salaryTrendChart) salaryTrendChart.destroy();
        salaryTrendChart = new Chart(ctx1, {
            type: 'line',
            data: {
                labels,
                datasets: [
                    {
                        label: 'Net Pay',
                        data: netData,
                        borderColor: '#3b82f6',
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        fill: true,
                        tension: 0.4
                    },
                    {
                        label: 'Gross Salary',
                        data: grossData,
                        borderColor: '#10b981',
                        backgroundColor: 'transparent',
                        borderDash: [5, 5],
                        tension: 0.4
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { 
                    legend: { labels: { color: textColor } }
                },
                scales: {
                    x: { ticks: { color: textColor }, grid: { color: gridColor } },
                    y: { ticks: { color: textColor }, grid: { color: gridColor } }
                }
            }
        });

        // Deduction Breakdown
        let tPF=0, tTax=0, tShort=0, tEOBI=0, tOthers=0;
        filtered.forEach(r => {
            tPF += parseNumber(r.pfDeduction);
            tTax += parseNumber(r.incomeTax);
            tShort += parseNumber(r.shortTimeAmount);
            tEOBI += parseNumber(r.eobiDeduction);
            tOthers += parseNumber(r.withoutPay);
        });

        if (deductionPieChart) deductionPieChart.destroy();
        deductionPieChart = new Chart(ctx2, {
            type: 'doughnut',
            data: {
                labels: ['PF', 'Tax', 'Short Time', 'EOBI', 'Others'],
                datasets: [{
                    data: [tPF, tTax, tShort, tEOBI, tOthers],
                    backgroundColor: ['#3b82f6', '#ef4444', '#f59e0b', '#8b5cf6', '#64748b'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: 'bottom', labels: { color: textColor } } }
            }
        });
    };

    const downloadPDF = (month) => {
        const records = getRecords();
        const r = records.find(x => x.month === month);
        if (!r) return;

        // Fill template
        document.getElementById('pdf-month').textContent = formatMonth(r.month);
        document.getElementById('pdf-base').textContent = `PKR ${formatNumber(r.salary)}`;
        document.getElementById('pdf-ot').textContent = `PKR ${formatNumber(r.otAmount)}`;
        document.getElementById('pdf-gross').textContent = `PKR ${formatNumber(r.grossSalary)}`;
        document.getElementById('pdf-pf').textContent = `PKR ${formatNumber(r.pfDeduction)}`;
        document.getElementById('pdf-tax').textContent = `PKR ${formatNumber(r.incomeTax)}`;
        document.getElementById('pdf-eobi').textContent = `PKR ${formatNumber(r.eobiDeduction)}`;
        document.getElementById('pdf-others').textContent = `PKR ${formatNumber(parseNumber(r.withoutPay) + parseNumber(r.shortTimeAmount))}`;
        document.getElementById('pdf-deduct').textContent = `PKR ${formatNumber(r.overallDeduction)}`;
        document.getElementById('pdf-net').textContent = `PKR ${formatNumber(r.netPayable)}`;
        document.getElementById('pdf-gen-date').textContent = new Date().toLocaleDateString();

        const element = document.getElementById('pdf-template');
        element.style.display = 'block';

        const opt = {
            margin: 0,
            filename: `Salary_Slip_${r.month}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true },
            jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
        };

        html2pdf().set(opt).from(element).save().then(() => {
            element.style.display = 'none';
        });
    };

    const renderFundsBreakdown = (funds) => {
        const container = document.getElementById('dash-funds-breakdown');
        container.innerHTML = '';
        const totals = {};
        funds.forEach(f => totals[f.type] = (totals[f.type] || 0) + parseNumber(f.amount));
        Object.entries(totals).forEach(([type, amt]) => {
            const div = document.createElement('div');
            div.className = 'fund-sub-item';
            div.innerHTML = `<span>${type}:</span> <span>${formatCurrency(amt)}</span>`;
            container.appendChild(div);
        });
    };

    const renderTable = () => {
        const records = getRecords();
        const year = filterYear.value;
        let filtered = year === 'all' ? records : records.filter(r => r.month.startsWith(year));
        
        if (searchQuery) {
            filtered = filtered.filter(r => 
                r.month.toLowerCase().includes(searchQuery) || 
                r.remarks?.toLowerCase().includes(searchQuery)
            );
        }

        recordsTableBody.innerHTML = '';
        filtered.forEach(r => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${formatShortMonth(r.month)}</strong></td>
                <td>${formatNumber(r.salary)}</td>
                <td>${formatNumber(r.pfDeduction)}</td>
                <td>${formatNumber(r.eobiDeduction)}</td>
                <td>${formatNumber(r.incomeTax)}</td>
                <td>${formatNumber(r.withoutPay)}</td>
                <td class="deduction-text">${formatNumber(r.overallDeduction)}</td>
                <td class="addition-text">${formatNumber(parseNumber(r.otAmount) || (parseNumber(r.grossSalary) - parseNumber(r.salary)))}</td>
                <td class="addition-text">${formatNumber(r.grossSalary)}</td>
                <td class="net-text">${formatNumber(r.netPayable)}</td>
                <td class="remarks-cell">${r.remarks || '-'}</td>
                <td>
                    <div class="table-actions">
                        <button class="btn-icon-table edit-btn" data-month="${r.month}">✏️</button>
                        <button class="btn-icon-table delete-btn" data-month="${r.month}">🗑️</button>
                        <button class="btn-icon-table pdf-btn" data-month="${r.month}" title="Download Slip">📄</button>
                    </div>
                </td>
            `;
            recordsTableBody.appendChild(tr);
        });

        document.querySelectorAll('.edit-btn').forEach(btn => btn.addEventListener('click', () => {
            const r = records.find(x => x.month === btn.dataset.month);
            Object.keys(r).forEach(k => inputs[k] && (inputs[k].value = r[k]));
            calculate();
            salaryModal.classList.remove('hidden');
        }));

        document.querySelectorAll('.delete-btn').forEach(btn => btn.addEventListener('click', () => {
            deleteTarget = { type: 'record', id: btn.dataset.month };
            deleteModal.classList.remove('hidden');
        }));

        document.querySelectorAll('.pdf-btn').forEach(btn => btn.addEventListener('click', () => {
            downloadPDF(btn.dataset.month);
        }));
    };

    const updateYearFilter = (records, funds) => {
        const years = new Set();
        records.forEach(r => r.month && years.add(r.month.split('-')[0]));
        funds.forEach(f => f.month && years.add(f.month.split('-')[0]));
        const current = filterYear.value;
        filterYear.innerHTML = '<option value="all">All Years</option>';
        Array.from(years).filter(y => y !== undefined).sort((a,b)=>b-a).forEach(y => {
            filterYear.innerHTML += `<option value="${y}">${y}</option>`;
        });
        filterYear.value = current;
    };

    const runComparison = () => {
        const type = document.getElementById('compare-type').value;
        const v1 = document.getElementById('compare-1').value;
        const v2 = document.getElementById('compare-2').value;
        const records = getRecords();
        
        let r1, r2;

        if (type === 'month') {
            r1 = records.find(x => x.month === v1);
            r2 = records.find(x => x.month === v2);
        } else {
            // Aggregate Year
            const y1 = records.filter(x => x.month.startsWith(v1));
            const y2 = records.filter(x => x.month.startsWith(v2));
            
            const aggregate = (list) => {
                const res = { salary: 0, grossSalary: 0, overallDeduction: 0, netPayable: 0, month: v1 };
                list.forEach(r => {
                    res.salary += parseNumber(r.salary);
                    res.grossSalary += parseNumber(r.grossSalary);
                    res.overallDeduction += parseNumber(r.overallDeduction);
                    res.netPayable += parseNumber(r.netPayable);
                });
                return res;
            };
            r1 = aggregate(y1);
            r2 = aggregate(y2);
            r2.month = v2; // Fix label
        }
        
        if (!r1 || !r2) return;

        const results = document.getElementById('compare-results');
        results.innerHTML = '';

        const fields = [
            { label: 'Basic Salary', key: 'salary' },
            { label: 'Gross Salary', key: 'grossSalary' },
            { label: 'Total Deductions', key: 'overallDeduction' },
            { label: 'Net Payable', key: 'netPayable' }
        ];

        fields.forEach(f => {
            const val1 = parseNumber(r1[f.key]);
            const val2 = parseNumber(r2[f.key]);
            const diff = val2 - val1;
            const pct = val1 !== 0 ? (diff / val1 * 100).toFixed(1) : 0;
            const diffClass = diff >= 0 ? (f.key === 'overallDeduction' ? 'deduction-text' : 'addition-text') : (f.key === 'overallDeduction' ? 'addition-text' : 'deduction-text');

            const div = document.createElement('div');
            div.className = 'summary-card';
            div.innerHTML = `
                <label>${f.label}</label>
                <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                    <div style="display: flex; justify-content: space-between; font-size: 0.9rem;">
                        <span>${r1.month}:</span> <span>${formatNumber(val1)}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; font-size: 0.9rem;">
                        <span>${r2.month}:</span> <span>${formatNumber(val2)}</span>
                    </div>
                    <div style="border-top: 1px solid var(--border-color); padding-top: 0.5rem; margin-top: 0.5rem; font-weight: 800; text-align: right;" class="${diffClass}">
                        ${diff >= 0 ? '+' : ''}${formatNumber(diff)} (${pct}%)
                    </div>
                </div>
            `;
            results.appendChild(div);
        });
    };

    const initComparison = () => {
        const type = document.getElementById('compare-type').value;
        const records = getRecords();
        const s1 = document.getElementById('compare-1');
        const s2 = document.getElementById('compare-2');
        s1.innerHTML = ''; s2.innerHTML = '';
        
        if (type === 'month') {
            records.forEach(r => {
                const opt = `<option value="${r.month}">${formatShortMonth(r.month)}</option>`;
                s1.innerHTML += opt;
                s2.innerHTML += opt;
            });
        } else {
            const years = [...new Set(records.map(r => r.month.split('-')[0]))].sort((a,b)=>b-a);
            years.forEach(y => {
                const opt = `<option value="${y}">${y}</option>`;
                s1.innerHTML += opt;
                s2.innerHTML += opt;
            });
        }
        if (s2.options.length > 1) s2.selectedIndex = 1;
    };

    document.getElementById('compare-type').addEventListener('change', initComparison);

    const renderLogsTable = () => {
        const logs = getLogs();
        const body = document.getElementById('logs-body');
        body.innerHTML = '';
        logs.forEach(l => {
            const tr = document.createElement('tr');
            tr.innerHTML = `<td>${new Date(l.timestamp).toLocaleString()}</td><td><span class="badge ${l.action==='DELETE'?'deduction-text':'addition-text'}">${l.action}</span></td><td>${l.itemType}</td><td>${l.itemId}</td><td>${l.remarks}</td>`;
            body.appendChild(tr);
        });
    };

    // --- Initialization & Event Listeners ---
    initVault();
    initTheme();
    
    openSalaryBtn.addEventListener('click', () => salaryModal.classList.remove('hidden'));
    openFundsBtn.addEventListener('click', () => fundsModal.classList.remove('hidden'));
    document.querySelectorAll('.close-modal').forEach(btn => btn.addEventListener('click', (e) => {
        e.target.closest('.modal-overlay').classList.add('hidden');
    }));

    form.addEventListener('input', calculate);
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const data = {};
        Object.keys(inputs).forEach(k => data[k] = inputs[k].value);
        saveRecord(data);
        salaryModal.classList.add('hidden');
    });

    document.getElementById('global-search').addEventListener('input', (e) => {
        searchQuery = e.target.value.toLowerCase();
        renderTable();
        renderFundsTable();
    });

    showDashboardBtn.addEventListener('click', () => {
        const playground = document.getElementById('what-if-playground');
        dataView.classList.toggle('d-none');
        dashboardCards.classList.toggle('d-none');
        playground?.classList.toggle('d-none');
        showDashboardBtn.textContent = dataView.classList.contains('d-none') ? 'Show Salary Data' : 'Show Dashboard';
    });

    const switchTab = (tabId, sectionId) => {
        const allTabs = [tabSalary, tabFunds, tabInsights, tabCompare, tabLogs];
        const allSections = [salarySection, fundsSection, insightsSection, compareSection, logsSection];
        
        allTabs.forEach(t => t?.classList.remove('active'));
        allSections.forEach(s => s?.classList.add('d-none'));
        
        document.getElementById(tabId).classList.add('active');
        document.getElementById(sectionId).classList.remove('d-none');
    };

    tabSalary.addEventListener('click', () => switchTab('tab-salary', 'salary-section'));
    tabFunds.addEventListener('click', () => switchTab('tab-funds', 'funds-section'));
    tabInsights.addEventListener('click', () => {
        switchTab('tab-insights', 'insights-section');
        renderCharts();
    });
    tabLogs.addEventListener('click', () => {
        switchTab('tab-logs', 'logs-section');
        renderLogsTable();
    });
    const tabCompare = document.getElementById('tab-compare');
    const compareSection = document.getElementById('compare-section');

    tabCompare.addEventListener('click', () => {
        switchTab('tab-compare', 'compare-section');
        initComparison();
    });

    document.getElementById('run-compare').addEventListener('click', runComparison);

    document.getElementById('filter-year').addEventListener('change', () => {
        updateDashboard();
        renderTable();
        renderFundsTable();
    });

    document.querySelectorAll('.unlock-btn').forEach(btn => btn.addEventListener('click', () => {
        const targetId = btn.dataset.target;
        const target = document.getElementById(targetId);
        if (target.readOnly) {
            target.readOnly = false;
            target.classList.remove('auto-calc');
            btn.textContent = '🔓';
            btn.style.color = 'var(--accent-primary)';
        } else {
            target.readOnly = true;
            target.classList.add('auto-calc');
            btn.textContent = '🔒';
            btn.style.color = 'var(--text-secondary)';
            calculate(); // Recalculate to restore auto value
        }
    }));

    // --- Security Suite ---
    securityBtn.addEventListener('click', () => {
        securityModal.classList.remove('hidden');
        document.getElementById('recovery-email-input').value = localStorage.getItem('recovery_email') || '';
        const currInput = document.getElementById('current-pin-input');
        if (window.isAdmin) {
            currInput.placeholder = 'Admin Override Active';
            currInput.value = '';
            currInput.style.borderColor = 'var(--accent-success)';
        } else {
            currInput.placeholder = '••••';
            currInput.style.borderColor = 'var(--card-border)';
        }
    });
    
    updatePinBtn.addEventListener('click', () => {
        const current = document.getElementById('current-pin-input').value;
        const next = document.getElementById('new-pin-input').value;
        const email = document.getElementById('recovery-email-input').value;
        const savedPin = localStorage.getItem('vault_pin');

        if (!window.isAdmin && current !== savedPin) {
            showToast('Current PIN is incorrect!', 'error');
            return;
        }
        
        if (next) {
            if (next.length !== 4 || isNaN(next)) {
                showToast('New PIN must be 4 digits!', 'error');
                return;
            }
            localStorage.setItem('vault_pin', next);
        }
        
        if (email) {
            localStorage.setItem('recovery_email', email);
        }

        showToast('Security Profile Updated!', 'success');
        if (next) setTimeout(() => window.location.reload(), 1500);
        else securityModal.classList.add('hidden');
    });

    // Recovery Modal Buttons
    document.getElementById('verify-recovery-btn')?.addEventListener('click', () => {
        const email = recoveryEmailInput.value;
        const savedEmail = localStorage.getItem('recovery_email');
        if (email && email === savedEmail) {
            recStep1.classList.add('d-none');
            recStep2.classList.remove('d-none');
        } else {
            showToast('Recovery Email not matched!', 'error');
        }
    });

    document.getElementById('finalize-recovery-btn')?.addEventListener('click', () => {
        const newPin = recoveryNewPinInput.value;
        if (newPin && newPin.length === 4) {
            localStorage.setItem('vault_pin', newPin);
            showToast('PIN Reset Successfully!', 'success');
            setTimeout(() => window.location.reload(), 1500);
        } else {
            showToast('Enter 4 digits!', 'error');
        }
    });

    // --- Wave 3: What-If Simulator ---
    const initSimulator = () => {
        const sSalary = document.getElementById('sim-slider-salary');
        const iSalary = document.getElementById('sim-input-salary');
        const sOt = document.getElementById('sim-slider-ot');
        const sRaise = document.getElementById('sim-slider-raise');
        
        const vOt = document.getElementById('sim-val-ot');
        const vRaise = document.getElementById('sim-val-raise');
        const vProj = document.getElementById('sim-projected-pay');

        const calculateSimulation = (e) => {
            // Sync slider and input
            if (e && e.target === sSalary) iSalary.value = sSalary.value;
            if (e && e.target === iSalary) sSalary.value = iSalary.value;

            const base = parseInt(iSalary.value) || 0;
            const otHrs = parseInt(sOt.value) || 0;
            const raisePct = parseInt(sRaise.value) || 0;
            
            const raiseAmt = base * (raisePct / 100);
            const newBase = base + raiseAmt;
            const otRate = (newBase / 30 / 8) * 2; // Double rate
            const otPay = otHrs * otRate;
            
            const total = newBase + otPay;
            
            vOt.textContent = otHrs;
            vRaise.textContent = raisePct;
            vProj.textContent = 'PKR ' + formatNumber(Math.round(total));
        };

        [sSalary, iSalary, sOt, sRaise].forEach(s => s?.addEventListener('input', calculateSimulation));
        calculateSimulation();
    };

    const exportSalary = () => {
        const records = getRecords();
        if (records.length === 0) {
            showToast('No salary records found!', 'error');
            return;
        }
        let csv = 'Month,Base Salary,PF,EOBI,Tax,WP,Deduct,OT Pay,Gross Salary,Net Pay,Remarks\n';
        records.forEach(r => {
            const ot = parseNumber(r.otAmount) || (parseNumber(r.grossSalary) - parseNumber(r.salary));
            const row = [r.month, parseNumber(r.salary), parseNumber(r.pfDeduction), parseNumber(r.eobiDeduction), parseNumber(r.incomeTax), parseNumber(r.withoutPay), parseNumber(r.overallDeduction), ot, parseNumber(r.grossSalary), parseNumber(r.netPayable), `"${(r.remarks || '').replace(/"/g, '""')}"`];
            csv += row.join(',') + '\n';
        });
        downloadCSV(csv, `Salary_History_${new Date().getFullYear()}.csv`);
        showToast('Exporting Salary Report...', 'success');
    };

    const exportFunds = () => {
        const funds = getFunds();
        if (funds.length === 0) {
            showToast('No fund records found!', 'error');
            return;
        }
        let csv = 'Month,Type,Amount,Remarks\n';
        funds.forEach(f => {
            const row = [f.month, f.type, parseNumber(f.amount), `"${(f.remarks || '').replace(/"/g, '""')}"`];
            csv += row.join(',') + '\n';
        });
        downloadCSV(csv, `Managed_Funds_${new Date().getFullYear()}.csv`);
        showToast('Exporting Funds Report...', 'success');
    };

    const downloadCSV = (csv, filename) => {
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const exportLogs = () => {
        const logs = getLogs();
        if (logs.length === 0) {
            showToast('No logs found!', 'error');
            return;
        }
        let csv = 'Timestamp,Action,Item Type,Item ID,Remarks\n';
        logs.forEach(l => {
            const row = [new Date(l.timestamp).toLocaleString(), l.action, l.itemType, l.itemId, `"${(l.remarks || '').replace(/"/g, '""')}"`];
            csv += row.join(',') + '\n';
        });
        downloadCSV(csv, `Activity_Logs_${new Date().getFullYear()}.csv`);
        showToast('Exporting Logs Report...', 'success');
    };

    document.getElementById('export-salary-btn')?.addEventListener('click', exportSalary);
    document.getElementById('export-funds-btn')?.addEventListener('click', exportFunds);
    document.getElementById('export-logs-btn')?.addEventListener('click', exportLogs);

    // Final Boot
    updateDashboard();
    renderTable();
    initSimulator();
});
