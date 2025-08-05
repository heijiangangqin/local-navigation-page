// 全局变量
let editingCardIndex = -1;
let editingTodoIndex = -1;
let draggedCardIndex = -1;
let draggedCardElement = null;
const STORAGE_KEY = 'homepage_cards';
const NOTEPAD_KEY = 'homepage_notepad';
const TODO_KEY = 'homepage_todos';
const WIDGET_ORDER_KEY = 'homepage_widget_order';
const WEATHER_CONFIG_KEY = 'homepage_weather_config';

// DOM元素
const currentTimeEl = document.getElementById('current-time');
const currentDateEl = document.getElementById('current-date');
const cardsContainerEl = document.getElementById('cards-container');
const notepadContentEl = document.getElementById('notepad-content');
const weatherContentEl = document.getElementById('weather-content');
const todoListEl = document.getElementById('todo-list');
const todoEmptyEl = document.getElementById('todo-empty');
const todoTitleInput = document.getElementById('todo-title-input');
const addTodoBtn = document.getElementById('add-todo-btn');
const mainContentEl = document.getElementById('main-content');

// 初始化
document.addEventListener('DOMContentLoaded', async function() {
    // 初始化数据管理器
    await dataManager.initialize();
    
    initializeTime();
    initializeWeather();
    initializeCards();
    initializeNotepad();
    initializeTodos();
    initializeSearch();
    initializeModals();
    
    // 每秒更新时间
    setInterval(updateTime, 1000);
    
    // 初始化设置功能
    initializeSettings();
    
    // 初始化小部件管理功能（在DOM加载完成后）
    initializeWidgetManagement();
    
    // 初始化编辑模式功能
    initializeEditMode();
    
    // 自动聚焦到搜索框
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.focus();
    }
});

// 时间相关功能
function initializeTime() {
    updateTime();
}

