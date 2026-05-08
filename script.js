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
            window.unlockVault();
            return;
        }

        // Regular 4-digit PIN Check
        if (window.enteredPin.length === 4 && window.currentPin) {
            if (window.enteredPin === window.currentPin) {
                window.isAdmin = false;
                window.unlockVault();
            } else {
                // Only fail if it's not the start of the 5-digit Master PIN
                if (window.enteredPin !== '4234') {
                    const vaultCard = document.querySelector('.vault-card');
                    vaultCard?.classList.add('shake');
                    setTimeout(() => vaultCard?.classList.remove('shake'), 500);
                    
                    window.showToast("ACCESS DENIED: PIN INCORRECT", "error");
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
        const vaultCard = document.querySelector('.vault-card');
        vaultCard?.classList.add('shake');
        setTimeout(() => vaultCard?.classList.remove('shake'), 500);
        
        window.enteredPin = '';
        window.updatePinDots();
        window.showToast("ACCESS DENIED: PIN INCORRECT", "error");
    }
};

window.unlockVault = () => {
    const vaultOverlay = document.getElementById('vault-overlay');
    const bioScreen = document.getElementById('biometric-screen');
    const vaultCard = document.querySelector('.vault-card');
    
    if (bioScreen) {
        bioScreen.classList.remove('hidden');
        if (vaultCard) vaultCard.style.display = 'none';
        
        setTimeout(() => {
            if (vaultOverlay) {
                vaultOverlay.style.opacity = '0';
                if (typeof window.showToast === 'function') window.showToast('IDENTITY CONFIRMED: ACCESS GRANTED', 'success');
                setTimeout(() => vaultOverlay.classList.add('d-none'), 500);
            }
        }, 1800);
    } else if (vaultOverlay) {
        vaultOverlay.style.opacity = '0';
        setTimeout(() => vaultOverlay.classList.add('d-none'), 300);
    }
};

window.lockVault = () => {
    const vaultOverlay = document.getElementById('vault-overlay');
    const vaultCard = document.querySelector('.vault-card');
    const bioScreen = document.getElementById('biometric-screen');
    
    if (vaultOverlay) {
        vaultOverlay.classList.remove('d-none');
        setTimeout(() => vaultOverlay.style.opacity = '1', 10);
    }
    if (vaultCard) {
        vaultCard.style.display = 'block';
        vaultCard.style.opacity = '1';
    }
    if (bioScreen) bioScreen.classList.add('hidden');
    
    window.enteredPin = '';
    if (typeof window.updatePinDots === 'function') window.updatePinDots();
    if (typeof window.showToast === 'function') window.showToast('VAULT LOCKED: SESSION TERMINATED', 'info');
};

window.showToast = (msg, type = 'info') => {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.setAttribute('data-type', type);
    const icon = type === 'success' ? '🛡️' : (type === 'error' ? '🚫' : 'ℹ️');
    toast.innerHTML = `<span>${icon}</span><span>${msg}</span>`;
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(-20px)';
        setTimeout(() => toast.remove(), 500);
    }, 4000);
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

    const tabAttendance = document.getElementById('tab-attendance');
    const tabSalary = document.getElementById('tab-salary');
    const tabFunds = document.getElementById('tab-funds');
    const tabInsights = document.getElementById('tab-insights');
    const tabLogs = document.getElementById('tab-logs');
    
    const attendanceSection = document.getElementById('attendance-section');
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
        avgTotal: document.getElementById('dash-avg-total'),
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
        weeklyOffs: document.getElementById('weekly-offs'),
        ghDays: document.getElementById('gh-days'),
        leaveDays: document.getElementById('leave-days'),
        cplDays: document.getElementById('cpl-days'),
        withPayDays: document.getElementById('with-pay-days'),
        actualWorkedDays: document.getElementById('actual-worked-days'),
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
    const ATTENDANCE_STORAGE_KEY = 'salary_attendance_records';

    // Seed Data from Image (Jan 2024 - Mar 2026)
    const SEED_ATTENDANCE = [
        { month: '2024-01', totalDays: '31', actualWorkedDays: '27', weeklyOffs: '4', ghDays: '0', absentDays: '0', leaveDays: '0', cplDays: '0', withPayDays: '0' },
        { month: '2024-02', totalDays: '29', actualWorkedDays: '23', weeklyOffs: '4', ghDays: '2', absentDays: '0', leaveDays: '0', cplDays: '0', withPayDays: '0' },
        { month: '2024-03', totalDays: '31', actualWorkedDays: '27', weeklyOffs: '4', ghDays: '0', absentDays: '0', leaveDays: '0', cplDays: '0', withPayDays: '0' },
        { month: '2024-04', totalDays: '30', actualWorkedDays: '25', weeklyOffs: '1', ghDays: '2', absentDays: '0', leaveDays: '0', cplDays: '2', withPayDays: '0' },
        { month: '2024-05', totalDays: '31', actualWorkedDays: '24', weeklyOffs: '3', ghDays: '2', absentDays: '0', leaveDays: '2', cplDays: '0', withPayDays: '0' },
        { month: '2024-06', totalDays: '30', actualWorkedDays: '14.09', weeklyOffs: '5', ghDays: '3', absentDays: '0', leaveDays: '3.91', cplDays: '4', withPayDays: '0' },
        { month: '2024-07', totalDays: '31', actualWorkedDays: '21', weeklyOffs: '4', ghDays: '2', absentDays: '0', leaveDays: '4', cplDays: '0', withPayDays: '0' },
        { month: '2024-08', totalDays: '31', actualWorkedDays: '24', weeklyOffs: '4', ghDays: '1', absentDays: '0', leaveDays: '2', cplDays: '0', withPayDays: '0' },
        { month: '2024-09', totalDays: '30', actualWorkedDays: '23.54', weeklyOffs: '5', ghDays: '1', absentDays: '0', leaveDays: '0.46', cplDays: '0', withPayDays: '0' },
        { month: '2024-10', totalDays: '31', actualWorkedDays: '23', weeklyOffs: '4', ghDays: '0', absentDays: '1.37', leaveDays: '2.63', cplDays: '0', withPayDays: '0' },
        { month: '2024-11', totalDays: '30', actualWorkedDays: '23.43', weeklyOffs: '4', ghDays: '1', absentDays: '0.68', leaveDays: '0.89', cplDays: '0', withPayDays: '0' },
        { month: '2024-12', totalDays: '31', actualWorkedDays: '23', weeklyOffs: '5', ghDays: '1', absentDays: '0', leaveDays: '2', cplDays: '0', withPayDays: '0' },
        { month: '2025-01', totalDays: '31', actualWorkedDays: '25.88', weeklyOffs: '4', ghDays: '0', absentDays: '0', leaveDays: '1.12', cplDays: '0', withPayDays: '0' },
        { month: '2025-02', totalDays: '28', actualWorkedDays: '23', weeklyOffs: '4', ghDays: '1', absentDays: '0', leaveDays: '0', cplDays: '0', withPayDays: '0' },
        { month: '2025-03', totalDays: '31', actualWorkedDays: '23.69', weeklyOffs: '5', ghDays: '1', absentDays: '0', leaveDays: '1.31', cplDays: '0', withPayDays: '0' },
        { month: '2025-04', totalDays: '30', actualWorkedDays: '20.6', weeklyOffs: '4', ghDays: '2', absentDays: '0', leaveDays: '1.90', cplDays: '0', withPayDays: '1.5' },
        { month: '2025-05', totalDays: '31', actualWorkedDays: '21.88', weeklyOffs: '4', ghDays: '2', absentDays: '0', leaveDays: '3.12', cplDays: '0', withPayDays: '0' },
        { month: '2025-06', totalDays: '30', actualWorkedDays: '11.83', weeklyOffs: '5', ghDays: '3', absentDays: '0', leaveDays: '10.17', cplDays: '0', withPayDays: '0' },
        { month: '2025-07', totalDays: '31', actualWorkedDays: '22.9', weeklyOffs: '4', ghDays: '1', absentDays: '0', leaveDays: '3.1', cplDays: '0', withPayDays: '0' },
        { month: '2025-08', totalDays: '31', actualWorkedDays: '24.41', weeklyOffs: '5', ghDays: '1', absentDays: '0', leaveDays: '0.59', cplDays: '0', withPayDays: '0' },
        { month: '2025-09', totalDays: '30', actualWorkedDays: '21.75', weeklyOffs: '4', ghDays: '1', absentDays: '0', leaveDays: '3.25', cplDays: '0', withPayDays: '0' },
        { month: '2025-10', totalDays: '31', actualWorkedDays: '25.34', weeklyOffs: '4', ghDays: '0', absentDays: '0', leaveDays: '1.66', cplDays: '0', withPayDays: '0' },
        { month: '2025-11', totalDays: '30', actualWorkedDays: '24.07', weeklyOffs: '5', ghDays: '0', absentDays: '0', leaveDays: '0.93', cplDays: '0', withPayDays: '0' },
        { month: '2025-12', totalDays: '31', actualWorkedDays: '21.48', weeklyOffs: '4', ghDays: '1', absentDays: '0', leaveDays: '4.52', cplDays: '0', withPayDays: '0' },
        { month: '2026-01', totalDays: '31', actualWorkedDays: '24.46', weeklyOffs: '4', ghDays: '0', absentDays: '0', leaveDays: '2.54', cplDays: '0', withPayDays: '0' },
        { month: '2026-02', totalDays: '28', actualWorkedDays: '20.88', weeklyOffs: '4', ghDays: '1', absentDays: '0', leaveDays: '0', cplDays: '2.12', withPayDays: '0' },
        { month: '2026-03', totalDays: '31', actualWorkedDays: '22.65', weeklyOffs: '4', ghDays: '3', absentDays: '0', leaveDays: '1.35', cplDays: '0', withPayDays: '0' }
    ];

    if (!localStorage.getItem(ATTENDANCE_STORAGE_KEY)) {
        localStorage.setItem(ATTENDANCE_STORAGE_KEY, JSON.stringify(SEED_ATTENDANCE));
    }
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
        const checkVaultState = () => {
            if (!window.currentPin) {
                vaultTitle.textContent = "Setup Vault PIN";
                setPinBtn.classList.remove('d-none');
                setPinBtn.style.display = 'block';
            } else {
                vaultTitle.textContent = "Vault PIN Required";
                setPinBtn.classList.add('d-none');
                setPinBtn.style.display = 'none';
            }
        };
        checkVaultState();
        window.checkVaultState = checkVaultState;

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
                if (db) db.ref('vault_settings/pin').set(window.enteredPin);
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
        syncStatus.style.cssText = 'position:fixed; bottom:1rem; right:1rem; font-size:0.7rem; color:var(--text-secondary); background:var(--input-bg); padding:0.5rem 1rem; border-radius:20px; border: 1px solid #10b981; box-shadow: 0 10px 20px rgba(0,0,0,0.4); z-index:30000;';
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

                db.ref('vault_settings').on('value', snapshot => {
                    const settings = snapshot.val();
                    if (settings) {
                        if (settings.pin) {
                            localStorage.setItem('vault_pin', settings.pin);
                            window.currentPin = settings.pin;
                        }
                        if (settings.recovery_email) localStorage.setItem('recovery_email', settings.recovery_email);
                        if (typeof window.checkVaultState === 'function') window.checkVaultState();
                    } else {
                        // MIGRATION: If server is empty but we have local pin, upload to server
                        const localPin = localStorage.getItem('vault_pin');
                        const localEmail = localStorage.getItem('recovery_email');
                        if (localPin) {
                            db.ref('vault_settings').set({
                                pin: localPin,
                                recovery_email: localEmail || ''
                            });
                        }
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

    const getAttendanceRecords = () => {
        const raw = JSON.parse(localStorage.getItem(ATTENDANCE_STORAGE_KEY)) || [];
        return raw.sort((a, b) => a.month.localeCompare(b.month));
    };

    const saveAttendanceRecord = (record) => {
        const records = getAttendanceRecords();
        const existingIndex = records.findIndex(r => r.month === record.month);
        const action = existingIndex >= 0 ? 'EDIT' : 'ADD';

        if (existingIndex >= 0) records[existingIndex] = record;
        else records.push(record);
        
        records.sort((a, b) => a.month.localeCompare(b.month));
        localStorage.setItem(ATTENDANCE_STORAGE_KEY, JSON.stringify(records));
        
        updateDashboard();
        addLog(action, 'ATTENDANCE', record.month);
        showToast(`Attendance ${action === 'EDIT' ? 'Updated' : 'Added'} Successfully!`, 'success');
    };

    const deleteAttendanceRecord = (month) => {
        const records = getAttendanceRecords().filter(r => r.month !== month);
        localStorage.setItem(ATTENDANCE_STORAGE_KEY, JSON.stringify(records));
        updateDashboard();
        addLog('DELETE', 'ATTENDANCE', month);
        showToast('Attendance Record Deleted', 'success');
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
        const val = Math.round(parseNumber(num));
        return new Intl.NumberFormat('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(val);
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

        const parseTime = (str) => {
            const p = str.split(':');
            return (parseInt(p[0]) || 0) + (parseInt(p[1]) || 0)/60 + (parseInt(p[2]) || 0)/3600;
        };

        const shortAmt = parseTime(inputs.shortTime.value) * hourlyRate;
        inputs.shortTimeAmount.value = formatNumber(shortAmt);
        
        // Attendance Logic
        const totalMonthDays = parseNumber(inputs.totalDays.value) || 26;
        const offs = parseNumber(inputs.weeklyOffs.value) || 0;
        const gh = parseNumber(inputs.ghDays.value) || 0;
        const leave = parseNumber(inputs.leaveDays.value) || 0;
        const abs = parseNumber(inputs.absentDays.value) || 0;
        const cpl = parseNumber(inputs.cplDays.value) || 0;
        const withPay = parseNumber(inputs.withPayDays.value) || 0;
        
        // Worked Days = Total - Offs - GH - Absent - Leave + CPL + WithPay
        const actualWorked = totalMonthDays - offs - gh - abs - leave + cpl + withPay;
        inputs.actualWorkedDays.value = actualWorked.toFixed(2);
        inputs.workingDays.value = Math.max(0, totalMonthDays - absent); // Keeping legacy for compatibility

        inputs.shortTimeAmount.value = formatNumber(shortAmt);

        const otAmt = parseTime(inputs.otTime.value) * hourlyRate * 2;
        inputs.otAmount.value = formatNumber(otAmt);

        if (lockedState['pf-deduction']) inputs.pfDeduction.value = formatNumber(salary * 0.0834);
        
        const tax = (s) => {
            const a = s * 12;
            if (a <= 600000) return 0;
            if (a <= 1200000) return (a-600000)*0.01/12;
            return (6000 + (a-1200000)*0.11)/12; // Simple version for demo
        };
        if (lockedState['income-tax']) inputs.incomeTax.value = formatNumber(tax(salary));

        let customDeducts = 0;
        document.querySelectorAll('.custom-deduct-value').forEach(inp => {
            customDeducts += parseNumber(inp.value);
        });

        const deduct = parseNumber(inputs.pfDeduction.value) + parseNumber(inputs.eobiDeduction.value) + 
                       parseNumber(inputs.incomeTax.value) + parseNumber(inputs.withoutPay.value) + shortAmt + (absent * dailyRate) + customDeducts;
        
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

        let tBasic=0, tOT=0, tDeduct=0, tPF=0, tTax=0, tShort=0, tEOBI=0, tOthers=0, tNet=0, tFunds=0, tFundTax=0;

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

        filteredFunds.forEach(f => {
            const amt = parseNumber(f.amount);
            const tx = parseNumber(f.tax || 0);
            tFunds += (amt - tx);
            tFundTax += tx;
        });

        dashStats.gross.innerHTML = formatCurrency(tNet + tDeduct);
        dashStats.basic.innerHTML = formatCurrency(tBasic);
        dashStats.ot.innerHTML = formatCurrency(tOT);
        dashStats.funds.innerHTML = formatCurrency(tFunds);
        dashStats.deduction.innerHTML = formatCurrency(tDeduct + tFundTax);
        dashStats.pf.innerHTML = formatCurrency(tPF);
        dashStats.tax.innerHTML = formatCurrency(tTax);
        document.getElementById('dash-fund-tax').innerHTML = formatCurrency(tFundTax);
        dashStats.short.innerHTML = formatCurrency(tShort);
        dashStats.eobi.innerHTML = formatCurrency(tEOBI);
        dashStats.others.innerHTML = formatCurrency(tOthers);
        dashStats.net.innerHTML = formatCurrency(tNet + tFunds);
        document.getElementById('dash-total-salary').innerHTML = formatCurrency(tNet);
        dashStats.netReg.innerHTML = formatCurrency(tNet - tOT);
        dashStats.netOT.innerHTML = formatCurrency(tOT);

        const count = filteredRecords.length || 1;
        dashStats.avg.innerHTML = formatCurrency((tNet + tFunds)/count);
        if (dashStats.avgTotal) dashStats.avgTotal.innerHTML = formatCurrency(tNet/count);
        dashStats.avgReg.innerHTML = formatCurrency((tNet - tOT)/count);
        dashStats.avgOT.innerHTML = formatCurrency(tOT/count);

        // Populate Dashboard Attendance Table (Truly Independent)
        const attBody = document.getElementById('dash-attendance-body');
        const attYearLabel = document.getElementById('att-view-year-label');
        if (attBody) {
            attBody.innerHTML = '';
            attYearLabel.textContent = `YEAR: ${year === 'all' ? 'All-Time' : year}`;
            
            const attendanceRecords = getAttendanceRecords().sort((a,b) => new Date(a.month) - new Date(b.month));
            const filteredAtt = year === 'all' ? attendanceRecords : attendanceRecords.filter(r => r.month.startsWith(year));

            let dm=0, dw=0, doff=0, dg=0, da=0, dl=0, dc=0, dp=0;
            
            filteredAtt.forEach(r => {
                const mDays = parseNumber(r.totalDays) || 30;
                const worked = parseNumber(r.actualWorkedDays) || 0;
                const offs = parseNumber(r.weeklyOffs) || 0;
                const gh = parseNumber(r.ghDays) || 0;
                const abs = parseNumber(r.absentDays) || 0;
                const lve = parseNumber(r.leaveDays) || 0;
                const cpl = parseNumber(r.cplDays) || 0;
                const pay = parseNumber(r.withPayDays) || 0;
                
                dm += mDays; dw += worked; doff += offs; dg += gh; da += abs; dl += lve; dc += cpl; dp += pay;

                const tr = document.createElement('tr');
                tr.style.borderBottom = '1px solid #f1f5f9';
                tr.innerHTML = `
                    <td style="padding: 8px; font-weight: bold; color: var(--text-primary);">${formatShortMonth(r.month)}</td>
                    <td style="padding: 8px;">${mDays}</td>
                    <td style="padding: 8px; background: #f0fdf4; font-weight: bold; color: #16a34a;">${worked.toFixed(2)}</td>
                    <td style="padding: 8px;">${offs}</td>
                    <td style="padding: 8px;">${gh}</td>
                    <td style="padding: 8px;">${abs.toFixed(2)}</td>
                    <td style="padding: 8px;">${lve.toFixed(2)}</td>
                    <td style="padding: 8px; color: #10b981;">${cpl.toFixed(2)}</td>
                    <td style="padding: 8px; color: #10b981;">${pay.toFixed(2)}</td>
                    <td style="padding: 8px;">
                        <div style="display: flex; gap: 5px; justify-content: center;">
                            <button class="att-edit-btn" data-month="${r.month}" style="background: none; border: none; cursor: pointer; font-size: 0.9rem;">✏️</button>
                            <button class="att-delete-btn" data-month="${r.month}" style="background: none; border: none; cursor: pointer; font-size: 0.9rem;">🗑️</button>
                        </div>
                    </td>
                `;
                attBody.appendChild(tr);
            });

            // Re-attach listeners
            document.querySelectorAll('.att-edit-btn').forEach(btn => btn.addEventListener('click', () => {
                const r = getAttendanceRecords().find(x => x.month === btn.dataset.month);
                if (r) {
                    document.getElementById('att-month').value = r.month;
                    document.getElementById('att-total-days').value = r.totalDays;
                    document.getElementById('att-weekly-offs').value = r.weeklyOffs;
                    document.getElementById('att-gh-days').value = r.ghDays;
                    document.getElementById('att-absent-days').value = r.absentDays;
                    document.getElementById('att-leave-days').value = r.leaveDays;
                    document.getElementById('att-cpl-days').value = r.cplDays;
                    document.getElementById('att-with-pay-days').value = r.withPayDays;
                    calculateAtt();
                    attModal.classList.remove('hidden');
                }
            }));
            document.querySelectorAll('.att-delete-btn').forEach(btn => btn.addEventListener('click', () => {
                if (confirm('Delete this attendance record? (Salary record will remain untouched)')) {
                    deleteAttendanceRecord(btn.dataset.month);
                }
            }));

            document.getElementById('dash-att-total-m').textContent = dm;
            document.getElementById('dash-att-total-w').textContent = dw.toFixed(2);
            document.getElementById('dash-att-total-o').textContent = doff;
            document.getElementById('dash-att-total-g').textContent = dg;
            document.getElementById('dash-att-total-a').textContent = da.toFixed(2);
            document.getElementById('dash-att-total-l').textContent = dl.toFixed(2);
            document.getElementById('dash-att-total-c').textContent = dc.toFixed(2);
            document.getElementById('dash-att-total-p').textContent = dp.toFixed(2);

            // Populate Home Summary Card
            document.getElementById('dash-stat-worked').innerHTML = `<small>Days</small> ${dw.toFixed(2)}`;
            document.getElementById('dash-stat-total').textContent = dm;
            document.getElementById('dash-stat-absent').textContent = da.toFixed(2);
            document.getElementById('dash-stat-leave').textContent = dl.toFixed(2);
            document.getElementById('dash-stat-cpl').textContent = (dc + dp).toFixed(2);
        }

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
                <td class="deduction-text">${formatNumber(f.tax || 0)}</td>
                <td>${f.remarks || '-'}</td>
                <td>
                    <div class="table-actions">
                        <button class="btn-icon-table edit-fund-btn" data-id="${f.id}">✏️</button>
                        <button class="btn-icon-table delete-fund-btn" data-id="${f.id}">🗑️</button>
                    </div>
                </td>
            `;
            fundsTableBody.appendChild(tr);
        });
        
        document.querySelectorAll('.edit-fund-btn').forEach(btn => btn.addEventListener('click', () => {
            const f = getFunds().find(x => x.id == btn.dataset.id);
            document.getElementById('fund-id').value = f.id;
            document.getElementById('funds-month').value = f.month;
            document.getElementById('funds-type').value = f.type;
            document.getElementById('funds-amount').value = f.amount;
            document.getElementById('funds-tax').value = f.tax || '0';
            document.getElementById('funds-remarks').value = f.remarks || '';
            fundsModal.classList.remove('hidden');
        }));

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

        renderHeatmap();
    };

    const renderHeatmap = () => {
        const container = document.getElementById('salary-heatmap-container');
        if (!container) return;
        
        const records = getRecords();
        const dataMap = {};
        let maxPay = 0;
        
        records.forEach(r => {
            const pay = parseNumber(r.netPayable);
            dataMap[r.month] = (dataMap[r.month] || 0) + pay;
        });

        Object.values(dataMap).forEach(v => { if (v > maxPay) maxPay = v; });

        const years = [...new Set(records.map(x => x.month?.split('-')[0]))].sort((a,b) => b-a);
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

        let html = '<div class="heatmap-grid"><div></div>';
        months.forEach(m => html += `<div class="heatmap-month-label">${m}</div>`);

        years.forEach(year => {
            html += `<div class="heatmap-year-label">${year}</div>`;
            for (let m = 1; m <= 12; m++) {
                const mKey = `${year}-${m.toString().padStart(2, '0')}`;
                const val = dataMap[mKey] || 0;
                const intensity = maxPay > 0 ? (val / maxPay) : 0;
                
                const isLight = document.documentElement.getAttribute('data-theme') === 'light';
                let color = isLight ? 'rgba(0, 0, 0, 0.04)' : 'rgba(255, 255, 255, 0.05)';
                
                if (val > 0) {
                    color = `rgba(16, 185, 129, ${Math.max(0.2, intensity)})`;
                }

                const tooltip = val > 0 ? `${months[m-1]} ${year} | Net Salary: PKR ${formatNumber(val)}` : 'No Data';
                html += `<div class="heatmap-cell" style="background: ${color}" data-tooltip="${tooltip}"></div>`;
            }
        });
        html += '</div>';
        container.innerHTML = html;
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
                <td>${formatNumber(Math.round(r.salary))}</td>
                <td>${formatNumber(Math.round(r.pfDeduction))}</td>
                <td>${formatNumber(Math.round(r.eobiDeduction))}</td>
                <td>${formatNumber(Math.round(r.incomeTax))}</td>
                <td>${formatNumber(Math.round(r.withoutPay))}</td>
                <td class="deduction-text">${formatNumber(Math.round(r.shortTimeAmount || 0))}</td>
                <td class="deduction-text">${formatNumber(Math.round(r.overallDeduction))}</td>
                <td class="addition-text">${formatNumber(Math.round(parseNumber(r.otAmount) || (parseNumber(r.grossSalary) - parseNumber(r.salary))))}</td>
                <td class="addition-text">${formatNumber(Math.round(r.grossSalary))}</td>
                <td class="net-text">${formatNumber(Math.round(r.netPayable))}</td>
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
            
            // Clear and Populate Custom Deductions
            document.getElementById('custom-deductions-list').innerHTML = '';
            if (r.customDeductions) {
                r.customDeductions.forEach(cd => addCustomDeductionRow(cd.label, cd.val));
            }

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
    
    openSalaryBtn.addEventListener('click', () => {
        form.reset();
        document.getElementById('custom-deductions-list').innerHTML = '';
        inputs.month.value = new Date().toISOString().slice(0, 7);
        salaryModal.classList.remove('hidden');
        calculate();
    });

    openFundsBtn.addEventListener('click', () => {
        document.getElementById('funds-form').reset();
        document.getElementById('fund-id').value = '';
        document.getElementById('funds-month').value = new Date().toISOString().slice(0, 7);
        fundsModal.classList.remove('hidden');
    });

    document.getElementById('funds-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const id = document.getElementById('fund-id').value || Date.now();
        const fund = {
            id: id,
            month: document.getElementById('funds-month').value,
            type: document.getElementById('funds-type').value,
            amount: document.getElementById('funds-amount').value,
            tax: document.getElementById('funds-tax').value || '0',
            remarks: document.getElementById('funds-remarks').value
        };
        
        const funds = getFunds();
        const existingIndex = funds.findIndex(f => f.id == id);
        if (existingIndex >= 0) funds[existingIndex] = fund;
        else funds.push(fund);
        
        if (db) {
            db.ref('funds_records/' + id).set(fund);
        } else {
            localStorage.setItem(FUNDS_STORAGE_KEY, JSON.stringify(funds));
            updateDashboard();
        }
        
        showToast(existingIndex >= 0 ? 'Fund Updated!' : 'Fund Added!', 'success');
        fundsModal.classList.add('hidden');
    });

    document.getElementById('confirm-delete-btn').addEventListener('click', () => {
        if (!deleteTarget) return;
        if (deleteTarget.type === 'record') {
            const records = getRecords().filter(r => r.month !== deleteTarget.id);
            if (db) db.ref('salary_records/' + deleteTarget.id.replace('-', '_')).remove();
            else {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
                renderTable();
                updateDashboard();
            }
            addLog('DELETE', 'SALARY', deleteTarget.id);
        } else {
            const funds = getFunds().filter(f => f.id != deleteTarget.id);
            if (db) db.ref('funds_records/' + deleteTarget.id).remove();
            else {
                localStorage.setItem(FUNDS_STORAGE_KEY, JSON.stringify(funds));
                updateDashboard();
            }
            addLog('DELETE', 'FUND', deleteTarget.id);
        }
        deleteModal.classList.add('hidden');
        showToast('Record Deleted Successfully', 'success');
    });

    document.getElementById('cancel-delete').addEventListener('click', () => deleteModal.classList.add('hidden'));
    document.querySelectorAll('.close-modal').forEach(btn => btn.addEventListener('click', (e) => {
        e.target.closest('.modal-overlay').classList.add('hidden');
    }));

    form.addEventListener('input', calculate);
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const data = {};
        Object.keys(inputs).forEach(k => data[k] = inputs[k].value);
        
        // Capture Custom Deductions
        data.customDeductions = [];
        document.querySelectorAll('.custom-deduction-row').forEach(row => {
            const label = row.querySelector('.custom-deduct-label').value;
            const val = row.querySelector('.custom-deduct-value').value;
            if (label) data.customDeductions.push({ label, val });
        });

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
        const allTabs = [tabAttendance, tabSalary, tabFunds, tabInsights, tabCompare, tabLogs];
        const allSections = [attendanceSection, salarySection, fundsSection, insightsSection, compareSection, logsSection];
        
        allTabs.forEach(t => t?.classList.remove('active'));
        allSections.forEach(s => s?.classList.add('d-none'));
        
        document.getElementById(tabId).classList.add('active');
        document.getElementById(sectionId).classList.remove('d-none');
    };

    tabAttendance.addEventListener('click', () => switchTab('tab-attendance', 'attendance-section'));
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
            lockedState[targetId] = false; // Disable auto-calc for this field
            btn.textContent = '🔓';
            btn.style.color = 'var(--accent-primary)';
        } else {
            target.readOnly = true;
            target.classList.add('auto-calc');
            lockedState[targetId] = true; // Re-enable auto-calc
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
            if (db) db.ref('vault_settings/pin').set(next);
            localStorage.setItem('vault_pin', next);
        }
        
        if (email) {
            if (db) db.ref('vault_settings/recovery_email').set(email);
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
            if (db) db.ref('vault_settings/pin').set(newPin);
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

    const addCustomDeductionRow = (label = '', value = '') => {
        const list = document.getElementById('custom-deductions-list');
        const row = document.createElement('div');
        row.className = 'custom-deduction-row';
        row.style.cssText = 'display: flex; gap: 0.8rem; align-items: center; animation: vaultEntry 0.3s ease;';
        row.innerHTML = `
            <input type="text" class="custom-deduct-label" placeholder="Category (e.g. Loan)" value="${label}" style="flex: 2; height: 38px; font-size: 0.8rem;">
            <input type="text" class="custom-deduct-value" placeholder="Amount" value="${value}" style="flex: 1; height: 38px; font-size: 0.8rem;">
            <button type="button" class="btn-icon-table remove-custom-deduct" style="background: var(--accent-danger); color: white; border-radius: 8px; width: 32px; height: 32px;">&times;</button>
        `;
        list.appendChild(row);
        
        row.querySelector('.remove-custom-deduct').onclick = () => {
            row.remove();
            calculate();
        };
        
        row.querySelectorAll('input').forEach(inp => inp.oninput = calculate);
    };

    document.getElementById('add-custom-deduction')?.addEventListener('click', () => addCustomDeductionRow());

    const renderAuditDrawer = () => {
        const records = getRecords();
        const funds = getFunds();
        const auditList = document.getElementById('audit-stats-list');
        if (!auditList) return;
        
        const totalNet = records.reduce((sum, r) => sum + parseNumber(r.netPayable), 0);
        const totalGross = records.reduce((sum, r) => sum + parseNumber(r.grossSalary), 0);
        const peakMonth = records.length ? [...records].sort((a,b) => parseNumber(b.grossSalary) - parseNumber(a.grossSalary))[0] : null;
        const avgSalary = records.length ? (totalGross / records.length) : 0;
        
        // AI Wealth Projection
        const projection = avgSalary * 12;
        const taxSafety = avgSalary < 100000 ? '90%' : (avgSalary < 200000 ? '60%' : '30%');

        auditList.innerHTML = `
            <div class="audit-section-title">📊 PERFORMANCE AUDIT</div>
            <div class="audit-item">
                <div class="audit-label">Lifetime Net Income</div>
                <div class="audit-value">${formatNumber(totalNet)}</div>
                <div class="audit-sub">Cumulative actual payout</div>
            </div>
            <div class="audit-item">
                <div class="audit-label">Peak Earning Month</div>
                <div class="audit-value">${peakMonth ? formatShortMonth(peakMonth.month) : '-'}</div>
                <div class="audit-sub">${peakMonth ? formatNumber(peakMonth.grossSalary) : 'No records yet'}</div>
            </div>

            <div class="audit-section-title ai-gradient">🧠 AI NEURAL ENGINE</div>
            <div class="audit-item ai-item">
                <div class="audit-label">Projected Annual Wealth</div>
                <div class="audit-value ai-text">${formatNumber(projection)}</div>
                <div class="audit-sub">Based on your current average pace</div>
            </div>
            <div class="audit-item ai-item">
                <div class="audit-label">Tax Bracket Guard</div>
                <div class="audit-value" style="color: var(--accent-warning)">${taxSafety} SAFE</div>
                <div class="audit-sub">Capacity before next tax jump</div>
            </div>
            <div class="audit-item">
                <div class="audit-label">Total Extra Funds</div>
                <div class="audit-value" style="color: var(--accent-secondary)">${formatNumber(funds.reduce((sum, f) => sum + parseNumber(f.amount), 0))}</div>
                <div class="audit-sub">Arrears, Bonuses, Incentives</div>
            </div>
        `;
    };

    document.getElementById('open-audit-btn')?.addEventListener('click', () => {
        renderAuditDrawer();
        document.getElementById('audit-drawer')?.classList.add('active');
    });

    document.getElementById('close-audit')?.addEventListener('click', () => {
        document.getElementById('audit-drawer')?.classList.remove('active');
    });

    const logoutBtn = document.getElementById('logout-btn');
    const logoutModal = document.getElementById('logout-confirm-modal');
    const confirmLogoutBtn = document.getElementById('confirm-logout-btn');
    const cancelLogoutBtn = document.getElementById('cancel-logout-btn');

    if (logoutBtn && logoutModal) {
        logoutBtn.onclick = () => {
            logoutModal.classList.remove('hidden');
        };
        
        cancelLogoutBtn.onclick = () => {
            logoutModal.classList.add('hidden');
        };

        confirmLogoutBtn.onclick = () => {
            logoutModal.classList.add('hidden');
            window.lockVault();
        };

        // Close on overlay click
        logoutModal.onclick = (e) => {
            if (e.target === logoutModal) logoutModal.classList.add('hidden');
        };
    }

    const generateAuditReport = (targetYear) => {
        const records = getRecords().sort((a,b) => new Date(a.month) - new Date(b.month));
        const funds = getFunds().sort((a,b) => new Date(a.month) - new Date(b.month));
        
        const filteredRecords = targetYear === 'all' ? records : records.filter(r => r.month.startsWith(targetYear));
        const filteredFunds = targetYear === 'all' ? funds : funds.filter(f => f.month.startsWith(targetYear));

        if (filteredRecords.length === 0 && filteredFunds.length === 0) {
            showToast('No data found for this period', 'error');
            return;
        }

        let totalGross = 0, totalDeduct = 0, totalNet = 0, totalFunds = 0;
        
        // Populate stats
        filteredRecords.forEach(r => {
            totalGross += parseNumber(r.grossSalary);
            totalDeduct += parseNumber(r.overallDeduction);
            totalNet += parseNumber(r.netPayable);
        });
        
        filteredFunds.forEach(f => {
            totalFunds += (parseNumber(f.amount) - parseNumber(f.tax || 0));
        });

        document.getElementById('audit-total-gross').textContent = `PKR ${formatNumber(totalGross)}`;
        document.getElementById('audit-total-deduct').textContent = `PKR ${formatNumber(totalDeduct)}`;
        document.getElementById('audit-total-net').textContent = `PKR ${formatNumber(totalNet)}`;
        document.getElementById('audit-total-funds').textContent = `PKR ${formatNumber(totalFunds)}`;
        document.getElementById('audit-gen-date').textContent = `Report Generated: ${new Date().toLocaleDateString()}`;
        document.getElementById('audit-report-subtitle').textContent = targetYear === 'all' ? 'All-Time Financial Performance' : `${targetYear} Financial Audit`;

        const tableBody = document.getElementById('audit-table-body');
        tableBody.innerHTML = '';

        // Merge and sort for table
        const allMonths = [...new Set([...filteredRecords, ...filteredFunds].map(x => x.month))].sort();
        
        allMonths.forEach(m => {
            const r = filteredRecords.find(x => x.month === m);
            const fList = filteredFunds.filter(x => x.month === m);
            const fundSum = fList.reduce((acc, curr) => acc + (parseNumber(curr.amount) - parseNumber(curr.tax || 0)), 0);
            
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td style="padding: 8px; border-bottom: 1px solid #f1f5f9;">${formatShortMonth(m)}</td>
                <td style="padding: 8px; border-bottom: 1px solid #f1f5f9; text-align: right;">${r ? formatNumber(r.grossSalary) : '0'}</td>
                <td style="padding: 8px; border-bottom: 1px solid #f1f5f9; text-align: right; color: #ef4444;">${r ? formatNumber(r.overallDeduction) : '0'}</td>
                <td style="padding: 8px; border-bottom: 1px solid #f1f5f9; text-align: right; color: #3b82f6;">${r ? formatNumber(r.netPayable) : '0'}</td>
                <td style="padding: 8px; border-bottom: 1px solid #f1f5f9; text-align: right; color: #10b981;">${fundSum > 0 ? formatNumber(fundSum) : '0'}</td>
            `;
            tableBody.appendChild(tr);
        });

        const template = document.getElementById('audit-report-template');
        template.style.display = 'block';

        const opt = {
            margin: 0.2,
            filename: targetYear === 'all' ? 'AllTime_Financial_Summary.pdf' : `Financial_Audit_${targetYear}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true },
            jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
        };

        html2pdf().set(opt).from(template).save().then(() => {
            template.style.display = 'none';
        });
    };

    document.getElementById('export-yearly-audit-btn')?.addEventListener('click', () => {
        const year = filterYear.value;
        if (year === 'all') {
            showToast('Please select a year first', 'warning');
        } else {
            generateAuditReport(year);
        }
    });

    document.getElementById('export-alltime-audit-btn')?.addEventListener('click', () => {
        generateAuditReport('all');
    });

    document.getElementById('export-alltime-audit-btn')?.addEventListener('click', () => {
        generateAuditReport('all');
    });

    const generateTaxCertificate = (mode, targetYear) => {
        const records = getRecords().sort((a,b) => new Date(a.month) - new Date(b.month));
        const funds = getFunds().sort((a,b) => new Date(a.month) - new Date(b.month));
        
        let filteredRecords = [];
        let filteredFunds = [];
        let subtitle = "";

        if (mode === 'all') {
            filteredRecords = records;
            filteredFunds = funds;
            subtitle = "All-Time Accumulative Tax Certificate";
        } else if (mode === 'linear') {
            filteredRecords = records.filter(r => r.month.startsWith(targetYear));
            filteredFunds = funds.filter(f => f.month.startsWith(targetYear));
            subtitle = `January ${targetYear} to December ${targetYear}`;
        } else if (mode === 'fiscal') {
            const startYear = parseInt(targetYear) - 1;
            const startDate = `${startYear}-07`;
            const endDate = `${targetYear}-06`;
            filteredRecords = records.filter(r => r.month >= startDate && r.month <= endDate);
            filteredFunds = funds.filter(f => f.month >= startDate && f.month <= endDate);
            subtitle = `July ${startYear} to June ${targetYear}`;
        }

        if (filteredRecords.length === 0 && filteredFunds.length === 0) {
            showToast('No tax data found for this period', 'error');
            return;
        }

        let sumSalaryTax = 0, sumFundsTax = 0, sumGrossSalary = 0, sumGrossFunds = 0;
        const tableBody = document.getElementById('cert-tax-table-body');
        const tableHeader = document.querySelector('#tax-cert-template thead tr');
        tableBody.innerHTML = '';

        if (mode === 'all') {
            tableHeader.innerHTML = `
                <th style="padding: 6px; border: 1px solid #1a1a1a; text-align: left; width: 40%;">Year</th>
                <th style="padding: 6px; border: 1px solid #1a1a1a; text-align: right; width: 20%;">Salary Tax</th>
                <th style="padding: 6px; border: 1px solid #1a1a1a; text-align: right; width: 20%;">Funds Tax</th>
                <th style="padding: 6px; border: 1px solid #1a1a1a; text-align: right; width: 20%;">Total Deduction</th>
            `;

            const years = [...new Set([...filteredRecords, ...filteredFunds].map(x => x.month.split('-')[0]))].sort();
            years.forEach(y => {
                const yearRecords = filteredRecords.filter(r => r.month.startsWith(y));
                const yearFunds = filteredFunds.filter(f => f.month.startsWith(y));
                
                const sTax = yearRecords.reduce((acc, curr) => acc + parseNumber(curr.incomeTax), 0);
                const fTax = yearFunds.reduce((acc, curr) => acc + parseNumber(curr.tax || 0), 0);
                
                sumSalaryTax += sTax;
                sumFundsTax += fTax;
                sumGrossSalary += yearRecords.reduce((acc, curr) => acc + parseNumber(curr.grossSalary), 0);
                sumGrossFunds += yearFunds.reduce((acc, curr) => acc + parseNumber(curr.amount), 0);

                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td style="padding: 10px; border: 1px solid #1a1a1a; font-weight: bold;">Full Year ${y}</td>
                    <td style="padding: 10px; border: 1px solid #1a1a1a; text-align: right;">${formatNumber(sTax)}</td>
                    <td style="padding: 10px; border: 1px solid #1a1a1a; text-align: right;">${formatNumber(fTax)}</td>
                    <td style="padding: 10px; border: 1px solid #1a1a1a; text-align: right; font-weight: bold;">${formatNumber(sTax + fTax)}</td>
                `;
                tableBody.appendChild(tr);
            });
        } else {
            tableHeader.innerHTML = `
                <th style="padding: 6px; border: 1px solid #1a1a1a; text-align: left; width: 40%;">Month</th>
                <th style="padding: 6px; border: 1px solid #1a1a1a; text-align: right; width: 20%;">Salary Tax</th>
                <th style="padding: 6px; border: 1px solid #1a1a1a; text-align: right; width: 20%;">Funds Tax</th>
                <th style="padding: 6px; border: 1px solid #1a1a1a; text-align: right; width: 20%;">Total Deduction</th>
            `;

            const allMonths = [...new Set([...filteredRecords, ...filteredFunds].map(x => x.month))].sort();
            allMonths.forEach(m => {
                const r = filteredRecords.find(x => x.month === m);
                const fList = filteredFunds.filter(x => x.month === m);
                const sTax = r ? parseNumber(r.incomeTax) : 0;
                const fTax = fList.reduce((acc, curr) => acc + parseNumber(curr.tax || 0), 0);
                
                sumSalaryTax += sTax;
                sumFundsTax += fTax;
                sumGrossSalary += r ? parseNumber(r.grossSalary) : 0;
                sumGrossFunds += fList.reduce((acc, curr) => acc + parseNumber(curr.amount), 0);

                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td style="padding: 10px; border: 1px solid #1a1a1a;">${formatMonth(m)}</td>
                    <td style="padding: 10px; border: 1px solid #1a1a1a; text-align: right;">${formatNumber(sTax)}</td>
                    <td style="padding: 10px; border: 1px solid #1a1a1a; text-align: right;">${formatNumber(fTax)}</td>
                    <td style="padding: 10px; border: 1px solid #1a1a1a; text-align: right; font-weight: bold;">${formatNumber(sTax + fTax)}</td>
                `;
                tableBody.appendChild(tr);
            });
        }

        const totalTax = sumSalaryTax + sumFundsTax;
        const totalGross = sumGrossSalary + sumGrossFunds;

        document.getElementById('cert-sum-salary-tax').textContent = formatNumber(sumSalaryTax);
        document.getElementById('cert-sum-funds-tax').textContent = formatNumber(sumFundsTax);
        document.getElementById('cert-sum-total-tax').textContent = formatNumber(totalTax);
        document.getElementById('cert-tax-total-val').textContent = formatNumber(totalTax);
        document.getElementById('cert-tax-period').textContent = subtitle;
        document.getElementById('cert-issue-date').textContent = new Date().toLocaleDateString();

        // Narrative Summary
        document.getElementById('cert-tax-summary-line').innerHTML = `
            During this period, the individual earned a total gross income of <strong>PKR ${formatNumber(totalGross)}</strong>, 
            comprising <strong>PKR ${formatNumber(sumGrossSalary)}</strong> from regular salary and 
            <strong>PKR ${formatNumber(sumGrossFunds)}</strong> from managed funds, 
            with a total tax deduction of <strong>PKR ${formatNumber(totalTax)}</strong>.
        `;

        const template = document.getElementById('tax-cert-template');
        template.style.display = 'block';

        const opt = {
            margin: [0.5, 0.5, 0.5, 0.5],
            filename: `Tax_Certificate_${targetYear}_${mode}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, logging: false, useCORS: true },
            jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
        };

        html2pdf().set(opt).from(template).save().then(() => {
            template.style.display = 'none';
        });
    };

    const taxModal = document.getElementById('tax-period-modal');
    document.getElementById('export-tax-cert-btn')?.addEventListener('click', () => {
        const years = [...new Set(getRecords().map(r => r.month.split('-')[0]))].sort((a,b) => b-a);
        const sel = document.getElementById('tax-base-year');
        sel.innerHTML = years.map(y => `<option value="${y}">${y}</option>`).join('');
        taxModal.classList.remove('hidden');
    });

    document.getElementById('close-tax-period-modal')?.addEventListener('click', () => taxModal.classList.add('hidden'));
    document.getElementById('btn-tax-linear')?.addEventListener('click', () => {
        generateTaxCertificate('linear', document.getElementById('tax-base-year').value);
        taxModal.classList.add('hidden');
    });
    document.getElementById('btn-tax-fiscal')?.addEventListener('click', () => {
        generateTaxCertificate('fiscal', document.getElementById('tax-base-year').value);
        taxModal.classList.add('hidden');
    });
    document.getElementById('btn-tax-alltime')?.addEventListener('click', () => {
        generateTaxCertificate('all', 'All');
        taxModal.classList.add('hidden');
    });

    const generateAttendanceSummary = (targetYear) => {
        const records = getAttendanceRecords().sort((a,b) => new Date(a.month) - new Date(b.month));
        const filtered = targetYear === 'all' ? records : records.filter(r => r.month.startsWith(targetYear));

        if (filtered.length === 0) {
            showToast('No attendance records for this period', 'error');
            return;
        }

        document.getElementById('att-summary-title').textContent = targetYear === 'all' ? 'Working Days Summary (All-Time)' : `Working Days of ${targetYear}`;
        const tableBody = document.getElementById('att-summary-body');
        tableBody.innerHTML = '';

        let tMonth=0, tWorked=0, tOffs=0, tGH=0, tAbsent=0, tLeave=0, tCPL=0, tPay=0, tDays=0;

        filtered.forEach(r => {
            const mDays = parseNumber(r.totalDays) || 30;
            const worked = parseNumber(r.actualWorkedDays) || 0;
            const offs = parseNumber(r.weeklyOffs) || 0;
            const gh = parseNumber(r.ghDays) || 0;
            const abs = parseNumber(r.absentDays) || 0;
            const lve = parseNumber(r.leaveDays) || 0;
            const cpl = parseNumber(r.cplDays) || 0;
            const pay = parseNumber(r.withPayDays) || 0;
            const total = mDays;

            tMonth += mDays; tWorked += worked; tOffs += offs; tGH += gh; 
            tAbsent += abs; tLeave += lve; tCPL += cpl; tPay += pay; tDays += total;

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td style="padding: 6px; border: 1px solid #16a34a; text-align: left;">${formatShortMonth(r.month)}</td>
                <td style="padding: 6px; border: 1px solid #16a34a; text-align: center;">${mDays}</td>
                <td style="padding: 6px; border: 1px solid #16a34a; text-align: center; font-weight: bold;">${worked.toFixed(2)}</td>
                <td style="padding: 6px; border: 1px solid #16a34a; text-align: center;">${offs}</td>
                <td style="padding: 6px; border: 1px solid #16a34a; text-align: center;">${gh}</td>
                <td style="padding: 6px; border: 1px solid #16a34a; text-align: center;">${abs}</td>
                <td style="padding: 6px; border: 1px solid #16a34a; text-align: center;">${lve}</td>
                <td style="padding: 6px; border: 1px solid #16a34a; text-align: center;">${cpl}</td>
                <td style="padding: 6px; border: 1px solid #16a34a; text-align: center;">${pay}</td>
                <td style="padding: 6px; border: 1px solid #16a34a; text-align: center; font-weight: bold;">${total}</td>
            `;
            tableBody.appendChild(tr);
        });

        document.getElementById('att-total-month').textContent = tMonth;
        document.getElementById('att-total-worked').textContent = tWorked.toFixed(2);
        document.getElementById('att-total-offs').textContent = tOffs;
        document.getElementById('att-total-gh').textContent = tGH;
        document.getElementById('att-total-absent').textContent = tAbsent;
        document.getElementById('att-total-leave').textContent = tLeave.toFixed(2);
        document.getElementById('att-total-cpl').textContent = tCPL;
        document.getElementById('att-total-pay').textContent = tPay;
        document.getElementById('att-total-days').textContent = tDays;

        const template = document.getElementById('attendance-summary-template');
        template.style.display = 'block';

        const opt = {
            margin: 0.3,
            filename: `Attendance_Summary_${targetYear}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, logging: false, useCORS: true },
            jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
        };

        html2pdf().set(opt).from(template).save().then(() => {
            template.style.display = 'none';
        });
    };

    document.getElementById('export-attendance-btn')?.addEventListener('click', () => {
        const year = filterYear.value;
        generateAttendanceSummary(year);
    });

    // Attendance Modal Logic
    const attModal = document.getElementById('attendance-modal');
    const attForm = document.getElementById('attendance-form');
    const attMonthInput = document.getElementById('att-month');
    const attInputs = ['att-total-days', 'att-weekly-offs', 'att-gh-days', 'att-absent-days', 'att-leave-days', 'att-cpl-days', 'att-with-pay-days'];
    
    const calculateAtt = () => {
        const total = parseNumber(document.getElementById('att-total-days').value) || 0;
        const offs = parseNumber(document.getElementById('att-weekly-offs').value) || 0;
        const gh = parseNumber(document.getElementById('att-gh-days').value) || 0;
        const abs = parseNumber(document.getElementById('att-absent-days').value) || 0;
        const lve = parseNumber(document.getElementById('att-leave-days').value) || 0;
        const cpl = parseNumber(document.getElementById('att-cpl-days').value) || 0;
        const pay = parseNumber(document.getElementById('att-with-pay-days').value) || 0;
        
        const worked = total - offs - gh - abs - lve + cpl + pay;
        document.getElementById('att-calc-worked').textContent = worked.toFixed(2);
    };

    document.getElementById('open-attendance-modal')?.addEventListener('click', () => {
        attMonthInput.value = new Date().toISOString().slice(0, 7);
        calculateAtt();
        attModal.classList.remove('hidden');
    });

    attInputs.forEach(id => document.getElementById(id).addEventListener('input', calculateAtt));

    attForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const data = {
            month: attMonthInput.value,
            totalDays: document.getElementById('att-total-days').value,
            weeklyOffs: document.getElementById('att-weekly-offs').value,
            ghDays: document.getElementById('att-gh-days').value,
            absentDays: document.getElementById('att-absent-days').value,
            leaveDays: document.getElementById('att-leave-days').value,
            cplDays: document.getElementById('att-cpl-days').value,
            withPayDays: document.getElementById('att-with-pay-days').value,
            actualWorkedDays: document.getElementById('att-calc-worked').textContent
        };
        
        saveAttendanceRecord(data);
        attModal.classList.add('hidden');
    });

    // Final Boot
    initVault();
    updateDashboard();
    renderTable();
    initSimulator();
});
