document.addEventListener('DOMContentLoaded', () => {
    // --- Elements ---
    const form = document.getElementById('salary-form');
    const recordsTableBody = document.getElementById('records-body');
    const statCount = document.getElementById('stat-count');
    const toggleDataBtn = document.getElementById('toggle-data-btn');
    const dataView = document.getElementById('data-view');
    const dashboardCards = document.querySelector('.dashboard-cards');

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

    let monthToDelete = null;

    function getRecords() {
        // Sync from Firebase if available
        if (db) {
            db.ref('salary_records').on('value', (snapshot) => {
                const data = snapshot.val();
                if (data) {
                    // Convert object to sorted array
                    const recordsArray = Object.values(data).sort((a, b) => new Date(b.month) - new Date(a.month));
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(recordsArray));
                    renderTable();
                    updateDashboard();
                }
            });
        }
        
        const records = localStorage.getItem(STORAGE_KEY);
        return records ? JSON.parse(records) : [];
    }

    function getFunds() {
        if (db) {
            db.ref('funds_records').on('value', (snapshot) => {
                const data = snapshot.val();
                if (data) {
                    localStorage.setItem(FUNDS_STORAGE_KEY, JSON.stringify(Object.values(data)));
                    updateDashboard();
                }
            });
        }

        const records = localStorage.getItem(FUNDS_STORAGE_KEY);
        return records ? JSON.parse(records) : [];
    }

    function saveRecord(record) {
        if (db) {
            // Save to Firebase (key uses underscores for compatibility)
            const firebaseKey = record.month.replace('-', '_');
            db.ref('salary_records/' + firebaseKey).set(record);
        } else {
            // Fallback to local only
            const records = getRecords();
            const existingIndex = records.findIndex(r => r.month === record.month);
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
    }

    // --- Helper Functions ---
    function parseNumber(val) {
        if (!val) return 0;
        if (typeof val === 'number') return val;
        return parseFloat(val.toString().replace(/,/g, '')) || 0;
    }

    function formatNumber(amount) {
        if (!amount && amount !== 0) return '';
        return new Intl.NumberFormat('en-US').format(Math.round(parseNumber(amount)));
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
        return 'PKR ' + new Intl.NumberFormat('en-US').format(Math.round(parseNumber(amount)));
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
        const fundsList = getFunds();

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

        // Sum Salary Records
        records.forEach(r => {
            totalGross += parseNumber(r.grossSalary);
            totalBasic += parseNumber(r.salary);
            totalOT += parseNumber(r.otAmount);

            totalDeduction += parseNumber(r.overallDeduction);
            totalPF += parseNumber(r.pfDeduction);
            totalTax += parseNumber(r.incomeTax);
            totalShort += parseNumber(r.shortTimeAmount);
            
            // Others = WithoutPay + AbsentDeduction
            let eobi = parseNumber(r.eobiDeduction);
            totalEOBI += eobi;
            let wp = parseNumber(r.withoutPay);
            let absent = (parseNumber(r.absentDays)) * ((parseNumber(r.salary)) / 26);
            totalOthers += (wp + absent);

            totalNet += parseNumber(r.netPayable);
        });

        // Add Funds
        fundsList.forEach(f => {
            let amt = parseNumber(f.amount);
            totalFunds += amt;
            totalGross += amt; // Add funds to Gross
            totalNet += amt;   // Add funds to overall net
        });

        // Update UI
        dashStats.gross.textContent = formatCurrency(totalGross);
        dashStats.basic.textContent = formatCurrency(totalBasic);
        dashStats.ot.textContent = formatCurrency(totalOT);
        if(dashStats.funds) dashStats.funds.textContent = formatCurrency(totalFunds);

        dashStats.deduction.textContent = formatCurrency(totalDeduction);
        dashStats.pf.textContent = formatCurrency(totalPF);
        dashStats.tax.textContent = formatCurrency(totalTax);
        dashStats.short.textContent = formatCurrency(totalShort);
        if(dashStats.eobi) dashStats.eobi.textContent = formatCurrency(totalEOBI);
        dashStats.others.textContent = formatCurrency(totalOthers);

        dashStats.net.textContent = formatCurrency(totalNet);
        if(dashStats.netReg) dashStats.netReg.textContent = formatCurrency(totalNet - totalOT);
        if(dashStats.netOT) dashStats.netOT.textContent = formatCurrency(totalOT);

        const avg = records.length > 0 ? (totalNet / records.length) : 0;
        const avgReg = records.length > 0 ? ((totalNet - totalOT) / records.length) : 0;
        const avgOT = records.length > 0 ? (totalOT / records.length) : 0;

        dashStats.avg.textContent = formatCurrency(avg);
        if(dashStats.avgReg) dashStats.avgReg.textContent = formatCurrency(avgReg);
        if(dashStats.avgOT) dashStats.avgOT.textContent = formatCurrency(avgOT);
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
        recordsTableBody.innerHTML = '';
        statCount.textContent = records.length;

        if (records.length === 0) {
            recordsTableBody.innerHTML = '<tr class="empty-row"><td colspan="19">No records found. Add a salary entry to see it here.</td></tr>';
            return;
        }

        records.forEach(record => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${formatMonth(record.month)}</strong></td>
                <td>${formatCurrency(record.salary)}</td>
                <td>${record.totalDays || '-'}</td>
                <td>${record.workingDays || '-'}</td>
                <td>${record.absentDays || '-'}</td>
                <td>${record.leavesWithPay || '-'}</td>
                <td>${record.shortTime || '-'}</td>
                <td class="deduction-text">${formatCurrency(record.shortTimeAmount)}</td>
                <td>${record.otTime || '-'}</td>
                <td class="addition-text">${formatCurrency(record.otAmount)}</td>
                <td class="deduction-text">${formatCurrency(record.pfDeduction)}</td>
                <td class="deduction-text">${formatCurrency(record.eobiDeduction)}</td>
                <td class="deduction-text">${formatCurrency(record.incomeTax)}</td>
                <td class="deduction-text">${formatCurrency(record.withoutPay)}</td>
                <td class="deduction-text"><strong>${formatCurrency(record.overallDeduction)}</strong></td>
                <td class="addition-text"><strong>${formatCurrency(record.grossSalary)}</strong></td>
                <td class="net-text"><strong>${formatCurrency(record.netPayable)}</strong></td>
                <td>${record.remarks || '-'}</td>
                <td>
                    <button class="btn-sm btn-outline edit-btn" data-month="${record.month}">Edit</button>
                    <button class="btn-sm btn-danger-outline delete-btn" data-month="${record.month}">Del</button>
                </td>
            `;
            recordsTableBody.appendChild(tr);
        });

        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                loadRecordIntoForm(e.target.getAttribute('data-month'));
                salaryModal.classList.remove('hidden');
            });
        });

        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                monthToDelete = e.target.getAttribute('data-month');
                deleteModal.classList.remove('hidden');
            });
        });
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
        } else {
            dataView.classList.add('d-none');
            dashboardCards.classList.remove('d-none');
            toggleDataBtn.textContent = 'Show Salary Data';
        }
    });

    confirmDeleteBtn.addEventListener('click', () => {
        if (monthToDelete) {
            deleteRecord(monthToDelete);
            deleteModal.classList.add('hidden');
            monthToDelete = null;
        }
    });

    cancelDeleteBtn.addEventListener('click', () => {
        deleteModal.classList.add('hidden');
        monthToDelete = null;
    });

    // --- Initialization ---
    setupUnlockButtons();
    setupModals();
    
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    inputs.month.value = currentMonth;
    document.getElementById('funds-month').value = currentMonth;
    
    calculate();
    renderTable();
    updateDashboard();
});