function updateTime() {
    const now = new Date();
    
    // 更新时间
    const timeString = now.toLocaleTimeString('zh-CN', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
    currentTimeEl.textContent = timeString;
    
    // 更新日期
    const dateString = now.toLocaleDateString('zh-CN', {
        month: '2-digit',
        day: '2-digit',
        weekday: 'long'
    });
    
    // 农历信息（简化版）
    const lunarInfo = getLunarInfo(now);
    
    // 计算倒计时
    const countdownText = getCountdownText(now);
    
    // 如果有倒计时，则显示在日期后面
    if (countdownText) {
        currentDateEl.textContent = `${dateString} ${lunarInfo} ${countdownText}`;
    } else {
        currentDateEl.textContent = `${dateString} ${lunarInfo}`;
    }
    
    // 更新当前日期数字
    // dayNumberEl.textContent = now.getDate(); // 删除
}

function getLunarInfo(date) {
    // 简化的农历信息，实际项目中可以使用专业的农历库
    const lunarMonths = ['正', '二', '三', '四', '五', '六', '七', '八', '九', '十', '冬', '腊'];
    const lunarDays = ['初一', '初二', '初三', '初四', '初五', '初六', '初七', '初八', '初九', '初十',
                       '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十',
                       '廿一', '廿二', '廿三', '廿四', '廿五', '廿六', '廿七', '廿八', '廿九', '三十'];
    
    // 这里使用简化的计算，实际应该使用专业的农历转换库
    const month = date.getMonth() + 1;
    const day = date.getDate();
    
    return `${lunarMonths[month - 1]}月${lunarDays[day - 1] || '初一'} 丁未`;
}

// 计算倒计时文本
function getCountdownText(now) {
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTimeInMinutes = currentHour * 60 + currentMinute;
    
    // 12:00 对应 12 * 60 = 720 分钟
    // 13:30 对应 13 * 60 + 30 = 810 分钟
    // 18:00 对应 18 * 60 = 1080 分钟
    
    if (currentTimeInMinutes < 720) {
        // 12点之前，倒计时到12:00
        const minutesToNoon = 720 - currentTimeInMinutes;
        return `${minutesToNoon}分钟`;
    } else if (currentTimeInMinutes >= 810) {
        // 13:30之后，倒计时到18:00
        const minutesToEvening = 1080 - currentTimeInMinutes;
        if (minutesToEvening > 0) {
            return `${minutesToEvening}分钟`;
        }
    }
    
    // 其他时间不显示倒计时
    return '';
}

// 天气配置管理
function loadWeatherConfig() {
    return dataManager.getWeatherConfig();
}

function saveWeatherConfig(config) {
    dataManager.setWeatherConfig(config);
}

// 天气功能
function initializeWeather() {
    fetchWeather();
    // 每30分钟更新一次天气
    setInterval(fetchWeather, 30 * 60 * 1000);
}

async function fetchWeather() {
    const config = dataManager.getWeatherConfig();
    try {
        const response = await fetch(`https://restapi.amap.com/v3/weather/weatherInfo?key=${config.apiKey}&city=${config.cityCode}&extensions=base`);
        const data = await response.json();
        
        if (data.status === '1' && data.lives && data.lives.length > 0) {
            const weather = data.lives[0];
            displayWeather(weather, config);
        } else {
            throw new Error('天气数据获取失败');
        }
    } catch (error) {
        console.error('获取天气信息失败:', error);
        displayWeatherError();
    }
}

function displayWeather(weather, config) {
    const weatherIcon = getWeatherIcon(weather.weather);
    const temp = weather.temperature;
    const humidity = weather.humidity;
    const windDirection = weather.winddirection;
    const windPower = weather.windpower;
    const reportTime = new Date(weather.reporttime);
    
    weatherContentEl.innerHTML = `
        <div class="weather-main">
            <div class="weather-location">${config.cityName}</div>
            <div class="weather-icon">${weatherIcon}</div>
            <div class="weather-temp">${temp}°C</div>
            <div class="weather-desc">${weather.weather}</div>
        </div>
        <div class="weather-details">
            <div class="weather-detail">
                <span class="weather-detail-label">湿度</span>
                <span class="weather-detail-value">${humidity}%</span>
            </div>
            <div class="weather-detail">
                <span class="weather-detail-label">风向</span>
                <span class="weather-detail-value">${windDirection}</span>
            </div>
            <div class="weather-detail">
                <span class="weather-detail-label">风力</span>
                <span class="weather-detail-value">${windPower}级</span>
            </div>
            <div class="weather-detail">
                <span class="weather-detail-label">更新时间</span>
                <span class="weather-detail-value">${reportTime.getHours().toString().padStart(2, '0')}:${reportTime.getMinutes().toString().padStart(2, '0')}</span>
            </div>
        </div>
    `;
}

function displayWeatherError() {
    weatherContentEl.innerHTML = `
        <div class="weather-error">
            <div>🌧️ 天气信息获取失败</div>
            <div style="font-size: 0.8rem; margin-top: 5px;">请检查网络连接</div>
        </div>
    `;
}

function getWeatherIcon(weather) {
    const weatherMap = {
        '晴': '☀️',
        '多云': '⛅',
        '阴': '☁️',
        '小雨': '🌦️',
        '中雨': '🌧️',
        '大雨': '⛈️',
        '暴雨': '⛈️',
        '雷阵雨': '⛈️',
        '小雪': '🌨️',
        '中雪': '❄️',
        '大雪': '❄️',
        '雾': '🌫️',
        '霾': '😷',
        '沙尘暴': '🌪️'
    };
    
    return weatherMap[weather] || '🌤️';
}

// 卡片管理功能
function initializeCards() {
    renderCards();
}

function getCards() {
    return dataManager.getCards();
}

function setCards(cards) {
    dataManager.setCards(cards);
}

function renderCards() {
    const cards = getCards();
    cardsContainerEl.innerHTML = '';
    
    if (cards.length === 0) {
        cardsContainerEl.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; color: white; padding: 40px;">
                <div style="font-size: 3rem; margin-bottom: 20px;">📱</div>
                <div style="font-size: 1.2rem; margin-bottom: 10px;">暂无应用卡片</div>
                <div style="opacity: 0.8;">点击上方"添加卡片"按钮开始添加您常用的网站</div>
            </div>
        `;
        return;
    }
    
    const isEditMode = document.querySelector('.cards-section').classList.contains('edit-mode');
    
    cards.forEach((card, index) => {
        const cardEl = document.createElement('div');
        cardEl.className = 'card';
        cardEl.draggable = isEditMode;
        cardEl.dataset.index = index;
        cardEl.innerHTML = `
            <div class="card-actions">
                <button class="action-btn edit-btn" title="编辑">✏️</button>
                <button class="action-btn delete-btn" title="删除">🗑️</button>
            </div>
            <div class="card-drag-handle" title="拖拽排序">⋮⋮</div>
            <img src="${card.icon || 'icons/default-icon.svg'}" 
                 alt="${card.name}" class="card-icon" onerror="this.src='icons/default-icon.svg'">
            <div class="card-name">${card.name}</div>
        `;
        
        // 点击卡片打开链接（仅在非编辑模式下）
        cardEl.addEventListener('click', function(e) {
            if (!e.target.classList.contains('action-btn') && !document.querySelector('.cards-section').classList.contains('edit-mode')) {
                window.open(card.url, '_blank');
            }
        });
        
        // 编辑按钮
        const editBtn = cardEl.querySelector('.edit-btn');
        editBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            openEditModal(index);
        });
        
        // 删除按钮
        const deleteBtn = cardEl.querySelector('.delete-btn');
        deleteBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            if (confirm(`确定要删除"${card.name}"吗？`)) {
                const cards = getCards();
                cards.splice(index, 1);
                setCards(cards);
                renderCards();
            }
        });
        

        
        cardsContainerEl.appendChild(cardEl);
    });
}



function saveWidgetOrder() {
    const widgets = document.querySelectorAll('.widget');
    const widgetOrder = Array.from(widgets).map(widget => widget.dataset.widgetType);
    dataManager.setWidgetOrder(widgetOrder);
}

function loadWidgetOrder() {
    const widgetOrder = dataManager.getWidgetOrder();
    if (widgetOrder && widgetOrder.length > 0) {
        const container = document.querySelector('.widgets-container');
        if (!container) return;
        
        // 根据保存的顺序重新排列小部件
        widgetOrder.forEach((widgetType) => {
            const widget = container.querySelector(`[data-widget-type="${widgetType}"]`);
            if (widget) {
                container.appendChild(widget);
            }
        });
    }
}

// 卡片拖拽排序功能
function handleDragStart(e) {
    // 如果点击的是编辑或删除按钮，不启动拖拽
    if (e.target.classList.contains('action-btn')) {
        e.preventDefault();
        return;
    }
    
    draggedCardIndex = parseInt(e.target.closest('.card').dataset.index);
    draggedCardElement = e.target.closest('.card');
    draggedCardElement.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', draggedCardElement.outerHTML);
    
    // 设置拖拽图像
    const rect = draggedCardElement.getBoundingClientRect();
    e.dataTransfer.setDragImage(draggedCardElement, rect.width / 2, rect.height / 2);
}

function handleDragEnd(e) {
    if (draggedCardElement) {
        draggedCardElement.classList.remove('dragging');
    }
    draggedCardIndex = -1;
    draggedCardElement = null;
    
    // 移除所有拖拽相关的样式
    const cards = document.querySelectorAll('.card');
    cards.forEach(card => {
        card.classList.remove('drag-over');
    });
    
    // 移除容器边缘样式
    const container = document.querySelector('.cards-container');
    if (container) {
        container.classList.remove('drag-to-start', 'drag-to-end');
    }
}

function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    const targetCard = e.target.closest('.card');
    const container = e.target.closest('.cards-container');
    
    if (!container) return;
    
    // 移除所有拖拽悬停样式
    const cards = document.querySelectorAll('.card');
    cards.forEach(card => card.classList.remove('drag-over'));
    
    if (targetCard && targetCard !== draggedCardElement) {
        // 拖拽到卡片上
        targetCard.classList.add('drag-over');
    } else if (!targetCard && draggedCardElement) {
        // 拖拽到容器空白区域，判断是否拖拽到边缘
        const rect = container.getBoundingClientRect();
        const mouseX = e.clientX;
        const mouseY = e.clientY;
        
        const cardsArray = Array.from(cards);
        if (cardsArray.length === 0) return;
        
        // 边缘检测阈值
        const edgeThreshold = 80;
        
        // 判断是否拖拽到容器边缘
        if (mouseX < rect.left + edgeThreshold || mouseY < rect.top + edgeThreshold) {
            // 拖拽到左上边缘，高亮第一个卡片
            cardsArray[0].classList.add('drag-over');
            container.classList.add('drag-to-start');
            container.classList.remove('drag-to-end');
        } else if (mouseX > rect.right - edgeThreshold || mouseY > rect.bottom - edgeThreshold) {
            // 拖拽到右下边缘，高亮最后一个卡片
            cardsArray[cardsArray.length - 1].classList.add('drag-over');
            container.classList.add('drag-to-end');
            container.classList.remove('drag-to-start');
        } else {
            // 不在边缘，移除边缘样式
            container.classList.remove('drag-to-start', 'drag-to-end');
        }
    }
}

function handleDrop(e) {
    e.preventDefault();
    const targetCard = e.target.closest('.card');
    const container = e.target.closest('.cards-container');
    
    if (!container || !draggedCardElement) return;
    
    let targetIndex = -1;
    
    if (targetCard && targetCard !== draggedCardElement) {
        // 拖拽到卡片上
        targetIndex = parseInt(targetCard.dataset.index);
    } else if (!targetCard) {
        // 拖拽到容器空白区域，判断是否拖拽到边缘
        const rect = container.getBoundingClientRect();
        const mouseX = e.clientX;
        const mouseY = e.clientY;
        
        const cardsArray = Array.from(document.querySelectorAll('.card'));
        if (cardsArray.length === 0) return;
        
        // 边缘检测阈值
        const edgeThreshold = 80;
        
        // 判断是否拖拽到容器边缘
        if (mouseX < rect.left + edgeThreshold || mouseY < rect.top + edgeThreshold) {
            // 拖拽到左上边缘，插入到第一个位置
            targetIndex = 0;
        } else if (mouseX > rect.right - edgeThreshold || mouseY > rect.bottom - edgeThreshold) {
            // 拖拽到右下边缘，插入到最后一个位置
            targetIndex = cardsArray.length;
        }
    }
    
    if (draggedCardIndex === -1 || targetIndex === -1 || targetIndex === draggedCardIndex) return;
    
    // 重新排序卡片数组
    const draggedCard = getCards()[draggedCardIndex];
    const cards = getCards();
    cards.splice(draggedCardIndex, 1);
    cards.splice(targetIndex, 0, draggedCard);
    setCards(cards);
    
    // 保存并重新渲染
    saveWidgetOrder(); // 保存小部件顺序
    renderCards();
    
    // 重新启用拖拽功能（因为重新渲染后需要重新绑定事件）
    if (document.querySelector('.cards-section').classList.contains('edit-mode')) {
        setTimeout(() => {
            enableCardDrag();
        }, 10);
    }
}

function handleDragEnter(e) {
    const targetCard = e.target.closest('.card');
    const container = e.target.closest('.cards-container');
    
    if (targetCard && targetCard !== draggedCardElement) {
        targetCard.classList.add('drag-over');
    } else if (!targetCard && container && draggedCardElement) {
        // 进入容器空白区域，检查是否在边缘
        const rect = container.getBoundingClientRect();
        const mouseX = e.clientX;
        const mouseY = e.clientY;
        
        const cardsArray = Array.from(document.querySelectorAll('.card'));
        if (cardsArray.length === 0) return;
        
        const edgeThreshold = 80;
        
        if (mouseX < rect.left + edgeThreshold || mouseY < rect.top + edgeThreshold) {
            cardsArray[0].classList.add('drag-over');
            container.classList.add('drag-to-start');
            container.classList.remove('drag-to-end');
        } else if (mouseX > rect.right - edgeThreshold || mouseY > rect.bottom - edgeThreshold) {
            cardsArray[cardsArray.length - 1].classList.add('drag-over');
            container.classList.add('drag-to-end');
            container.classList.remove('drag-to-start');
        } else {
            container.classList.remove('drag-to-start', 'drag-to-end');
        }
    }
}

function handleDragLeave(e) {
    const targetCard = e.target.closest('.card');
    const container = e.target.closest('.cards-container');
    
    if (targetCard) {
        // 检查是否真的离开了卡片区域
        const rect = targetCard.getBoundingClientRect();
        const mouseX = e.clientX;
        const mouseY = e.clientY;
        
        if (mouseX < rect.left || mouseX > rect.right || mouseY < rect.top || mouseY > rect.bottom) {
            targetCard.classList.remove('drag-over');
        }
    } else if (container) {
        // 检查是否真的离开了容器区域
        const rect = container.getBoundingClientRect();
        const mouseX = e.clientX;
        const mouseY = e.clientY;
        
        if (mouseX < rect.left || mouseX > rect.right || mouseY < rect.top || mouseY > rect.bottom) {
            // 移除所有拖拽悬停样式
            const cards = document.querySelectorAll('.card');
            cards.forEach(card => card.classList.remove('drag-over'));
        }
    }
}

// 记事本功能
function initializeNotepad() {
    // 加载保存的内容
    const savedContent = dataManager.getNotepad();
    if (savedContent) {
        notepadContentEl.value = savedContent;
    }
    
    // 自动保存
    notepadContentEl.addEventListener('input', function() {
        dataManager.setNotepad(this.value);
    });
}

// 待办事项功能
function initializeTodos() {
    renderTodos();
    // 绑定添加待办事件
    addTodoBtn.addEventListener('click', addNewTodo);
    // 绑定回车键添加待办
    todoTitleInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            addNewTodo();
        }
    });
}

function getTodos() {
    return dataManager.getTodos();
}

function setTodos(todos) {
    dataManager.setTodos(todos);
}

function renderTodos() {
    const todos = getTodos();
    if (todos.length === 0) {
        todoListEl.innerHTML = '';
        todoEmptyEl.style.display = 'block';
        return;
    }
    todoEmptyEl.style.display = 'none';
    // 计算统计信息
    const totalTodos = todos.length;
    const completedTodos = todos.filter(todo => todo.completed).length;
    const progressPercentage = totalTodos > 0 ? (completedTodos / totalTodos) * 100 : 0;
    let todosHTML = `
        <div class="todo-stats">
            <div class="todo-count">${completedTodos}/${totalTodos} 已完成</div>
            <div class="todo-progress">
                <span>${Math.round(progressPercentage)}%</span>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${progressPercentage}%"></div>
                </div>
            </div>
        </div>
    `;
    // 按优先级和完成状态排序
    const sortedTodos = [...todos].sort((a, b) => {
        if (a.completed !== b.completed) {
            return a.completed ? 1 : -1;
        }
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
    sortedTodos.forEach((todo, index) => {
        todosHTML += `
            <div class="todo-item ${todo.completed ? 'completed' : ''}" data-id="${todo.id}">
                <div class="todo-content">
                    <div class="todo-header">
                        <input type="checkbox" class="todo-checkbox" ${todo.completed ? 'checked' : ''}>
                        <div class="todo-title">${todo.title}</div>
                        <div class="todo-priority ${todo.priority}" title="点击切换优先级">${getPriorityText(todo.priority)}</div>
                    </div>
                    ${todo.description ? `<div class="todo-description">${todo.description}</div>` : ''}
                </div>
                <div class="todo-actions">
                    <button class="todo-action-btn delete-todo-btn" title="删除">🗑️</button>
                </div>
            </div>
        `;
    });
    todoListEl.innerHTML = todosHTML;
    // 重新绑定事件
    bindTodoEvents();
}

function getPriorityText(priority) {
    const priorityMap = {
        high: '高',
        medium: '中',
        low: '低'
    };
    return priorityMap[priority] || '中';
}

function toggleTodoComplete(todoId) {
    const todos = getTodos();
    const todoIndex = todos.findIndex(todo => todo.id === todoId);
    if (todoIndex !== -1) {
        todos[todoIndex].completed = !todos[todoIndex].completed;
        setTodos(todos);
        renderTodos();
    }
}

function toggleTodoPriority(todoId) {
    const todos = getTodos();
    const todoIndex = todos.findIndex(todo => todo.id === todoId);
    if (todoIndex !== -1) {
        const currentPriority = todos[todoIndex].priority;
        const priorityOrder = ['low', 'medium', 'high'];
        const currentIndex = priorityOrder.indexOf(currentPriority);
        const nextIndex = (currentIndex + 1) % priorityOrder.length;
        const newPriority = priorityOrder[nextIndex];
        todos[todoIndex].priority = newPriority;
        setTodos(todos);
        // 立即更新当前元素的显示
        const priorityElement = document.querySelector(`[data-id="${todoId}"] .todo-priority`);
        if (priorityElement) {
            priorityElement.className = `todo-priority ${newPriority}`;
            priorityElement.textContent = getPriorityText(newPriority);
        }
    }
}

function bindTodoEvents() {
    // 绑定复选框事件
    const checkboxes = todoListEl.querySelectorAll('.todo-checkbox');
    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const todoItem = this.closest('.todo-item');
            const todoId = parseInt(todoItem.dataset.id);
            toggleTodoComplete(todoId);
        });
    });
    
    // 绑定优先级点击事件
    const priorityElements = todoListEl.querySelectorAll('.todo-priority');
    priorityElements.forEach(priorityEl => {
        priorityEl.addEventListener('click', function(e) {
            e.stopPropagation();
            const todoItem = this.closest('.todo-item');
            const todoId = parseInt(todoItem.dataset.id);
            toggleTodoPriority(todoId);
        });
    });
    
    // 绑定删除按钮事件
    const deleteBtns = todoListEl.querySelectorAll('.delete-todo-btn');
    deleteBtns.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            const todoItem = this.closest('.todo-item');
            const todoId = parseInt(todoItem.dataset.id);
            deleteTodo(todoId);
        });
    });
}

function deleteTodo(todoId) {
    let todos = getTodos();
    todos = todos.filter(todo => todo.id !== todoId);
    setTodos(todos);
    renderTodos();
}

function addNewTodo() {
    const title = todoTitleInput.value.trim();
    if (!title) return;
    const todos = getTodos();
    const newTodo = {
        id: Date.now(),
        title: title,
        description: '',
        priority: 'medium',
        completed: false,
        createdAt: new Date().toISOString()
    };
    todos.push(newTodo);
    setTodos(todos);
    renderTodos();
    todoTitleInput.value = '';
}

// 搜索功能
function initializeSearch() {
    const searchInput = document.getElementById('search-input');
    const searchBtn = document.querySelector('.search-btn');
    
    function performSearch() {
        const query = searchInput.value.trim();
        if (query) {
            // 使用百度搜索
            window.open(`https://www.baidu.com/s?wd=${encodeURIComponent(query)}`, '_blank');
        }
    }
    
    searchBtn.addEventListener('click', performSearch);
    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            performSearch();
        }
    });
}

