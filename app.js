// ============================================================
// Budget Tracker App
// All data persisted in localStorage
// ============================================================

(function () {
    'use strict';

    // --- Data helpers ---
    const STORAGE_KEY = 'budgetTracker';

    function loadData() {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
            return JSON.parse(raw);
        }
        return {
            dailyGoal: 50,
            customCategories: [],
            expenses: {} // keyed by date string "YYYY-MM-DD" -> array of expenses
        };
    }

    function saveData(data) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }

    let data = loadData();

    // --- Date helpers ---
    function formatDate(date) {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    }

    function parseDate(str) {
        const [y, m, d] = str.split('-').map(Number);
        return new Date(y, m - 1, d);
    }

    function displayDate(date) {
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        if (formatDate(date) === formatDate(today)) return 'Today';
        if (formatDate(date) === formatDate(yesterday)) return 'Yesterday';
        if (formatDate(date) === formatDate(tomorrow)) return 'Tomorrow';

        return date.toLocaleDateString('en-US', {
            weekday: 'short', month: 'short', day: 'numeric'
        });
    }

    function getMonday(date) {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        d.setDate(diff);
        d.setHours(0, 0, 0, 0);
        return d;
    }

    function addDays(date, n) {
        const d = new Date(date);
        d.setDate(d.getDate() + n);
        return d;
    }

    function shortDay(date) {
        return date.toLocaleDateString('en-US', { weekday: 'short' });
    }

    function shortDate(date) {
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }

    // --- State ---
    let currentDate = new Date();
    let currentWeekStart = getMonday(new Date());
    let activeTab = 'daily';
    let historyChart = null;

    // --- DOM refs ---
    const $ = (sel) => document.querySelector(sel);
    const $$ = (sel) => document.querySelectorAll(sel);

    // --- Categories ---
    const DEFAULT_CATEGORIES = [
        'groceries', 'dining', 'gas', 'shopping',
        'entertainment', 'health', 'bills', 'other'
    ];

    const CATEGORY_COLORS = {
        groceries: '#27ae60',
        dining: '#e67e22',
        gas: '#3498db',
        shopping: '#9b59b6',
        entertainment: '#e74c3c',
        health: '#1abc9c',
        bills: '#34495e',
        other: '#95a5a6'
    };

    function getAllCategories() {
        return [...DEFAULT_CATEGORIES, ...data.customCategories];
    }

    function getCategoryColor(cat) {
        return CATEGORY_COLORS[cat] || '#7f8c8d';
    }

    function updateCategoryDropdown() {
        const select = $('#expense-category');
        select.innerHTML = '';
        getAllCategories().forEach(cat => {
            const opt = document.createElement('option');
            opt.value = cat;
            opt.textContent = cat.charAt(0).toUpperCase() + cat.slice(1);
            select.appendChild(opt);
        });
    }

    // --- Currency formatting ---
    function fmt(amount) {
        return '$' + Math.abs(amount).toFixed(2);
    }

    // --- Expense CRUD ---
    function getExpensesForDate(dateStr) {
        return data.expenses[dateStr] || [];
    }

    function getDayTotal(dateStr) {
        return getExpensesForDate(dateStr).reduce((sum, e) => sum + e.amount, 0);
    }

    function addExpense(dateStr, amount, category, note) {
        if (!data.expenses[dateStr]) {
            data.expenses[dateStr] = [];
        }
        data.expenses[dateStr].push({
            id: Date.now() + Math.random(),
            amount: amount,
            category: category,
            note: note || '',
            time: new Date().toISOString()
        });
        saveData(data);
    }

    function deleteExpense(dateStr, expenseId) {
        if (data.expenses[dateStr]) {
            data.expenses[dateStr] = data.expenses[dateStr].filter(e => e.id !== expenseId);
            if (data.expenses[dateStr].length === 0) {
                delete data.expenses[dateStr];
            }
            saveData(data);
        }
    }

    // --- Render: Daily View ---
    function renderDailyView() {
        const dateStr = formatDate(currentDate);
        const expenses = getExpensesForDate(dateStr);
        const total = getDayTotal(dateStr);
        const goal = data.dailyGoal;
        const remaining = goal - total;
        const pct = goal > 0 ? Math.min((total / goal) * 100, 100) : 0;

        // Goal banner
        $('#spent-amount').textContent = fmt(total);
        $('#goal-amount').textContent = fmt(goal);

        const bar = $('#progress-bar');
        bar.style.width = pct + '%';
        bar.className = '';
        if (total > goal) {
            bar.classList.add('over');
        } else if (pct > 75) {
            bar.classList.add('warning');
        }

        const remLabel = $('#remaining-label');
        if (remaining >= 0) {
            remLabel.textContent = fmt(remaining) + ' remaining';
            remLabel.className = '';
        } else {
            remLabel.textContent = fmt(-remaining) + ' over budget';
            remLabel.className = 'over';
        }

        // Date
        $('#current-date').textContent = displayDate(currentDate);

        // Expense list
        const list = $('#expense-items');
        const noExp = $('#no-expenses');
        list.innerHTML = '';

        if (expenses.length === 0) {
            noExp.style.display = 'block';
        } else {
            noExp.style.display = 'none';
            expenses.slice().reverse().forEach(exp => {
                const li = document.createElement('li');
                li.className = 'expense-item';
                li.innerHTML = `
                    <div class="expense-item-left">
                        <span class="expense-category-badge" style="color:${getCategoryColor(exp.category)}">${exp.category}</span>
                        ${exp.note ? `<span class="expense-note">${escapeHtml(exp.note)}</span>` : ''}
                    </div>
                    <div class="expense-item-right">
                        <span class="expense-item-amount">${fmt(exp.amount)}</span>
                        <button class="delete-expense" data-id="${exp.id}" aria-label="Delete">&times;</button>
                    </div>
                `;
                list.appendChild(li);
            });
        }
    }

    function escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    // --- Render: Weekly View ---
    function renderWeeklyView() {
        const weekStart = currentWeekStart;
        const weekEnd = addDays(weekStart, 6);

        $('#week-range').textContent = shortDate(weekStart) + ' - ' + shortDate(weekEnd);

        let weekTotal = 0;
        let daysWithData = 0;
        const categoryTotals = {};
        const dailyTotals = [];

        for (let i = 0; i < 7; i++) {
            const d = addDays(weekStart, i);
            const dateStr = formatDate(d);
            const dayTotal = getDayTotal(dateStr);
            weekTotal += dayTotal;
            dailyTotals.push({ date: d, total: dayTotal, dateStr });

            if (dayTotal > 0) daysWithData++;

            getExpensesForDate(dateStr).forEach(exp => {
                categoryTotals[exp.category] = (categoryTotals[exp.category] || 0) + exp.amount;
            });
        }

        const dailyAvg = daysWithData > 0 ? weekTotal / daysWithData : 0;
        const weeklyGoal = data.dailyGoal * 7;

        $('#week-total').textContent = fmt(weekTotal);
        $('#week-avg').textContent = fmt(dailyAvg);
        $('#week-goal').textContent = fmt(weeklyGoal);

        // Category breakdown
        const catDiv = $('#category-breakdown');
        catDiv.innerHTML = '';
        const sortedCats = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]);
        sortedCats.forEach(([cat, amount]) => {
            const row = document.createElement('div');
            row.className = 'category-row';
            row.innerHTML = `
                <span class="category-name" style="color:${getCategoryColor(cat)}">${cat}</span>
                <span class="category-amount">${fmt(amount)}</span>
            `;
            catDiv.appendChild(row);
        });
        if (sortedCats.length === 0) {
            catDiv.innerHTML = '<p style="text-align:center;color:var(--text-light);padding:12px;">No expenses this week</p>';
        }

        // Daily bars
        const barsDiv = $('#daily-bars');
        barsDiv.innerHTML = '';
        const maxDay = Math.max(data.dailyGoal, ...dailyTotals.map(d => d.total), 1);

        dailyTotals.forEach(({ date, total }) => {
            const pct = (total / maxDay) * 100;
            const goalPct = (data.dailyGoal / maxDay) * 100;
            const isOver = total > data.dailyGoal;
            const row = document.createElement('div');
            row.className = 'daily-bar-row';
            row.innerHTML = `
                <span class="daily-bar-label">${shortDay(date)}</span>
                <div class="daily-bar-track">
                    <div class="goal-line" style="left:${goalPct}%"></div>
                    <div class="daily-bar-fill ${isOver ? 'over' : ''}" style="width:${pct}%"></div>
                </div>
                <span class="daily-bar-value">${fmt(total)}</span>
            `;
            barsDiv.appendChild(row);
        });
    }

    // --- Render: 5-Week History ---
    function renderHistoryView() {
        const weeks = [];
        const now = new Date();
        const thisWeekStart = getMonday(now);

        for (let w = 0; w < 5; w++) {
            const weekStart = addDays(thisWeekStart, -7 * w);
            const weekEnd = addDays(weekStart, 6);
            let total = 0;
            let daysWithData = 0;

            for (let i = 0; i < 7; i++) {
                const dayTotal = getDayTotal(formatDate(addDays(weekStart, i)));
                total += dayTotal;
                if (dayTotal > 0) daysWithData++;
            }

            weeks.push({
                start: weekStart,
                end: weekEnd,
                total,
                avg: daysWithData > 0 ? total / daysWithData : 0,
                label: shortDate(weekStart) + ' - ' + shortDate(weekEnd)
            });
        }

        weeks.reverse(); // oldest first for chart

        // Chart
        const ctx = $('#history-chart').getContext('2d');
        const weeklyGoal = data.dailyGoal * 7;

        if (historyChart) {
            historyChart.destroy();
        }

        historyChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: weeks.map(w => shortDate(w.start)),
                datasets: [
                    {
                        label: 'Weekly Spending',
                        data: weeks.map(w => w.total),
                        backgroundColor: weeks.map(w =>
                            w.total > weeklyGoal ? 'rgba(231, 76, 60, 0.7)' : 'rgba(74, 144, 217, 0.7)'
                        ),
                        borderColor: weeks.map(w =>
                            w.total > weeklyGoal ? '#e74c3c' : '#4a90d9'
                        ),
                        borderWidth: 2,
                        borderRadius: 6
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: { display: false },
                    annotation: undefined
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: { color: 'rgba(0,0,0,0.05)' }
                    },
                    x: {
                        grid: { display: false }
                    }
                }
            },
            plugins: [{
                id: 'goalLine',
                afterDraw(chart) {
                    if (weeklyGoal <= 0) return;
                    const yScale = chart.scales.y;
                    const y = yScale.getPixelForValue(weeklyGoal);
                    const ctx = chart.ctx;
                    ctx.save();
                    ctx.beginPath();
                    ctx.setLineDash([6, 4]);
                    ctx.moveTo(chart.chartArea.left, y);
                    ctx.lineTo(chart.chartArea.right, y);
                    ctx.strokeStyle = 'rgba(231, 76, 60, 0.6)';
                    ctx.lineWidth = 2;
                    ctx.stroke();
                    ctx.restore();

                    ctx.save();
                    ctx.font = '11px -apple-system, sans-serif';
                    ctx.fillStyle = 'rgba(231, 76, 60, 0.8)';
                    ctx.fillText('Goal: ' + fmt(weeklyGoal), chart.chartArea.right - 80, y - 6);
                    ctx.restore();
                }
            }]
        });

        // Details list
        const details = $('#history-details');
        details.innerHTML = '';
        weeks.slice().reverse().forEach(w => {
            const isOver = w.total > weeklyGoal;
            const diff = Math.abs(w.total - weeklyGoal);
            const row = document.createElement('div');
            row.className = 'history-week-row';
            row.innerHTML = `
                <span class="history-week-label">${w.label}</span>
                <div class="history-week-stats">
                    <div class="history-week-total">${fmt(w.total)}</div>
                    <div class="history-week-avg">avg ${fmt(w.avg)}/day</div>
                    <div class="history-week-status ${isOver ? 'over' : 'under'}">
                        ${isOver ? fmt(diff) + ' over goal' : fmt(diff) + ' under goal'}
                    </div>
                </div>
            `;
            details.appendChild(row);
        });
    }

    // --- Tab switching ---
    function switchTab(tab) {
        activeTab = tab;
        $$('.tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tab));

        // Show/hide sections
        const dailySections = ['#goal-banner', '#date-nav', '#add-expense', '#expenses-list'];
        dailySections.forEach(sel => {
            $(sel).style.display = tab === 'daily' ? '' : 'none';
        });
        $('#weekly-view').style.display = tab === 'weekly' ? '' : 'none';
        $('#history-view').style.display = tab === 'history' ? '' : 'none';

        if (tab === 'weekly') renderWeeklyView();
        if (tab === 'history') renderHistoryView();
    }

    // --- Event handlers ---
    function init() {
        updateCategoryDropdown();
        renderDailyView();

        // Tab navigation
        $$('.tab').forEach(btn => {
            btn.addEventListener('click', () => switchTab(btn.dataset.tab));
        });

        // Date navigation
        $('#prev-day').addEventListener('click', () => {
            currentDate = addDays(currentDate, -1);
            renderDailyView();
        });
        $('#next-day').addEventListener('click', () => {
            currentDate = addDays(currentDate, 1);
            renderDailyView();
        });

        // Week navigation
        $('#prev-week').addEventListener('click', () => {
            currentWeekStart = addDays(currentWeekStart, -7);
            renderWeeklyView();
        });
        $('#next-week').addEventListener('click', () => {
            currentWeekStart = addDays(currentWeekStart, 7);
            renderWeeklyView();
        });

        // Add expense
        $('#expense-form').addEventListener('submit', (e) => {
            e.preventDefault();
            const amount = parseFloat($('#expense-amount').value);
            const category = $('#expense-category').value;
            const note = $('#expense-note').value.trim();

            if (isNaN(amount) || amount <= 0) return;

            addExpense(formatDate(currentDate), amount, category, note);
            renderDailyView();

            $('#expense-amount').value = '';
            $('#expense-note').value = '';
            $('#expense-amount').focus();
        });

        // Delete expense (event delegation)
        $('#expense-items').addEventListener('click', (e) => {
            if (e.target.classList.contains('delete-expense')) {
                const id = parseFloat(e.target.dataset.id);
                deleteExpense(formatDate(currentDate), id);
                renderDailyView();
            }
        });

        // Settings
        $('#settings-btn').addEventListener('click', () => {
            $('#daily-goal-input').value = data.dailyGoal;
            $('#custom-categories').value = data.customCategories.join('\n');
            $('#settings-modal').style.display = 'flex';
        });

        $('#cancel-settings').addEventListener('click', () => {
            $('#settings-modal').style.display = 'none';
        });

        $('#save-settings').addEventListener('click', () => {
            const goal = parseFloat($('#daily-goal-input').value);
            if (!isNaN(goal) && goal >= 0) {
                data.dailyGoal = goal;
            }

            const customCats = $('#custom-categories').value
                .split('\n')
                .map(c => c.trim().toLowerCase())
                .filter(c => c.length > 0);
            data.customCategories = customCats;

            saveData(data);
            updateCategoryDropdown();
            renderDailyView();
            $('#settings-modal').style.display = 'none';
        });

        // Close modal on backdrop click
        $('#settings-modal').addEventListener('click', (e) => {
            if (e.target === $('#settings-modal')) {
                $('#settings-modal').style.display = 'none';
            }
        });

        // Export data
        $('#export-data').addEventListener('click', () => {
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'budget-tracker-backup.json';
            a.click();
            URL.revokeObjectURL(url);
        });

        // Import data
        $('#import-data').addEventListener('click', () => {
            $('#import-file').click();
        });

        $('#import-file').addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (evt) => {
                try {
                    const imported = JSON.parse(evt.target.result);
                    if (imported.expenses && typeof imported.dailyGoal === 'number') {
                        data = imported;
                        saveData(data);
                        updateCategoryDropdown();
                        renderDailyView();
                        alert('Data imported successfully!');
                        $('#settings-modal').style.display = 'none';
                    } else {
                        alert('Invalid backup file format.');
                    }
                } catch {
                    alert('Could not read the file. Make sure it is a valid JSON backup.');
                }
            };
            reader.readAsText(file);
            e.target.value = '';
        });

        // Clear data
        $('#clear-data').addEventListener('click', () => {
            if (confirm('Are you sure you want to delete ALL data? This cannot be undone.')) {
                localStorage.removeItem(STORAGE_KEY);
                data = loadData();
                updateCategoryDropdown();
                renderDailyView();
                alert('All data cleared.');
                $('#settings-modal').style.display = 'none';
            }
        });
    }

    // --- Service Worker Registration ---
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('sw.js').catch(() => {
                // SW registration failed — app still works fine without it
            });
        });
    }

    // --- Boot ---
    document.addEventListener('DOMContentLoaded', init);
})();
