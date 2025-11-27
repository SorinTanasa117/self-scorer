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
    const verbChartCanvas = document.getElementById('verb-chart');
    const lifestyleChartBackBtn = document.getElementById('lifestyle-chart-back-btn');

    // Task Detail Popup
    const taskDetailPopup = document.getElementById('task-detail-popup');
    const taskDetailTitle = document.getElementById('task-detail-title');
    const taskDetailCount = document.getElementById('task-detail-count');
    const taskDetailScore = document.getElementById('task-detail-score');
    const taskDetailDates = document.getElementById('task-detail-dates');
    const closePopupBtn = taskDetailPopup.querySelector('.close-popup-btn');

    // Add Positive Page
    const addPositiveForm = document.getElementById('add-positive-form');
    const cancelPositiveBtn = document.getElementById('cancel-positive-btn');
    const saveTemplateBtn = document.getElementById('save-template-btn');
    const difficultySlider = document.getElementById('positive-difficulty');
    const difficultyValue = document.getElementById('difficulty-value');
    const difficultyHelpIcon = document.getElementById('difficulty-help-icon');
    const difficultyTooltip = document.getElementById('difficulty-tooltip');
    const closeTooltipBtn = document.getElementById('close-tooltip-btn');
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
    const saveFromTemplateBtnTop = document.getElementById('save-from-template-btn');
    const saveFromTemplateBtnBottom = document.getElementById('save-from-template-btn-bottom');
    const cancelFromTemplateBtn = document.getElementById('cancel-from-template-btn');

    // --- State ---
    let currentUser = null;
    let selectedDate = new Date().toISOString().split('T')[0];
    let currentMonth = new Date().getMonth();
    let currentYear = new Date().getFullYear();
    let templatePageMonth = currentMonth;
    let templatePageYear = currentYear;
    let myChart;
    let verbChart;
    let myTemplates = [];
    let lifestyleChartState = 'categories'; // Can be 'categories' or 'tasks'
    let lifestyleChartData = [];
    let selectedLifestyleCategory = '';

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
        // Explicitly reset the slider's value to 5
        difficultySlider.value = 5;
        difficultyValue.textContent = '5';
        positiveNameInput.disabled = false;
        positiveTemplatesInput.disabled = false;
        myPositiveTemplatesInput.disabled = false;
        difficultySlider.disabled = false;
        difficultyTooltip.classList.remove('visible'); // Ensure tooltip is hidden
    };

    const refreshHomePage = async () => {
        await renderCalendar(currentMonth, currentYear);
        await renderPositivesForDay(selectedDate);
        const activeRange = document.querySelector('.toggle-btn.active').dataset.range;
        await renderChart(activeRange);
        await renderVerbChart();
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

    difficultyHelpIcon.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent the document click listener from firing
        difficultyTooltip.classList.toggle('visible');
    });

    closeTooltipBtn.addEventListener('click', () => {
        difficultyTooltip.classList.remove('visible');
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
        if (!e.target.closest('.form-group')) {
            difficultyTooltip.classList.remove('visible');
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
        const newPositive = await addPositive(newPositiveData);
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
            await renderVerbChart();
        }
    });

    document.querySelectorAll('.toggle-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            document.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            const range = e.target.getAttribute('data-range');
            await renderChart(range);
            await renderVerbChart();
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
        const allCheckboxes = templateDayPositivesListEl.querySelectorAll('input[type="checkbox"]');
        const isSelectedAll = templateSelectAllBtn.textContent === 'Deselect All';

        allCheckboxes.forEach(box => {
            box.checked = !isSelectedAll;
        });

        templateSelectAllBtn.textContent = isSelectedAll ? 'Select All' : 'Deselect All';
    });

    const saveFromTemplate = async () => {
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
    };

    saveFromTemplateBtnTop.addEventListener('click', saveFromTemplate);
    saveFromTemplateBtnBottom.addEventListener('click', saveFromTemplate);

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

    const lifestyleCategories = {
        'Work': ['work', 'job', 'office', 'meeting', 'project', 'task', 'deadline', 'boss', 'colleague', 'professional', 'career', 'business', 'client', 'presentation', 'report', 'email', 'conference', 'promotion', 'salary', 'employee', 'manager', 'team', 'productivity', 'complete', 'accomplish', 'achieve'],
        'Hobbies': ['hobby', 'fun', 'game', 'play', 'sport', 'music', 'art', 'craft', 'collect', 'garden', 'cook', 'bake', 'photo', 'travel', 'movie', 'book', 'read', 'watch', 'listen', 'draw', 'paint', 'sing', 'dance', 'hike', 'fish', 'camp', 'knit', 'sew', 'puzzle', 'chess', 'entertainment'],
        'Physical Health': ['exercise', 'gym', 'workout', 'run', 'jog', 'walk', 'swim', 'bike', 'yoga', 'stretch', 'sleep', 'rest', 'diet', 'eat', 'healthy', 'meal', 'nutrition', 'vitamin', 'doctor', 'checkup', 'medicine', 'weight', 'fitness', 'strength', 'cardio', 'body', 'physical', 'sport', 'active'],
        'Mental Health': ['mental', 'therapy', 'meditate', 'mindful', 'relax', 'stress', 'anxiety', 'calm', 'peace', 'breathe', 'journal', 'reflect', 'self-care', 'emotion', 'feeling', 'mood', 'positive', 'gratitude', 'thankful', 'appreciate', 'happy', 'joy', 'content', 'wellbeing', 'wellness', 'balance', 'cope', 'heal'],
        'Community Service': ['volunteer', 'donate', 'charity', 'help', 'service', 'community', 'nonprofit', 'give', 'support', 'assist', 'aid', 'contribute', 'homeless', 'shelter', 'food bank', 'mentor', 'cause', 'civic', 'neighbor', 'kindness'],
        'Family': ['family', 'parent', 'child', 'kid', 'son', 'daughter', 'mother', 'father', 'mom', 'dad', 'sibling', 'brother', 'sister', 'grandparent', 'grandmother', 'grandfather', 'aunt', 'uncle', 'cousin', 'relative', 'home', 'dinner', 'together', 'love', 'care'],
        'Education': ['learn', 'study', 'school', 'class', 'course', 'lesson', 'teach', 'tutor', 'homework', 'exam', 'test', 'grade', 'degree', 'university', 'college', 'knowledge', 'skill', 'train', 'practice', 'improve', 'develop', 'grow', 'education', 'certificate', 'workshop', 'seminar'],
        'Creativity': ['create', 'creative', 'invent', 'design', 'write', 'compose', 'imagine', 'idea', 'inspire', 'innovate', 'artistic', 'craft', 'build', 'make', 'develop', 'express', 'original', 'unique', 'vision', 'story', 'poem', 'novel', 'sculpture', 'photography'],
        'Spirituality': ['spirit', 'pray', 'worship', 'church', 'temple', 'mosque', 'faith', 'belief', 'god', 'religion', 'soul', 'sacred', 'holy', 'divine', 'blessing', 'sermon', 'scripture', 'bible', 'quran', 'meditation', 'inner', 'purpose', 'meaning', 'transcend'],
        'Finances': ['money', 'save', 'budget', 'invest', 'bank', 'finance', 'debt', 'pay', 'bill', 'expense', 'income', 'salary', 'tax', 'retire', 'wealth', 'financial', 'credit', 'loan', 'mortgage', 'insurance', 'stock', 'fund', 'account', 'spend'],
        'Relationships': ['friend', 'relationship', 'partner', 'spouse', 'husband', 'wife', 'boyfriend', 'girlfriend', 'date', 'romance', 'love', 'affection', 'hug', 'kiss', 'social', 'connect', 'bond', 'trust', 'communicate', 'listen', 'talk', 'share', 'support', 'forgive', 'apologize', 'respect'],
        'Environmental Protection': ['environment', 'recycle', 'green', 'sustainable', 'eco', 'nature', 'climate', 'pollution', 'conserve', 'energy', 'water', 'waste', 'reduce', 'reuse', 'plant', 'tree', 'organic', 'clean', 'protect', 'earth', 'planet', 'wildlife', 'carbon'],
        'Politics': ['politic', 'vote', 'election', 'government', 'law', 'policy', 'citizen', 'civic', 'democracy', 'rights', 'activism', 'protest', 'campaign', 'candidate', 'party', 'congress', 'senate', 'president', 'mayor', 'council', 'legislation', 'reform'],
        'Miscellaneous': []
    };

    const categoryColors = {
        'Work': 'rgba(52, 152, 219, 0.7)',
        'Hobbies': 'rgba(155, 89, 182, 0.7)',
        'Physical Health': 'rgba(46, 204, 113, 0.7)',
        'Mental Health': 'rgba(241, 196, 15, 0.7)',
        'Community Service': 'rgba(230, 126, 34, 0.7)',
        'Family': 'rgba(231, 76, 60, 0.7)',
        'Education': 'rgba(26, 188, 156, 0.7)',
        'Creativity': 'rgba(142, 68, 173, 0.7)',
        'Spirituality': 'rgba(52, 73, 94, 0.7)',
        'Finances': 'rgba(39, 174, 96, 0.7)',
        'Relationships': 'rgba(192, 57, 43, 0.7)',
        'Environmental Protection': 'rgba(22, 160, 133, 0.7)',
        'Politics': 'rgba(44, 62, 80, 0.7)',
        'Miscellaneous': 'rgba(149, 165, 166, 0.7)'
    };

    const classifyPositiveToLifestyle = (positiveName) => {
        const doc = window.nlp(positiveName.toLowerCase());
        const normalizedText = positiveName.toLowerCase();
        
        const terms = doc.terms().out('array').map(w => w.toLowerCase());
        const nouns = doc.nouns().toSingular().out('array').map(w => w.toLowerCase());
        const verbs = doc.verbs().toInfinitive().out('array').map(w => w.toLowerCase());
        const allTerms = [...new Set([...terms, ...nouns, ...verbs])];
        
        let bestMatch = 'Miscellaneous';
        let highestScore = 0;
        
        for (const [category, keywords] of Object.entries(lifestyleCategories)) {
            if (category === 'Miscellaneous') continue;
            
            let score = 0;
            for (const keyword of keywords) {
                if (keyword.includes(' ')) {
                    if (normalizedText.includes(keyword)) {
                        score += 3;
                    }
                } else {
                    for (const term of allTerms) {
                        if (term === keyword) {
                            score += 2;
                        } else if (term.startsWith(keyword) || keyword.startsWith(term)) {
                            if (Math.abs(term.length - keyword.length) <= 3) {
                                score += 1;
                            }
                        }
                    }
                }
            }
            
            if (score > highestScore) {
                highestScore = score;
                bestMatch = category;
            }
        }
        
        return bestMatch;
    };

    const getDateRangeForChart = () => {
        const activeRange = document.querySelector('.toggle-btn.active')?.dataset.range || 'week';
        let startStr, endStr;
        
        switch (activeRange) {
            case 'week': {
                const selected = new Date(selectedDate + 'T00:00:00Z');
                const dayOfWeek = selected.getUTCDay();
                const offset = (dayOfWeek === 0) ? 6 : dayOfWeek - 1;
                const startDate = new Date(selected);
                startDate.setUTCDate(selected.getUTCDate() - offset);
                const endDate = new Date(startDate);
                endDate.setUTCDate(startDate.getUTCDate() + 6);
                startStr = startDate.toISOString().split('T')[0];
                endStr = endDate.toISOString().split('T')[0];
                break;
            }
            case 'month': {
                const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
                startStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-01`;
                endStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}`;
                break;
            }
            case 'year': {
                startStr = `${currentYear}-01-01`;
                endStr = `${currentYear}-12-31`;
                break;
            }
            default: {
                const selected = new Date(selectedDate + 'T00:00:00Z');
                const dayOfWeek = selected.getUTCDay();
                const offset = (dayOfWeek === 0) ? 6 : dayOfWeek - 1;
                const startDate = new Date(selected);
                startDate.setUTCDate(selected.getUTCDate() - offset);
                const endDate = new Date(startDate);
                endDate.setUTCDate(startDate.getUTCDate() + 6);
                startStr = startDate.toISOString().split('T')[0];
                endStr = endDate.toISOString().split('T')[0];
            }
        }
        
        return { startStr, endStr };
    };

    const renderVerbChart = async () => {
        if (verbChart) {
            verbChart.destroy();
        }
        lifestyleChartBackBtn.classList.toggle('hidden', lifestyleChartState === 'categories');
        if (!currentUser) {
            return;
        }
        if (lifestyleChartState === 'categories') {
            await renderLifestyleCategoriesChart();
        } else if (lifestyleChartState === 'tasks') {
            await renderLifestyleTasksChart();
        }
    };

    const renderLifestyleCategoriesChart = async () => {
        const { startStr, endStr } = getDateRangeForChart();
        const rangePositives = await getPositivesByDateRange(startStr, endStr);
        lifestyleChartData = rangePositives; // Cache the data
        const processedData = {};
        Object.keys(lifestyleCategories).forEach(category => {
            processedData[category] = { totalScore: 0, count: 0, positives: [] };
        });
        rangePositives.forEach(p => {
            const category = classifyPositiveToLifestyle(p.name);
            processedData[category].totalScore += p.score;
            processedData[category].count++;
            processedData[category].positives.push(p);
        });
        const activeCategoryData = Object.entries(processedData)
            .filter(([_, data]) => data.count > 0)
            .map(([category, data]) => ({ category, ...data, color: categoryColors[category] }))
            .sort((a, b) => b.totalScore - a.totalScore);
        const labels = activeCategoryData.map(d => d.category);
        const scores = activeCategoryData.map(d => d.totalScore);
        const colors = activeCategoryData.map(d => d.color);
        verbChart = new Chart(verbChartCanvas, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Score by Life Area',
                    data: scores,
                    backgroundColor: colors,
                    borderColor: colors.map(c => c.replace('0.7', '1')),
                    borderWidth: 1
                }]
            },
            options: {
                indexAxis: 'y',
                onClick: (e) => {
                    const activePoints = verbChart.getElementsAtEventForMode(e, 'nearest', { intersect: true }, true);
                    if (activePoints.length > 0) {
                        const { index } = activePoints[0];
                        selectedLifestyleCategory = verbChart.data.labels[index];
                        lifestyleChartState = 'tasks';
                        renderVerbChart();
                    }
                },
                responsive: true, maintainAspectRatio: false,
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                const category = context.label;
                                const data = activeCategoryData.find(d => d.category === category);
                                return data ? `${data.count} action(s), ${data.totalScore} total score` : '';
                            },
                            afterLabel: (context) => {
                                const category = context.label;
                                const data = activeCategoryData.find(d => d.category === category);
                                if (data && data.positives.length > 0) {
                                    const sample = data.positives.slice(0, 3).map(p => `  - ${p.name.substring(0, 40)}${p.name.length > 40 ? '...' : ''}`);
                                    return sample;
                                }
                                return '';
                            }
                        }
                    },
                    legend: { display: false }
                }
            }
        });
    };

    const renderLifestyleTasksChart = async () => {
        const tasksInCategory = lifestyleChartData.filter(p => classifyPositiveToLifestyle(p.name) === selectedLifestyleCategory);
        const tasksData = tasksInCategory.reduce((acc, p) => {
            if (!acc[p.name]) {
                acc[p.name] = { totalScore: 0, count: 0, dates: [] };
            }
            acc[p.name].totalScore += p.score;
            acc[p.name].count += 1; // Correctly increment by 1 for each occurrence
            acc[p.name].dates.push(p.date);
            return acc;
        }, {});
        const sortedTasks = Object.entries(tasksData)
            .map(([name, data]) => ({ name, ...data }))
            .sort((a, b) => b.totalScore - a.totalScore);
        const labels = sortedTasks.map(t => t.name);
        const scores = sortedTasks.map(t => t.totalScore);
        const categoryColor = categoryColors[selectedLifestyleCategory] || 'rgba(149, 165, 166, 0.7)';
        const splitLabels = labels.map(label => splitLabel(label, 20));

        verbChart = new Chart(verbChartCanvas, {
            type: 'bar',
            data: {
                labels: splitLabels,
                datasets: [{
                    label: `Tasks in ${selectedLifestyleCategory}`,
                    data: scores,
                    backgroundColor: categoryColor,
                    borderColor: categoryColor.replace('0.7', '1'),
                    borderWidth: 1
                }]
            },
            options: {
                indexAxis: 'y',
                onClick: (e) => {
                    const activePoints = verbChart.getElementsAtEventForMode(e, 'nearest', { intersect: true }, true);
                    if (activePoints.length > 0) {
                        const { index } = activePoints[0];
                        const taskData = sortedTasks[index];
                        if (taskData) {
                            showTaskDetailPopup(taskData);
                        }
                    }
                },
                responsive: true, maintainAspectRatio: false,
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                const index = context.dataIndex;
                                const data = sortedTasks[index];
                                return data ? `${data.count} time(s), ${data.totalScore} total score` : '';
                            }
                        }
                    },
                    legend: { display: false }
                }
            }
        });
    };

    const showTaskDetailPopup = (taskData) => {
        taskDetailTitle.textContent = taskData.name;
        taskDetailCount.textContent = taskData.count;
        taskDetailScore.textContent = taskData.totalScore;
        taskDetailDates.innerHTML = '';
        const uniqueDates = [...new Set(taskData.dates)];
        uniqueDates.forEach(date => {
            const li = document.createElement('li');
            li.textContent = date;
            taskDetailDates.appendChild(li);
        });
        taskDetailPopup.classList.remove('hidden');
    };

    const splitLabel = (label, maxLen) => {
        if (label.length <= maxLen) return label;
        const words = label.split(' ');
        const lines = [];
        let currentLine = '';
        for (const word of words) {
            if ((currentLine + word).length > maxLen) {
                lines.push(currentLine.trim());
                currentLine = '';
            }
            currentLine += `${word} `;
        }
        lines.push(currentLine.trim());
        return lines;
    };

    lifestyleChartBackBtn.addEventListener('click', () => {
        lifestyleChartState = 'categories';
        renderVerbChart();
    });

    closePopupBtn.addEventListener('click', () => {
        taskDetailPopup.classList.add('hidden');
    });

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
        // Initial UI Render
        showPage(homePage); // Make sure the home page is visible
        populateMainSelectors();
        await renderCalendar(currentMonth, currentYear);
        await renderPositivesForDay(selectedDate); // Show empty state for today
        await renderChart('week');
        updateButtonStates(); // Set initial button states

        // Authentication Handling
        onAuthStateChange(async (user) => {
            currentUser = user;
            await updateUIForAuthState();
            // Remove loading screen ONLY after auth state is confirmed and UI is updated
            document.body.classList.remove('loading');
        });

        // Event Listeners
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