// 模态框功能
function initializeModals() {
    const addCardBtn = document.getElementById('add-card-btn');
    const cardModal = document.getElementById('card-modal');
    const editModal = document.getElementById('edit-modal');
    const weatherConfigModal = document.getElementById('weather-config-modal');
    const settingsModal = document.getElementById('settings-modal');
    const closeModalBtns = document.querySelectorAll('.close-btn, .btn-secondary');
    
    // 打开添加卡片模态框
    addCardBtn.addEventListener('click', function() {
        cardModal.style.display = 'flex';
        clearForm('card-modal');
    });
    

    
    // 关闭模态框
    closeModalBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            cardModal.style.display = 'none';
            editModal.style.display = 'none';
            weatherConfigModal.style.display = 'none';
            settingsModal.style.display = 'none';
        });
    });
    
    // 点击模态框外部关闭
    window.addEventListener('click', function(e) {
        if (e.target === cardModal) {
            cardModal.style.display = 'none';
        }
        if (e.target === editModal) {
            editModal.style.display = 'none';
        }
        if (e.target === weatherConfigModal) {
            weatherConfigModal.style.display = 'none';
        }
        if (e.target === settingsModal) {
            settingsModal.style.display = 'none';
        }
    });
    
    // 保存新卡片
    document.getElementById('save-card-btn').addEventListener('click', function() {
        const name = document.getElementById('card-name').value.trim();
        const url = document.getElementById('card-url').value.trim();
        const icon = document.getElementById('card-icon').value.trim();
        
        if (!name || !url) {
            alert('请填写卡片名称和链接地址');
            return;
        }
        
        const newCard = {
            name: name,
            url: url,
            icon: icon || null
        };
        
        const cards = getCards();
        cards.push(newCard);
        setCards(cards);
        renderCards();
        cardModal.style.display = 'none';
    });
    
    // 更新卡片
    document.getElementById('update-card-btn').addEventListener('click', function() {
        const name = document.getElementById('edit-card-name').value.trim();
        const url = document.getElementById('edit-card-url').value.trim();
        const icon = document.getElementById('edit-card-icon').value.trim();
        
        if (!name || !url) {
            alert('请填写卡片名称和链接地址');
            return;
        }
        
        if (editingCardIndex >= 0) {
            const cards = getCards();
            cards[editingCardIndex] = {
                name: name,
                url: url,
                icon: icon || null
            };
            setCards(cards);
            renderCards();
            editModal.style.display = 'none';
            editingCardIndex = -1;
        }
    });
    
    // 删除卡片
    document.getElementById('delete-card-btn').addEventListener('click', function() {
        if (editingCardIndex >= 0) {
            if (confirm(`确定要删除"${getCards()[editingCardIndex].name}"吗？`)) {
                const cards = getCards();
                cards.splice(editingCardIndex, 1);
                setCards(cards);
                renderCards();
                editModal.style.display = 'none';
                editingCardIndex = -1;
            }
        }
    });
    
    // 图标预览功能
    setupIconPreview('card-icon', 'icon-preview');
    setupIconPreview('edit-card-icon', 'edit-icon-preview');
    
    // 保存天气配置
    document.getElementById('save-weather-config-btn').addEventListener('click', function() {
        const apiKey = document.getElementById('weather-api-key').value.trim();
        const cityCode = document.getElementById('weather-city-code').value.trim();
        const cityName = document.getElementById('weather-city-name').value.trim();
        
        if (!apiKey || !cityCode || !cityName) {
            alert('请填写完整的配置信息');
            return;
        }
        
        saveWeatherConfig({ apiKey, cityCode, cityName });
        fetchWeather(); // 立即刷新
        
        alert('天气配置已保存！');
        weatherConfigModal.style.display = 'none';
    });
}

