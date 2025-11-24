import {
    onAuthStateChange,
    logoutUser,
    addPositive,
    getAllPositives,
    getPositiveById,
    getPositivesByDate,
    getPositivesByDateRange,
    updatePositive,
    deletePositive,
    addCustomTemplate,
    getAllCustomTemplates,
    getCustomTemplateByName,
    updateCustomTemplate,
} from './auth.js';

document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const homePage = document.getElementById('home-page');
    const addPositivePage = document.getElementById('add-positive-page');
    const useTemplatePage = document.getElementById('use-template-page');

    // Auth
    const signoutBtn = document.getElementById('signout-btn');

    // Home Page
    const addPositiveBtnHome = document.getElementById('add-positive-btn-home');
    const useTemplateBtn = document.getElementById('use-template-btn');
    const monthSelector = document.getElementById('month-selector');
    const yearSelector = document.getElementById('year-selector');
    const calendarEl = document.getElementById('calendar');
    const positivesListEl = document.getElementById('positives-list');
    const dailyLogTitleEl = document.getElementById('daily-log-title');
    const chartCanvas = document.getElementById('progress-chart');

    // Add Positive Page
    const addPositiveForm = document.getElementById('add-positive-form');
    const cancelPositiveBtn = document.getElementById('cancel-positive-btn');
    const saveTemplateBtn = document.getElementById('save-template-btn');
    const difficultySlider = document.getElementById('positive-difficulty');
    const difficultyValue = document.getElementById('difficulty-value');
    const positiveNameInput = document.getElementById('positive-name');
    const positiveTemplatesInput = document.getElementById('positive-templates-input');
    const standardTemplatesOptions = document.getElementById('standard-templates-options');
    const myPositiveTemplatesInput = document.getElementById('my-positive-templates-input');
    const myTemplatesOptions = document.getElementById('my-templates-options');

    // Use Template Page
    const templateMonthSelector = document.getElementById('template-month-selector');
    const templateYearSelector = document.getElementById('template-year-selector');
    const templateCalendarEl = document.getElementById('template-calendar');
    const templateDayPositivesListEl = document.getElementById('template-day-positives-list');
    const templateMasterListEl = document.getElementById('template-master-list');
    const searchMasterListInput = document.getElementById('search-master-list');
    const templateSelectAllBtn = document.getElementById('template-select-all-btn');
    const saveFromTemplateBtn = document.getElementById('save-from-template-btn');
    const cancelFromTemplateBtn = document.getElementById('cancel-from-template-btn');

    // --- State ---
    let currentUser = null;
    let selectedDate = new Date().toISOString().split('T')[0];
    let currentMonth = new Date().getMonth();
    let currentYear = new Date().getFullYear();
    let templatePageMonth = currentMonth;
    let templatePageYear = currentYear;
    let myChart;
    let myTemplates = [];

    // --- Templates ---
    const standardTemplates = [
        "Displayed affection towards a lover in public.", "Showed affection towards friends by hugging when you leave.", "Said 'thank you' to a service worker.", "Held the door open for someone.", "Completed a difficult task at work.", "Woke up on time.", "Ate a healthy meal.", "Exercised for 30 minutes.", "Read a chapter of a book.", "Learned something new.", "Helped a colleague with a problem.", "Called a family member to catch up.", "Listened to a friend without judgment.", "Forgave someone.", "Apologized for a mistake.", "Set a boundary with someone.", "Said 'no' to something you didn't want to do.", "Donated to a charity.", "Volunteered your time.", "Cleaned a part of your home.",
    ];

    // --- Page Navigation & UI Updates ---
    const showPage = async (pageToShow) => {
        [homePage, addPositivePage, useTemplatePage].forEach(page => {
            if (page === pageToShow) {
                page.classList.remove('hidden');
            } else {
                page.classList.add('hidden');
            }
        });
        if (pageToShow === homePage) {
            await refreshHomePage();
        }
    };

    const showAddPositivePage = () => {
        showPage(addPositivePage);
        addPositiveForm.reset();
        positiveNameInput.disabled = false;
        positiveTemplatesInput.disabled = false;
        myPositiveTemplatesInput.disabled = false;
        difficultySlider.disabled = false;
    };

    const refreshHomePage = async () => {
        await renderCalendar(currentMonth, currentYear);
        await renderPositivesForDay(selectedDate);
        const activeRange = document.querySelector('.toggle-btn.active').dataset.range;
        await renderChart(activeRange);
    };

    // --- Event Listeners ---
    addPositiveBtnHome.addEventListener('click', showAddPositivePage);
    useTemplateBtn.addEventListener('click', () => {
        showPage(useTemplatePage);
        initializeUseTemplatePage();
    });
    cancelPositiveBtn.addEventListener('click', async () => await showPage(homePage));
    cancelFromTemplateBtn.addEventListener('click', async () => await showPage(homePage));

    monthSelector.addEventListener('change', async () => {
        currentMonth = parseInt(monthSelector.value, 10);
        selectedDate = new Date(Date.UTC(currentYear, currentMonth, 1)).toISOString().split('T')[0];
        updateButtonStates();
        await refreshHomePage();
    });

    yearSelector.addEventListener('change', async () => {
        currentYear = parseInt(yearSelector.value, 10);
        selectedDate = new Date(Date.UTC(currentYear, currentMonth, 1)).toISOString().split('T')[0];
        updateButtonStates();
        await refreshHomePage();
    });

    difficultySlider.addEventListener('input', () => {
        difficultyValue.textContent = difficultySlider.value;
    });

    // --- Custom Dropdown Logic ---
    const renderDropdown = (container, items) => {
        container.innerHTML = '';
        items.forEach(item => {
            const optionEl = document.createElement('span');
            optionEl.classList.add('dropdown-option');
            optionEl.textContent = typeof item === 'string' ? item : item.name;
            optionEl.dataset.value = typeof item === 'string' ? item : item.name;
            container.appendChild(optionEl);
        });
        container.classList.add('visible');
    };

    const setupDropdown = (input, optionsContainer, getSourceArray, onSelectCallback) => {
        input.addEventListener('focus', () => {
            const sourceArray = getSourceArray();
            const filtered = sourceArray.filter(item => (typeof item === 'string' ? item : item.name).toLowerCase().includes(input.value.toLowerCase()));
            renderDropdown(optionsContainer, filtered);
        });

        input.addEventListener('input', () => {
            const sourceArray = getSourceArray();
            const filtered = sourceArray.filter(item => (typeof item === 'string' ? item : item.name).toLowerCase().includes(input.value.toLowerCase()));
            renderDropdown(optionsContainer, filtered);
            if (onSelectCallback) {
                onSelectCallback(input.value);
            }
        });

        optionsContainer.addEventListener('click', (e) => {
            if (e.target.classList.contains('dropdown-option')) {
                input.value = e.target.dataset.value;
                optionsContainer.classList.remove('visible');
                const event = new Event('input', { bubbles: true });
                input.dispatchEvent(event);
            }
        });
    };

    document.addEventListener('click', (e) => {
        if (!e.target.closest('.custom-dropdown-container')) {
            standardTemplatesOptions.classList.remove('visible');
            myTemplatesOptions.classList.remove('visible');
        }
    });

    // --- Form Logic Listeners ---
    positiveNameInput.addEventListener('input', () => {
        const hasText = positiveNameInput.value.trim() !== '';
        positiveTemplatesInput.disabled = hasText;
        myPositiveTemplatesInput.disabled = hasText;
    });

    saveTemplateBtn.addEventListener('click', async () => {
        // A template is identified by the value in one of the two template inputs,
        // or the main name input if creating a new one.
        const name = myPositiveTemplatesInput.value.trim() || positiveNameInput.value.trim();
        const score = parseInt(difficultySlider.value, 10);

        if (!name) {
            alert('Please enter a name for your new template, or select an existing template to update.');
            return;
        }

        const existingTemplate = await getCustomTemplateByName(name);

        if (existingTemplate) {
            // Update existing template
            existingTemplate.score = score;
            await updateCustomTemplate(existingTemplate);
            alert(`Template "${name}" updated!`);
        } else {
            // Add new template
            const newTemplate = { name, score };
            await addCustomTemplate(newTemplate);
            alert(`Template "${name}" saved!`);
        }
        await populateMyTemplates();
    });

    addPositiveForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        let name = positiveNameInput.value.trim() || myPositiveTemplatesInput.value.trim() || positiveTemplatesInput.value.trim();
        if (!name) {
            alert("Please provide a name or select a template.");
            return;
        }
        const newPositiveData = {
            name: name, date: selectedDate, score: parseInt(difficultySlider.value, 10),
            baseScore: parseInt(difficultySlider.value, 10), count: 1
        };
        console.log('Adding new positive:', newPositiveData);
        const newPositive = await addPositive(newPositiveData);
        console.log('Added new positive:', newPositive);
        if (newPositive && !newPositive.error) {
            await showPage(homePage);
        } else {
            alert('Failed to add positive. Please try again.');
        }
    });

    positivesListEl.addEventListener('click', async (e) => {
        const target = e.target;
        if (!target.matches('.inc-btn, .dec-btn')) return;
        const id = target.getAttribute('data-id');
        if (!id) return;
        const positive = await getPositiveById(id);
        if (!positive) return;
        let shouldUpdate = true;
        if (target.classList.contains('inc-btn')) {
            positive.count++;
            positive.score = positive.baseScore * positive.count;
        } else if (target.classList.contains('dec-btn')) {
            if (positive.count > 1) {
                positive.count--;
                positive.score = positive.baseScore * positive.count;
            } else {
                if (confirm("Do you wish to delete this positive?")) {
                    await deletePositive(id);
                    shouldUpdate = false;
                } else {
                    return;
                }
            }
        }
        if (shouldUpdate) {
            await updatePositive(positive);
        }
        await refreshHomePage();
    });

    calendarEl.addEventListener('click', async (e) => {
        const dayCell = e.target.closest('.calendar-day');
        if (dayCell && dayCell.dataset.date) {
            selectedDate = dayCell.dataset.date;
            updateButtonStates();
            await renderPositivesForDay(selectedDate);
            await renderCalendar(currentMonth, currentYear);
            const activeRange = document.querySelector('.toggle-btn.active').dataset.range;
            await renderChart(activeRange);
        }
    });

    document.querySelectorAll('.toggle-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            document.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            const range = e.target.getAttribute('data-range');
            await renderChart(range);
        });
    });

    // --- Use Template Page Listeners ---
    templateMonthSelector.addEventListener('change', () => {
        templatePageMonth = parseInt(templateMonthSelector.value, 10);
        renderTemplateCalendar(templatePageMonth, templatePageYear);
    });
    templateYearSelector.addEventListener('change', () => {
        templatePageYear = parseInt(templateYearSelector.value, 10);
        renderTemplateCalendar(templatePageMonth, templatePageYear);
    });
    templateCalendarEl.addEventListener('click', async (e) => {
        const dayCell = e.target.closest('.calendar-day');
        if (dayCell && dayCell.dataset.date) {
            const dateStr = dayCell.dataset.date;
            const dateParts = dateStr.split('-');
            const formattedDate = `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`;
            document.getElementById('template-day-title').textContent = `${formattedDate}'s Positives`;
            const positives = await getPositivesByDate(dateStr);
            templateDayPositivesListEl.innerHTML = '';
            if (positives.length === 0) {
                templateDayPositivesListEl.innerHTML = '<li>No positives for this day.</li>';
                return;
            }
            positives.forEach(p => {
                const li = document.createElement('li');
                li.innerHTML = `<label><input type="checkbox" data-name="${p.name}" data-score="${p.score}"> ${p.name}</label>`;
                templateDayPositivesListEl.appendChild(li);
            });
        }
    });
    templateSelectAllBtn.addEventListener('click', () => {
        templateDayPositivesListEl.querySelectorAll('input[type="checkbox"]').forEach(box => {
            box.checked = true;
        });
    });
    saveFromTemplateBtn.addEventListener('click', async () => {
        const selectedItems = new Map();
        templateDayPositivesListEl.querySelectorAll('input:checked').forEach(box => {
            if (!selectedItems.has(box.dataset.name)) {
                selectedItems.set(box.dataset.name, parseInt(box.dataset.score, 10));
            }
        });
        templateMasterListEl.querySelectorAll('input:checked').forEach(box => {
            if (!selectedItems.has(box.dataset.name)) {
                selectedItems.set(box.dataset.name, parseInt(box.dataset.score, 10));
            }
        });
        for (const [name, score] of selectedItems) {
            const newPositive = {
                name, score, date: selectedDate, baseScore: score, count: 1
            };
            await addPositive(newPositive);
        }
        showPage(homePage);
    });

    // --- Rendering & Helper Functions ---
    const populateMainSelectors = () => {
        const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        monthSelector.innerHTML = '';
        months.forEach((month, index) => {
            const option = document.createElement('option');
            option.value = index;
            option.textContent = month;
            monthSelector.appendChild(option);
        });
        const startYear = 2024;
        const endYear = new Date().getFullYear() + 5;
        for (let i = startYear; i <= endYear; i++) {
            const option = document.createElement('option');
            option.value = i;
            option.textContent = i;
            yearSelector.appendChild(option);
        }
    };
    const updateMainSelectors = () => {
        monthSelector.value = currentMonth;
        yearSelector.value = currentYear;
    };
    const renderCalendar = async (month, year) => {
        calendarEl.innerHTML = '';
        updateMainSelectors();
        const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        dayNames.forEach(day => {
            const dayNameEl = document.createElement('div');
            dayNameEl.textContent = day;
            dayNameEl.classList.add('calendar-day-name');
            calendarEl.appendChild(dayNameEl);
        });
        const firstDay = new Date(Date.UTC(year, month, 1)).getUTCDay();
        const emptyCells = (firstDay === 0) ? 6 : firstDay - 1;
        for (let i = 0; i < emptyCells; i++) {
            const emptyCell = document.createElement('div');
            emptyCell.classList.add('day');
            calendarEl.appendChild(emptyCell);
        }
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const scoresByDate = {};
        if (currentUser) {
            const startDate = `${year}-${String(month + 1).padStart(2, '0')}-01`;
            const endDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}`;
            try {
                const monthPositives = await getPositivesByDateRange(startDate, endDate);
                monthPositives.forEach(p => {
                    scoresByDate[p.date] = (scoresByDate[p.date] || 0) + p.score;
                });
            } catch (error) {
                console.error("Could not fetch calendar data. Rendering empty calendar.", error);
            }
        }
        for (let i = 1; i <= daysInMonth; i++) {
            const dayCell = document.createElement('button');
            dayCell.classList.add('calendar-day', 'day');
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
            dayCell.dataset.date = dateStr;
            let dayContent = `<span class="day-number">${i}</span>`;
            if (scoresByDate[dateStr]) {
                dayContent += `<span class="day-score">${scoresByDate[dateStr]}</span>`;
            }
            dayCell.innerHTML = dayContent;
            if (dateStr === new Date().toISOString().split('T')[0]) {
                dayCell.classList.add('today');
            }
            if (dateStr === selectedDate) {
                dayCell.classList.add('selected-day');
            }
            if (!isDateEditable(dateStr)) {
                dayCell.classList.add('uneditable-day');
            }
            calendarEl.appendChild(dayCell);
        }
    };
    const renderPositivesForDay = async (dateStr) => {
        positivesListEl.innerHTML = '<li>Loading...</li>';
        const todayStr = new Date().toISOString().split('T')[0];
        if (dateStr === todayStr) {
            dailyLogTitleEl.textContent = "Today's Positives";
        } else {
            dailyLogTitleEl.textContent = `Positives for ${dateStr}`;
        }
        if (!currentUser) {
            positivesListEl.innerHTML = '<li>Please sign in to see your positives.</li>';
            return;
        }
        const dayData = await getPositivesByDate(dateStr);
        console.log(`Rendering positives for ${dateStr}:`, dayData);
        positivesListEl.innerHTML = '';
        if (dayData.length === 0) {
            positivesListEl.innerHTML = '<li>No positives recorded for this day.</li>';
            return;
        }
        const editable = isDateEditable(dateStr);
        dayData.forEach(item => {
            const li = document.createElement('li');
            const stars = '★'.repeat(item.count);
            li.innerHTML = `
                <div class="positive-item-main">
                    <span class="positive-name">${item.name}</span>
                    <span class="positive-stars">${stars}</span>
                </div>
                <div class="positive-item-controls">
                    <span class="difficulty-label">Difficulty: ${item.baseScore}</span>
                    <div class="score-controls">
                        <button data-id="${item.id}" class="inc-btn" ${!editable ? 'disabled' : ''}>+</button>
                        <button data-id="${item.id}" class="dec-btn" ${!editable ? 'disabled' : ''}>-</button>
                    </div>
                </div>
            `;
            positivesListEl.appendChild(li);
        });
    };
    const renderChart = async (range = 'week') => {
        if (myChart) {
            myChart.destroy();
        }
        const labels = [];
        const chartData = [];
        let maxScore = 0;
        let legendLabel = 'Score';
        if (currentUser) {
            switch (range) {
                case 'week': {
                    legendLabel = 'Daily Score';
                    const selected = new Date(selectedDate + 'T00:00:00Z');
                    const dayOfWeek = selected.getUTCDay();
                    const offset = (dayOfWeek === 0) ? 6 : dayOfWeek - 1;
                    const startDate = new Date(selected);
                    startDate.setUTCDate(selected.getUTCDate() - offset);
                    const endDate = new Date(startDate);
                    endDate.setUTCDate(startDate.getUTCDate() + 6);
                    const startStr = startDate.toISOString().split('T')[0];
                    const endStr = endDate.toISOString().split('T')[0];
                    const rangePositives = await getPositivesByDateRange(startStr, endStr);
                    const scoresByDate = {};
                    rangePositives.forEach(p => {
                        scoresByDate[p.date] = (scoresByDate[p.date] || 0) + p.score;
                    });
                    const currentDate = new Date(startDate);
                    for (let i = 0; i < 7; i++) {
                        const dateStr = currentDate.toISOString().split('T')[0];
                        labels.push(currentDate.toLocaleDateString('en-US', { weekday: 'short' }));
                        const totalScore = scoresByDate[dateStr] || 0;
                        chartData.push(totalScore);
                        if (totalScore > maxScore) maxScore = totalScore;
                        currentDate.setUTCDate(currentDate.getUTCDate() + 1);
                    }
                    break;
                }
                case 'month': {
                    legendLabel = 'Weekly Score';
                    const year = currentYear;
                    const month = currentMonth;
                    const startDate = new Date(Date.UTC(year, month, 1));
                    const endDate = new Date(Date.UTC(year, month + 1, 0));
                    const startStr = startDate.toISOString().split('T')[0];
                    const endStr = endDate.toISOString().split('T')[0];
                    const rangePositives = await getPositivesByDateRange(startStr, endStr);
                    const weeklyScores = [0, 0, 0, 0, 0];
                    rangePositives.forEach(p => {
                        const dayOfMonth = new Date(p.date + 'T00:00:00Z').getUTCDate();
                        if (dayOfMonth <= 7) weeklyScores[0] += p.score;
                        else if (dayOfMonth <= 14) weeklyScores[1] += p.score;
                        else if (dayOfMonth <= 21) weeklyScores[2] += p.score;
                        else if (dayOfMonth <= 28) weeklyScores[3] += p.score;
                        else weeklyScores[4] += p.score;
                    });
                    labels.push('Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5+');
                    chartData.push(...weeklyScores);
                    maxScore = Math.max(...weeklyScores);
                    break;
                }
                case 'year': {
                    legendLabel = 'Monthly Score';
                    const year = currentYear;
                    const startMonth = new Date(Date.UTC(year, 0, 1));
                    const endMonth = new Date(Date.UTC(year, 11, 31));
                    const startStr = startMonth.toISOString().split('T')[0];
                    const endStr = endMonth.toISOString().split('T')[0];
                    const rangePositives = await getPositivesByDateRange(startStr, endStr);
                    const monthlyScores = {};
                    const monthOrder = [];
                    for (let i = 0; i < 12; i++) {
                        const month = new Date(startMonth);
                        month.setUTCMonth(startMonth.getUTCMonth() + i);
                        const monthKey = month.toISOString().slice(0, 7);
                        labels.push(month.toLocaleString('default', { month: 'short' }));
                        monthlyScores[monthKey] = 0;
                        monthOrder.push(monthKey);
                    }
                    rangePositives.forEach(p => {
                        const monthKey = p.date.slice(0, 7);
                        if (monthlyScores.hasOwnProperty(monthKey)) {
                            monthlyScores[monthKey] += p.score;
                        }
                    });
                    monthOrder.forEach(monthKey => {
                        chartData.push(monthlyScores[monthKey]);
                    });
                    maxScore = Math.max(...chartData);
                    break;
                }
            }
        }
        myChart = new Chart(chartCanvas, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: legendLabel,
                    data: chartData,
                    borderColor: '#2980b9',
                    backgroundColor: 'rgba(41, 128, 185, 0.1)',
                    tension: 0.1,
                    fill: true,
                }]
            },
            options: {
                scales: { y: { beginAtZero: true, max: maxScore + 5 } },
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: {
                            pointStyle: 'line'
                        }
                    }
                }
            }
        });
    };
    const populateMyTemplates = async () => {
        if (!currentUser) return;
        myTemplates = await getAllCustomTemplates();
    };
    const isDateEditable = (dateStr) => {
        const today = new Date();
        today.setUTCHours(0, 0, 0, 0);
        const selected = new Date(dateStr + 'T00:00:00Z');
        if (selected > today) {
            return false;
        }
        const diffTime = today - selected;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays <= 2;
    };
    const updateButtonStates = () => {
        const editable = isDateEditable(selectedDate);
        addPositiveBtnHome.disabled = !editable || !currentUser;
        useTemplateBtn.disabled = !currentUser;
    };
    const initializeUseTemplatePage = async () => {
        if (!currentUser) {
            templateMasterListEl.innerHTML = '<li>Please sign in to see your templates.</li>';
            return;
        }
        const allPositives = await getAllPositives();

        // Calculate usage counts
        const positiveCounts = allPositives.reduce((acc, p) => {
            acc[p.name] = (acc[p.name] || 0) + 1;
            return acc;
        }, {});

        const uniquePositives = [...new Map(allPositives.map(item => [item.name, item])).values()];
        uniquePositives.forEach(p => {
            p.usageCount = positiveCounts[p.name];
        });

        uniquePositives.sort((a, b) => b.usageCount - a.usageCount);

        const renderMasterList = (filter = '') => {
            templateMasterListEl.innerHTML = '';
            const filteredPositives = uniquePositives.filter(p => p.name.toLowerCase().includes(filter.toLowerCase()));
            filteredPositives.forEach(p => {
                const li = document.createElement('li');
                li.innerHTML = `
                    <label>
                        <input type="checkbox" data-name="${p.name}" data-score="${p.score}">
                        ${p.name} (Score: ${p.score}) - Used: ${p.usageCount} time(s)
                    </label>`;
                templateMasterListEl.appendChild(li);
            });
        };

        renderMasterList(); 

        searchMasterListInput.addEventListener('input', () => {
            renderMasterList(searchMasterListInput.value);
        });

        populateTemplateSelectors();
        renderTemplateCalendar(templatePageMonth, templatePageYear);
    };
    const populateTemplateSelectors = () => {
        const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        templateMonthSelector.innerHTML = '';
        months.forEach((month, index) => {
            const option = document.createElement('option');
            option.value = index;
            option.textContent = month;
            templateMonthSelector.appendChild(option);
        });
        templateYearSelector.innerHTML = '';
        const startYear = 2024;
        const endYear = new Date().getFullYear() + 5;
        for (let i = startYear; i <= endYear; i++) {
            const option = document.createElement('option');
            option.value = i;
            option.textContent = i;
            templateYearSelector.appendChild(option);
        }
        templateMonthSelector.value = templatePageMonth;
        templateYearSelector.value = templatePageYear;
    };
    const renderTemplateCalendar = async (month, year) => {
        templateCalendarEl.innerHTML = '';
        const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        dayNames.forEach(day => {
            const dayNameEl = document.createElement('div');
            dayNameEl.textContent = day;
            dayNameEl.classList.add('calendar-day-name');
            templateCalendarEl.appendChild(dayNameEl);
        });
        const firstDay = new Date(Date.UTC(year, month, 1)).getUTCDay();
        const emptyCells = (firstDay === 0) ? 6 : firstDay - 1;
        for (let i = 0; i < emptyCells; i++) {
            templateCalendarEl.appendChild(document.createElement('div'));
        }
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        for (let i = 1; i <= daysInMonth; i++) {
            const dayCell = document.createElement('button');
            dayCell.classList.add('calendar-day');
            dayCell.textContent = i;
            dayCell.dataset.date = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
            templateCalendarEl.appendChild(dayCell);
        }
    };

    const updateUIForAuthState = async () => {
        if (currentUser) {
            signoutBtn.textContent = 'Sign Out';
            await populateMyTemplates();
        } else {
            signoutBtn.textContent = 'Sign In';
            myTemplates = [];
        }
        updateButtonStates();
        await refreshHomePage();
    };

    // --- Initial Load ---
    const init = async () => {
        onAuthStateChange(async (user) => {
            currentUser = user;
            document.body.classList.remove('loading');
            populateMainSelectors();
            await updateUIForAuthState();
        });

        signoutBtn.addEventListener('click', async () => {
            if (currentUser) {
                await logoutUser();
            } else {
                window.location.href = 'login.html';
            }
        });

        setupDropdown(positiveTemplatesInput, standardTemplatesOptions, () => standardTemplates, (value) => {
            const hasText = value.trim() !== '';
            positiveNameInput.disabled = hasText;
            myPositiveTemplatesInput.disabled = hasText;
        });
        setupDropdown(myPositiveTemplatesInput, myTemplatesOptions, () => myTemplates, (value) => {
            const hasText = value.trim() !== '';
            positiveNameInput.disabled = hasText;
            positiveTemplatesInput.disabled = hasText;
            const selectedTemplate = myTemplates.find(t => t.name === value);
            if (selectedTemplate) {
                difficultySlider.value = selectedTemplate.score;
                difficultyValue.textContent = selectedTemplate.score;
            }
        });
    };

    init();
});
