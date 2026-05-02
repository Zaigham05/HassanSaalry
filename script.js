document.addEventListener('DOMContentLoaded', () => {
    // --- Elements ---
    const form = document.getElementById('salary-form');
    const recordsTableBody = document.getElementById('records-body');
    const statCount = document.getElementById('stat-count');
    const toggleDataBtn = document.getElementById('toggle-data-btn');
    const dataView = document.getElementById('data-view');
    const dashboardCards = document.querySelector('.dashboard-cards');

    const fundsTableBody = document.getElementById('funds-body');
    const fundsCount = document.getElementById('funds-count');
    const tabSalary = document.getElementById('tab-salary');
    const tabFunds = document.getElementById('tab-funds');
    const salarySection = document.getElementById('salary-section');
    const fundsSection = document.getElementById('funds-section');
    const logsSection = document.getElementById('logs-section');
    const logsTableBody = document.getElementById('logs-body');
    const logsCount = document.getElementById('logs-count');
    const tabLogs = document.getElementById('tab-logs');
    const filterYear = document.getElementById('filter-year');

    let deleteTarget = null; // { type: 'record'|'fund', id: string }

    // Dashboard Stat Elements
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

    // Modal Elements
    const salaryModal = document.getElementById('salary-modal');
    const fundsModal = document.getElementById('funds-modal');
    const addSalaryBtn = document.getElementById('add-salary-btn');
    const addFundsBtn = document.getElementById('add-funds-btn');
    const deleteModal = document.getElementById('delete-modal');
    const confirmDeleteBtn = document.getElementById('confirm-delete-btn');
    const cancelDeleteBtn = document.getElementById('cancel-delete');
    const closeBtns = document.querySelectorAll('.close-modal');

    const fundsForm = document.getElementById('funds-form');

    // Input elements
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

    // State for locked fields
    const lockedState = {
        'pf-deduction': true,
        'eobi-deduction': true,
        'income-tax': true
    };

    // --- Firebase Configuration ---
    // PASTE YOUR FIREBASE CONFIG HERE
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

    // Initialize Firebase if config is provided
    let db = null;
    if (firebaseConfig.apiKey !== "YOUR_API_KEY") {
        firebase.initializeApp(firebaseConfig);
        db = firebase.database();
    }

    // --- Local Storage Management ---
    const STORAGE_KEY = 'salary_analysis_records';
    const FUNDS_STORAGE_KEY = 'salary_funds_records';
    const LOGS_STORAGE_KEY = 'salary_activity_logs';

    let monthToDelete = null;

    function getRecords() {
        const records = localStorage.getItem(STORAGE_KEY);
        return records ? JSON.parse(records) : [];
    }

    function getFunds() {
        const funds = localStorage.getItem(FUNDS_STORAGE_KEY);
        return funds ? JSON.parse(funds) : [];
    }

    function getLogs() {
        const logs = localStorage.getItem(LOGS_STORAGE_KEY);
        return logs ? JSON.parse(logs) : [];
    }

    // --- Firebase Sync Logic (One-time setup) ---
    function setupFirebaseSync() {
        if (!db) {
            console.warn("Firebase not initialized. Using local storage only.");
            return;
        }

        try {
            // Create a small status indicator in the UI
            const statusDiv = document.createElement('div');
            statusDiv.id = 'cloud-status';
            statusDiv.style = 'position:fixed; bottom:10px; right:10px; font-size:10px; color:#64748b; background:rgba(15,23,42,0.8); padding:4px 8px; border-radius:4px; z-index:9999; border:1px solid rgba(255,255,255,0.1);';
            statusDiv.textContent = '☁️ Connecting...';
            document.body.appendChild(statusDiv);

            // Listen for Salary Records
            db.ref('salary_records').on('value', (snapshot) => {
                try {
                    const data = snapshot.val();
                    statusDiv.textContent = '☁️ Cloud Synced';
                    statusDiv.style.color = '#10b981'; // Green
                    
                    if (data) {
                        const recordsArray = Object.values(data).sort((a, b) => new Date(b.month) - new Date(a.month));
                        localStorage.setItem(STORAGE_KEY, JSON.stringify(recordsArray));
                        renderTable();
                        renderFundsTable();
                        updateDashboard();
                    }
                } catch (e) {
                    console.error("Error processing Firebase data:", e);
                    statusDiv.textContent = '⚠️ Sync Error';
                    statusDiv.style.color = '#ef4444';
                }
            }, (error) => {
                console.error("Firebase permission error:", error);
                statusDiv.textContent = '🚫 Access Denied';
                statusDiv.style.color = '#ef4444';
            });

            // Listen for Funds
            db.ref('funds_records').on('value', (snapshot) => {
                const data = snapshot.val();
                if (data) {
                    localStorage.setItem(FUNDS_STORAGE_KEY, JSON.stringify(Object.values(data)));
                    renderFundsTable();
                    updateDashboard();
                }
            });

            // Listen for Logs
            db.ref('activity_logs').limitToLast(100).on('value', (snapshot) => {
                const data = snapshot.val();
                if (data) {
                    localStorage.setItem(LOGS_STORAGE_KEY, JSON.stringify(Object.values(data)));
                    renderLogsTable();
                }
            });
        } catch (err) {
            console.error("Firebase setup failed:", err);
        }
    }

    function saveRecord(record) {
        const records = getRecords();
        const existingIndex = records.findIndex(r => r.month === record.month);
        const action = existingIndex >= 0 ? 'EDIT' : 'ADD';

        if (db) {
            const firebaseKey = record.month.replace('-', '_');
            db.ref('salary_records/' + firebaseKey).set(record);
        } else {
            if (existingIndex >= 0) {
                records[existingIndex] = record;
            } else {
                records.push(record);
            }
            records.sort((a, b) => new Date(b.month) - new Date(a.month));
            localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
            renderTable();
            updateDashboard();
        }
        addLog(action, 'SALARY', record.month, `Amt: ${record.netPayable}`);
    }

    function saveFund(fund) {
        if (db) {
            db.ref('funds_records/' + fund.id).set(fund);
        } else {
            const fundsList = getFunds();
            fundsList.push(fund);
            localStorage.setItem(FUNDS_STORAGE_KEY, JSON.stringify(fundsList));
            updateDashboard();
        }
        addLog('ADD', 'FUND', fund.type, `Amt: ${fund.amount} (${fund.month})`);
    }

    // --- Helper Functions ---
    function parseNumber(val) {
        if (!val) return 0;
        if (typeof val === 'number') return val;
        return parseFloat(val.toString().replace(/,/g, '')) || 0;
    }

    function formatNumber(amount) {
        if (!amount && amount !== 0) return '';
        const num = parseNumber(amount);
        // If it's a decimal (like 1.5), keep the decimal. If it's whole, keep it whole.
        return new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        }).format(num);
    }

    function parseTimeToHours(timeStr) {
        if (!timeStr) return 0;
        const parts = timeStr.split(':');
        const hours = parseInt(parts[0], 10) || 0;
        const minutes = parseInt(parts[1], 10) || 0;
        const seconds = parseInt(parts[2], 10) || 0;
        return hours + (minutes / 60) + (seconds / 3600);
    }

    function formatCurrency(amount) {
        return '<small>PKR</small> ' + new Intl.NumberFormat('en-US').format(Math.round(parseNumber(amount)));
    }

    function formatMonth(monthStr) {
        if (!monthStr) return '';
        const [year, month] = monthStr.split('-');
        const date = new Date(year, month - 1);
        return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }).toUpperCase();
    }

    function calculateIncomeTax(monthlySalary) {
        const annual = monthlySalary * 12;
        let annualTax = 0;

        if (annual <= 600000) {
            annualTax = 0;
        } else if (annual <= 1200000) {
            annualTax = (annual - 600000) * 0.01;
        } else if (annual <= 2200000) {
            annualTax = 6000 + (annual - 1200000) * 0.11;
        } else if (annual <= 3200000) {
            annualTax = 116000 + (annual - 2200000) * 0.23;
        } else if (annual <= 4100000) {
            annualTax = 346000 + (annual - 3200000) * 0.30;
        } else {
            annualTax = 616000 + (annual - 4100000) * 0.35;
        }

        // Surcharge
        if (annual > 10000000) {
            annualTax += annualTax * 0.09;
        }

        return Math.round(annualTax / 12);
    }

    // --- Calculation Logic ---
    function calculate() {
        const salary = parseNumber(inputs.salary.value);
        const absentDays = parseNumber(inputs.absentDays.value) || 0;
        
        // Base Salary is now always divided by 26 for rates as per request
        const dailyRate = salary / 26; 
        const hourlyRate = dailyRate / 8;

        const calculatedWorkingDays = Math.max(0, 26 - absentDays);
        inputs.workingDays.value = calculatedWorkingDays;

        const shortTimeHours = parseTimeToHours(inputs.shortTime.value);
        const otTimeHours = parseTimeToHours(inputs.otTime.value);

        const shortTimeAmount = Math.round(shortTimeHours * hourlyRate);
        const otAmount = Math.round(otTimeHours * hourlyRate * 2); // OT is double rate

        inputs.shortTimeAmount.value = formatNumber(shortTimeAmount);
        inputs.otAmount.value = formatNumber(otAmount);

        const grossSalary = Math.round(salary + otAmount);
        inputs.grossSalary.value = formatNumber(grossSalary);

        let pfAmount = 0;
        if (lockedState['pf-deduction']) {
            if (calculatedWorkingDays > 13) {
                pfAmount = Math.round(salary * 0.0834);
            }
        } else {
            pfAmount = Math.round(parseNumber(inputs.pfDeduction.value));
        }
        inputs.pfDeduction.value = formatNumber(pfAmount);

        let eobiAmount = lockedState['eobi-deduction'] ? 270 : Math.round(parseNumber(inputs.eobiDeduction.value));
        inputs.eobiDeduction.value = formatNumber(eobiAmount);

        let incomeTaxAmount = lockedState['income-tax'] ? calculateIncomeTax(grossSalary) : Math.round(parseNumber(inputs.incomeTax.value));
        inputs.incomeTax.value = formatNumber(incomeTaxAmount);

        const withoutPayAmount = Math.round(parseNumber(inputs.withoutPay.value));
        const absentDeduction = Math.round(absentDays * dailyRate);

        const overAllDeduction = pfAmount + eobiAmount + incomeTaxAmount + withoutPayAmount + shortTimeAmount + absentDeduction;
        inputs.overallDeduction.value = formatNumber(overAllDeduction);

        const netPayable = grossSalary - overAllDeduction;
        inputs.netPayable.value = formatNumber(netPayable);
    }

    function updateDashboard() {
        const records = getRecords();
        const funds = getFunds();
        const selectedYear = filterYear.value;

        // Filter data by year
        const filteredRecords = selectedYear === 'all' 
            ? records 
            : records.filter(r => r.month.startsWith(selectedYear));
        
        const filteredFunds = selectedYear === 'all'
            ? funds
            : funds.filter(f => f.month.startsWith(selectedYear));

        updateYearFilter();

        let totalGross = 0;
        let totalBasic = 0;
        let totalOT = 0;
        let totalDeduction = 0;
        let totalPF = 0;
        let totalTax = 0;
        let totalShort = 0;
        let totalEOBI = 0;
        let totalOthers = 0;
        let totalNet = 0;
        let totalFunds = 0;

        filteredRecords.forEach(record => {
            totalBasic += parseNumber(record.salary);
            totalOT += parseNumber(record.otAmount);
            totalPF += parseNumber(record.pfDeduction);
            totalTax += parseNumber(record.incomeTax);
            totalShort += parseNumber(record.shortTimeAmount);
            totalEOBI += parseNumber(record.eobiDeduction);
            totalOthers += (parseNumber(record.withoutPay) + (parseNumber(record.absentDays) * (parseNumber(record.salary) / 26)));
            totalDeduction += parseNumber(record.overallDeduction);
            totalNet += parseNumber(record.netPayable);
        });

        filteredFunds.forEach(f => {
            totalFunds += parseNumber(f.amount);
        });

        // Update UI
        dashStats.gross.innerHTML = formatCurrency(totalNet + totalDeduction);
        dashStats.basic.innerHTML = formatCurrency(totalBasic);
        dashStats.ot.innerHTML = formatCurrency(totalOT);
        if(dashStats.funds) dashStats.funds.innerHTML = formatCurrency(totalFunds);

        dashStats.deduction.innerHTML = formatCurrency(totalDeduction);
        dashStats.pf.innerHTML = formatCurrency(totalPF);
        dashStats.tax.innerHTML = formatCurrency(totalTax);
        dashStats.short.innerHTML = formatCurrency(totalShort);
        if(dashStats.eobi) dashStats.eobi.innerHTML = formatCurrency(totalEOBI);
        dashStats.others.innerHTML = formatCurrency(totalOthers);

        dashStats.net.innerHTML = formatCurrency(totalNet + totalFunds);
        if(dashStats.netReg) dashStats.netReg.innerHTML = formatCurrency(totalNet - totalOT);
        if(dashStats.netOT) dashStats.netOT.innerHTML = formatCurrency(totalOT);

        const avg = filteredRecords.length > 0 ? ((totalNet + totalFunds) / filteredRecords.length) : 0;
        const avgReg = filteredRecords.length > 0 ? ((totalNet - totalOT) / filteredRecords.length) : 0;
        const avgOT = filteredRecords.length > 0 ? (totalOT / filteredRecords.length) : 0;

        dashStats.avg.innerHTML = formatCurrency(avg);
        if(dashStats.avgReg) dashStats.avgReg.innerHTML = formatCurrency(avgReg);
        if(dashStats.avgOT) dashStats.avgOT.innerHTML = formatCurrency(avgOT);
    }

    // --- UI Logic ---
    function setupUnlockButtons() {
        document.querySelectorAll('.unlock-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const targetId = btn.getAttribute('data-target');
                const targetInput = document.getElementById(targetId);
                lockedState[targetId] = !lockedState[targetId];
                
                if (lockedState[targetId]) {
                    targetInput.setAttribute('readonly', 'true');
                    btn.textContent = '🔒';
                    calculate();
                } else {
                    targetInput.removeAttribute('readonly');
                    btn.textContent = '🔓';
                    targetInput.focus();
                }
            });
        });
    }

    function setupModals() {
        addSalaryBtn.addEventListener('click', () => {
            salaryModal.classList.remove('hidden');
        });

        addFundsBtn.addEventListener('click', () => {
            fundsModal.classList.remove('hidden');
        });

        closeBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const targetId = btn.getAttribute('data-target');
                document.getElementById(targetId).classList.add('hidden');
            });
        });

        // Close on outside click
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-overlay')) {
                e.target.classList.add('hidden');
            }
        });
    }

    function renderTable() {
        const records = getRecords();
        const selectedYear = filterYear.value;
        const filtered = selectedYear === 'all' 
            ? records 
            : records.filter(r => r.month.startsWith(selectedYear));

        recordsTableBody.innerHTML = '';
        statCount.textContent = filtered.length;

        if (filtered.length === 0) {
            recordsTableBody.innerHTML = '<tr class="empty-row"><td colspan="11">No records found.</td></tr>';
            return;
        }

        filtered.forEach(record => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${formatMonth(record.month)}</strong></td>
                <td>${formatNumber(record.salary)}</td>
                <td>${formatNumber(record.pfDeduction)}</td>
                <td>${formatNumber(record.eobiDeduction)}</td>
                <td>${formatNumber(record.incomeTax)}</td>
                <td>${formatNumber(record.withoutPay)}</td>
                <td class="deduction-text">${formatNumber(record.overallDeduction)}</td>
                <td class="addition-text">${formatNumber(record.grossSalary)}</td>
                <td class="net-text"><strong>${formatNumber(record.netPayable)}</strong></td>
                <td class="remarks-cell" title="${record.remarks || ''}">${record.remarks || '-'}</td>
                <td>
                    <div class="table-actions">
                        <button class="btn-icon-table edit-btn" data-month="${record.month}" title="Edit">✏️</button>
                        <button class="btn-icon-table delete-btn" data-month="${record.month}" title="Delete">🗑️</button>
                    </div>
                </td>
            `;
            recordsTableBody.appendChild(tr);
        });

        // Add Listeners
        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const month = btn.getAttribute('data-month');
                loadRecordIntoForm(month);
                salaryModal.classList.remove('hidden');
            });
        });

        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                deleteTarget = { type: 'record', id: btn.getAttribute('data-month') };
                deleteModal.classList.remove('hidden');
            });
        });
    }

    function renderFundsTable() {
        const funds = getFunds();
        fundsTableBody.innerHTML = '';
        fundsCount.textContent = funds.length;

        if (funds.length === 0) {
            fundsTableBody.innerHTML = '<tr class="empty-row"><td colspan="5">No managed funds found.</td></tr>';
            return;
        }

        funds.forEach(fund => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${formatMonth(fund.month)}</strong></td>
                <td><span class="badge net-text">${fund.type}</span></td>
                <td class="addition-text"><strong>${formatNumber(fund.amount)}</strong></td>
                <td class="remarks-cell" title="${fund.remarks || ''}">${fund.remarks || '-'}</td>
                <td>
                    <div class="table-actions">
                        <button class="btn-icon-table delete-fund-btn" data-id="${fund.id}" title="Delete">🗑️</button>
                    </div>
                </td>
            `;
            fundsTableBody.appendChild(tr);
        });

        document.querySelectorAll('.delete-fund-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                deleteTarget = { type: 'fund', id: btn.getAttribute('data-id') };
                deleteModal.classList.remove('hidden');
            });
        });
    }

    function addLog(action, itemType, itemId, remarks = '') {
        const log = {
            id: Date.now(),
            timestamp: new Date().toISOString(),
            action: action, // ADD, EDIT, DELETE
            itemType: itemType, // SALARY, FUND
            itemId: itemId,
            remarks: remarks
        };

        if (db) {
            db.ref('activity_logs/' + log.id).set(log);
        } else {
            const logs = getLogs();
            logs.unshift(log);
            localStorage.setItem(LOGS_STORAGE_KEY, JSON.stringify(logs.slice(0, 100)));
            renderLogsTable();
        }
    }

    function renderLogsTable() {
        const logs = getLogs().sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        logsTableBody.innerHTML = '';
        logsCount.textContent = logs.length;

        if (logs.length === 0) {
            logsTableBody.innerHTML = '<tr class="empty-row"><td colspan="5">No recent activity.</td></tr>';
            return;
        }

        logs.forEach(log => {
            const date = new Date(log.timestamp);
            const timeStr = date.toLocaleString();
            const actionClass = log.action === 'DELETE' ? 'deduction-text' : (log.action === 'ADD' ? 'addition-text' : 'net-text');
            
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><small>${timeStr}</small></td>
                <td><span class="badge ${actionClass}">${log.action}</span></td>
                <td>${log.itemType}</td>
                <td><strong>${log.itemId}</strong></td>
                <td>${log.remarks || '-'}</td>
            `;
            logsTableBody.appendChild(tr);
        });
    }

    function updateYearFilter() {
        const records = getRecords();
        const funds = getFunds();
        const years = new Set();
        
        records.forEach(r => years.add(r.month.split('-')[0]));
        funds.forEach(f => years.add(f.month.split('-')[0]));
        
        const sortedYears = Array.from(years).sort((a, b) => b - a);
        const currentVal = filterYear.value;
        
        filterYear.innerHTML = '<option value="all">All Years</option>';
        sortedYears.forEach(year => {
            const option = document.createElement('option');
            option.value = year;
            option.textContent = year;
            filterYear.appendChild(option);
        });
        
        filterYear.value = currentVal;
    }

    function deleteFund(id) {
        const funds = getFunds();
        const fund = funds.find(f => f.id.toString() === id.toString());
        const info = fund ? `${fund.type} (${fund.month})` : id;

        if (db) {
            db.ref('funds_records/' + id).remove();
        } else {
            let filtered = funds.filter(f => f.id.toString() !== id.toString());
            localStorage.setItem(FUNDS_STORAGE_KEY, JSON.stringify(filtered));
            renderFundsTable();
            updateDashboard();
        }
        addLog('DELETE', 'FUND', info);
    }

    function deleteRecord(month) {
        if (db) {
            const firebaseKey = month.replace('-', '_');
            db.ref('salary_records/' + firebaseKey).remove();
        } else {
            let records = getRecords();
            records = records.filter(r => r.month !== month);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
            renderTable();
            updateDashboard();
        }
        addLog('DELETE', 'SALARY', month);
    }

    function loadRecordIntoForm(month) {
        const records = getRecords();
        const record = records.find(r => r.month === month);
        if (!record) return;

        Object.keys(record).forEach(key => {
            if (inputs[key]) {
                const val = record[key];
                if (['salary', 'pfDeduction', 'eobiDeduction', 'incomeTax', 'withoutPay'].includes(key) && val) {
                    inputs[key].value = formatNumber(val);
                } else {
                    inputs[key].value = val;
                }
            }
        });
        calculate();
    }

    // --- Event Listeners ---
    form.addEventListener('input', calculate);

    // Format editable inputs on blur
    ['salary', 'pfDeduction', 'eobiDeduction', 'incomeTax', 'withoutPay'].forEach(key => {
        inputs[key].addEventListener('blur', (e) => {
            if (e.target.value) {
                e.target.value = formatNumber(parseNumber(e.target.value));
            }
        });
    });

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const recordData = {};
        Object.keys(inputs).forEach(key => {
            recordData[key] = inputs[key].value;
        });
        saveRecord(recordData);
        salaryModal.classList.add('hidden');
    });

    fundsForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const data = {
            id: Date.now(),
            month: document.getElementById('funds-month').value,
            type: document.getElementById('funds-type').value,
            amount: document.getElementById('funds-amount').value,
            remarks: document.getElementById('funds-remarks').value
        };
        saveFund(data);
        fundsModal.classList.add('hidden');
        fundsForm.reset();
    });

    toggleDataBtn.addEventListener('click', () => {
        if (dataView.classList.contains('d-none')) {
            dataView.classList.remove('d-none');
            dashboardCards.classList.add('d-none');
            toggleDataBtn.textContent = 'Show Dashboard';
            // Force refresh of tables when opening
            renderTable();
            renderFundsTable();
        } else {
            dataView.classList.add('d-none');
            dashboardCards.classList.remove('d-none');
            toggleDataBtn.textContent = 'Show Salary Data';
        }
    });

    tabSalary.addEventListener('click', () => {
        tabSalary.classList.add('active');
        tabFunds.classList.remove('active');
        salarySection.classList.remove('d-none');
        fundsSection.classList.add('d-none');
    });

    tabFunds.addEventListener('click', () => {
        tabFunds.classList.add('active');
        tabSalary.classList.remove('active');
        tabLogs.classList.remove('active');
        fundsSection.classList.remove('d-none');
        salarySection.classList.add('d-none');
        logsSection.classList.add('d-none');
        renderFundsTable();
    });

    tabLogs.addEventListener('click', () => {
        tabLogs.classList.add('active');
        tabSalary.classList.remove('active');
        tabFunds.classList.remove('active');
        logsSection.classList.remove('d-none');
        salarySection.classList.add('d-none');
        fundsSection.classList.add('d-none');
        renderLogsTable();
    });

    filterYear.addEventListener('change', () => {
        updateDashboard();
        renderTable();
        renderFundsTable();
    });

    confirmDeleteBtn.addEventListener('click', () => {
        if (deleteTarget) {
            if (deleteTarget.type === 'record') {
                deleteRecord(deleteTarget.id);
            } else if (deleteTarget.type === 'fund') {
                deleteFund(deleteTarget.id);
            }
            deleteModal.classList.add('hidden');
            deleteTarget = null;
        }
    });

    cancelDeleteBtn.addEventListener('click', () => {
        deleteModal.classList.add('hidden');
        deleteTarget = null;
    });

    // --- Initialization ---
    setupUnlockButtons();
    setupModals();
    setupFirebaseSync(); // Start cloud sync once
    
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    inputs.month.value = currentMonth;
    document.getElementById('funds-month').value = currentMonth;
    
    calculate();
    renderTable();
    renderFundsTable();
    updateDashboard();
});