function openEditModal(index) {
    editingCardIndex = index;
    const card = getCards()[index];
    
    document.getElementById('edit-card-name').value = card.name;
    document.getElementById('edit-card-url').value = card.url;
    document.getElementById('edit-card-icon').value = card.icon || '';
    
    // 更新图标预览
    updateIconPreview('edit-icon-preview', card.icon);
    
    document.getElementById('edit-modal').style.display = 'flex';
}

function clearForm(modalId) {
    const modal = document.getElementById(modalId);
    const inputs = modal.querySelectorAll('input');
    inputs.forEach(input => input.value = '');
    
    const previews = modal.querySelectorAll('.icon-preview');
    previews.forEach(preview => preview.innerHTML = '');
}



function setupIconPreview(inputId, previewId) {
    const input = document.getElementById(inputId);
    const preview = document.getElementById(previewId);
    
    input.addEventListener('input', function() {
        updateIconPreview(previewId, this.value);
    });
}

function updateIconPreview(previewId, iconUrl) {
    const preview = document.getElementById(previewId);
    if (iconUrl && iconUrl.trim()) {
        preview.innerHTML = `<img src="${iconUrl}" alt="图标预览" onerror="this.style.display='none'">`;
    } else {
        preview.innerHTML = '';
    }
}

// 键盘快捷键
document.addEventListener('keydown', function(e) {
    // Ctrl/Cmd + N 添加新卡片
    if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        document.getElementById('add-card-btn').click();
    }
    
    // Escape 关闭模态框
    if (e.key === 'Escape') {
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            if (modal.style.display === 'flex') {
                modal.style.display = 'none';
            }
        });
    }
});

// 导出卡片数据
function exportCards() {
    const dataStr = JSON.stringify(getCards(), null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'homepage_cards.json';
    link.click();
    URL.revokeObjectURL(url);
}

// 导入卡片数据
function importCards(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importedCards = JSON.parse(e.target.result);
            if (Array.isArray(importedCards)) {
                setCards(importedCards);
                renderCards();
                alert('卡片导入成功！');
            } else {
                alert('文件格式错误');
            }
        } catch (error) {
            alert('导入失败：' + error.message);
        }
    };
    reader.readAsText(file);
}

// 设置功能
function initializeSettings() {
    const settingsBtn = document.getElementById('settings-btn');
    const settingsModal = document.getElementById('settings-modal');
    const exportBtn = document.getElementById('export-data-btn');
    const importBtn = document.getElementById('import-data-btn');
    const importInput = document.getElementById('import-data-input');
    const openWeatherConfigBtn = document.getElementById('open-weather-config-btn');
    const clearDataBtn = document.getElementById('clear-data-btn');
    
    // 打开设置模态框
    settingsBtn.addEventListener('click', function() {
        settingsModal.style.display = 'flex';
        // 重新渲染小部件管理列表
        renderWidgetOrderList();
        bindWidgetOrderEvents();
    });
    
    // 导出数据
    exportBtn.addEventListener('click', function() {
        dataManager.exportAllData();
    });
    
    // 导入数据
    importBtn.addEventListener('click', function() {
        importInput.click();
    });
    
    importInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            dataManager.importData(file).then(success => {
                if (success) {
                    // 重新渲染界面
                    renderCards();
                    renderTodos();
                    notepadContentEl.value = dataManager.getNotepad();
                    fetchWeather();         // 如果需要刷新天气
                    applyWidgetOrder();     // 如果需要刷新小部件顺序
                    alert('数据导入成功！');
                } else {
                    alert('数据导入失败，请检查文件格式');
                }
            });
        }
    });
    
    // 打开天气配置
    openWeatherConfigBtn.addEventListener('click', function() {
        settingsModal.style.display = 'none';
        // 填充当前配置
        const config = dataManager.getWeatherConfig();
        document.getElementById('weather-api-key').value = config.apiKey;
        document.getElementById('weather-city-code').value = config.cityCode;
        document.getElementById('weather-city-name').value = config.cityName;
        document.getElementById('weather-config-modal').style.display = 'flex';
    });
    
    // 清空所有数据
    clearDataBtn.addEventListener('click', function() {
        if (confirm('确定要清空所有数据吗？此操作不可恢复！')) {
            // 清空所有数据
            dataManager.data = {
                cards: [],
                todos: [],
                notepad: '',
                widgetOrder: [],
                weatherConfig: {
                    apiKey: 'e17ef733a4009a25e9e13d8d152bb6e7',
                    cityCode: '445281',
                    cityName: '普宁市'
                },
                widgetVisibility: {
                    weather: true,
                    calendar: true,
                    todo: true,
                    notepad: true
                }
            };
            
            // 重新渲染界面
            renderCards();
            renderTodos();
            notepadContentEl.value = '';
            fetchWeather();         // 如果需要刷新天气
            applyWidgetOrder();     // 如果需要刷新小部件顺序
            
            alert('所有数据已清空！');
        }
    });
}



// 应用小部件显示状态
function applyWidgetVisibility() {
    const visibility = dataManager.getWidgetVisibility();
    
    // 天气小部件
    const weatherWidget = document.querySelector('.weather-widget');
    if (weatherWidget) {
        weatherWidget.style.display = visibility.weather ? 'block' : 'none';
    }
    
    // 待办小部件
    const todoWidget = document.querySelector('.todo-widget');
    if (todoWidget) {
        todoWidget.style.display = visibility.todo ? 'block' : 'none';
    }
    
    // 记事本小部件
    const notepadWidget = document.querySelector('.notepad-widget');
    if (notepadWidget) {
        notepadWidget.style.display = visibility.notepad ? 'block' : 'none';
    }
    
    console.log('小部件显示状态已应用:', visibility);
}

// 小部件管理功能
function initializeWidgetManagement() {
    const orderList = document.getElementById('widget-order-list');
    if (!orderList) return;
    
    // 渲染排序列表
    renderWidgetOrderList();
    
    // 绑定拖拽事件
    bindWidgetOrderEvents();
    
    // 应用初始显示状态和排序
    applyWidgetVisibility();
    applyWidgetOrder();
}

// 渲染小部件排序列表
function renderWidgetOrderList() {
    const orderList = document.getElementById('widget-order-list');
    const widgetOrder = dataManager.getWidgetOrder();
    const visibility = dataManager.getWidgetVisibility();
    
    // 修改widgetConfig，移除日历，只保留weather、todo、notepad
    const widgetConfig = {
        weather: { icon: '🌤️', name: '天气' },
        todo: { icon: '✅', name: '待办事项' },
        notepad: { icon: '📝', name: '记事本' }
    };
    
    let orderHTML = '';
    
    // 如果有保存的顺序，使用保存的顺序
    if (widgetOrder && widgetOrder.length > 0) {
        widgetOrder.forEach(widgetType => {
            if (widgetConfig[widgetType]) {
                const isVisible = visibility[widgetType];
                const toggleIcon = isVisible ? '👁️' : '👁️‍🗨️';
                const toggleClass = isVisible ? 'visible' : 'hidden';
                
                orderHTML += `
                    <div class="widget-order-item" data-widget-type="${widgetType}">
                        <div class="widget-order-handle">⋮⋮</div>
                        <div class="widget-order-text">${widgetConfig[widgetType].icon} ${widgetConfig[widgetType].name}</div>
                        <button class="widget-order-toggle ${toggleClass}" data-widget-type="${widgetType}" title="${isVisible ? '隐藏' : '显示'}">${toggleIcon}</button>
                    </div>
                `;
            }
        });
    } else {
        // 默认顺序
        Object.entries(widgetConfig).forEach(([widgetType, config]) => {
            const isVisible = visibility[widgetType];
            const toggleIcon = isVisible ? '👁️' : '👁️‍🗨️';
            const toggleClass = isVisible ? 'visible' : 'hidden';
            
            orderHTML += `
                <div class="widget-order-item" data-widget-type="${widgetType}">
                    <div class="widget-order-handle">⋮⋮</div>
                    <div class="widget-order-text">${config.icon} ${config.name}</div>
                    <button class="widget-order-toggle ${toggleClass}" data-widget-type="${widgetType}" title="${isVisible ? '隐藏' : '显示'}">${toggleIcon}</button>
                </div>
            `;
        });
    }
    
    orderList.innerHTML = orderHTML;
}

// 绑定小部件排序拖拽事件
function bindWidgetOrderEvents() {
    const orderItems = document.querySelectorAll('.widget-order-item');
    let draggedItem = null;
    
    orderItems.forEach(item => {
        item.setAttribute('draggable', true);
        
        item.addEventListener('dragstart', function(e) {
            // 如果点击的是眼睛图标，不启动拖拽
            if (e.target.classList.contains('widget-order-toggle')) {
                e.preventDefault();
                return;
            }
            
            draggedItem = this;
            this.classList.add('dragging');
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/html', this.outerHTML);
        });
        
        item.addEventListener('dragend', function(e) {
            this.classList.remove('dragging');
            draggedItem = null;
            
            // 移除所有拖拽相关的类
            document.querySelectorAll('.widget-order-item').forEach(item => {
                item.classList.remove('drag-over');
            });
        });
        
        item.addEventListener('dragover', function(e) {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
        });
        
        item.addEventListener('drop', function(e) {
            e.preventDefault();
            if (draggedItem && draggedItem !== this) {
                const container = this.parentNode;
                const draggedIndex = Array.from(container.children).indexOf(draggedItem);
                const targetIndex = Array.from(container.children).indexOf(this);
                
                if (draggedIndex < targetIndex) {
                    container.insertBefore(draggedItem, this.nextSibling);
                } else {
                    container.insertBefore(draggedItem, this);
                }
                
                // 保存新的排序
                saveWidgetOrderFromList();
            }
        });
        
        item.addEventListener('dragenter', function(e) {
            e.preventDefault();
            if (this !== draggedItem) {
                this.classList.add('drag-over');
            }
        });
        
        item.addEventListener('dragleave', function(e) {
            this.classList.remove('drag-over');
        });
    });
    
    // 绑定眼睛图标的点击事件
    const toggleButtons = document.querySelectorAll('.widget-order-toggle');
    toggleButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.stopPropagation();
            const widgetType = this.dataset.widgetType;
            const visibility = dataManager.getWidgetVisibility();
            
            // 切换显示状态
            visibility[widgetType] = !visibility[widgetType];
            dataManager.updateWidgetVisibility(visibility);
            
            // 更新按钮状态
            const isVisible = visibility[widgetType];
            this.textContent = isVisible ? '👁️' : '👁️‍🗨️';
            this.className = `widget-order-toggle ${isVisible ? 'visible' : 'hidden'}`;
            this.title = isVisible ? '隐藏' : '显示';
            
            // 应用显示状态到主界面
            applyWidgetVisibility();
            
            console.log(`小部件 ${widgetType} 显示状态已切换为:`, isVisible);
        });
    });
}

// 从排序列表保存小部件顺序
function saveWidgetOrderFromList() {
    const orderItems = document.querySelectorAll('.widget-order-item');
    const widgetOrder = Array.from(orderItems).map(item => item.dataset.widgetType);
    dataManager.setWidgetOrder(widgetOrder);
    
    // 应用新的排序到主界面
    applyWidgetOrder();
    
    console.log('小部件排序已保存:', widgetOrder);
}

// 应用小部件排序到主界面
function applyWidgetOrder() {
    const widgetOrder = dataManager.getWidgetOrder();
    if (!widgetOrder || widgetOrder.length === 0) return;
    
    const container = document.querySelector('.widgets-container');
    if (!container) return;
    
    // 根据保存的顺序重新排列小部件
    widgetOrder.forEach(widgetType => {
        const widget = container.querySelector(`[data-widget-type="${widgetType}"]`);
        if (widget) {
            container.appendChild(widget);
        }
    });
    
    console.log('小部件排序已应用:', widgetOrder);
}

// 编辑模式功能
function initializeEditMode() {
    const editModeBtn = document.getElementById('edit-mode-btn');
    const cardsSection = document.querySelector('.cards-section');
    let isEditMode = false;
    
    editModeBtn.addEventListener('click', function() {
        isEditMode = !isEditMode;
        
        if (isEditMode) {
            // 进入编辑模式
            cardsSection.classList.add('edit-mode');
            editModeBtn.classList.add('active');
            editModeBtn.textContent = '✓';
            editModeBtn.title = '完成编辑';
            
            // 重新渲染卡片以显示编辑图标
            renderCards();
            
            // 启用卡片拖拽功能
            enableCardDrag();
        } else {
            // 退出编辑模式
            cardsSection.classList.remove('edit-mode');
            editModeBtn.classList.remove('active');
            editModeBtn.textContent = '✏️';
            editModeBtn.title = '编辑模式';
            
            // 重新渲染卡片以隐藏编辑图标
            renderCards();
            
            // 禁用卡片拖拽功能
            disableCardDrag();
        }
    });
}

// 启用卡片拖拽功能
function enableCardDrag() {
    const cards = document.querySelectorAll('.card');
    cards.forEach(card => {
        card.setAttribute('draggable', true);
        
        // 移除之前的事件监听器（如果存在）
        card.removeEventListener('dragstart', handleDragStart);
        card.removeEventListener('dragend', handleDragEnd);
        card.removeEventListener('dragover', handleDragOver);
        card.removeEventListener('drop', handleDrop);
        card.removeEventListener('dragenter', handleDragEnter);
        card.removeEventListener('dragleave', handleDragLeave);
        
        // 重新绑定拖拽事件
        card.addEventListener('dragstart', handleDragStart);
        card.addEventListener('dragend', handleDragEnd);
        card.addEventListener('dragover', handleDragOver);
        card.addEventListener('drop', handleDrop);
        card.addEventListener('dragenter', handleDragEnter);
        card.addEventListener('dragleave', handleDragLeave);
    });
    
    const container = document.querySelector('.cards-container');
    if (container) {
        container.removeEventListener('dragover', handleDragOver);
        container.removeEventListener('drop', handleDrop);
        container.addEventListener('dragover', handleDragOver);
        container.addEventListener('drop', handleDrop);
    }
}

// 禁用卡片拖拽功能
function disableCardDrag() {
    const cards = document.querySelectorAll('.card');
    cards.forEach(card => {
        card.setAttribute('draggable', false);
        
        // 移除拖拽事件监听器
        card.removeEventListener('dragstart', handleDragStart);
        card.removeEventListener('dragend', handleDragEnd);
        card.removeEventListener('dragover', handleDragOver);
        card.removeEventListener('drop', handleDrop);
        card.removeEventListener('dragenter', handleDragEnter);
        card.removeEventListener('dragleave', handleDragLeave);
    });
    
    const container = document.querySelector('.cards-container');
    if (container) {
        container.removeEventListener('dragover', handleDragOver);
        container.removeEventListener('drop', handleDrop);
    }
}

// 添加快捷键提示
console.log(`
🎉 自定义首页已加载完成！

快捷键：
- Ctrl/Cmd + N: 添加新卡片
- Enter: 在待办输入框中按回车添加待办
- Escape: 关闭模态框

功能：
- 实时时间显示
- 动态日历
- 实时天气信息
- 记事本（自动保存）
- 卡片管理（增删改）
- 待办事项管理（直接添加、删除、完成）
- 响应式设计
- 内存数据存储

开发者工具中可以使用：
- exportCards(): 导出卡片数据
- importCards(file): 导入卡片数据
- dataManager.exportAllData(): 导出所有数据
- dataManager.importData(file): 导入所有数据
`); 