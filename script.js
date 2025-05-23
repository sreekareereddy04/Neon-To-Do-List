document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const taskInput = document.getElementById('new-task-input');
    const addTaskBtn = document.getElementById('add-task-btn');
    const taskList = document.getElementById('task-list');
    const filterBtns = document.querySelectorAll('.filter-btn');
    const taskForm = document.getElementById('task-form');
    const editTaskTitle = document.getElementById('edit-task-title');
    const editTaskDescription = document.getElementById('edit-task-description');
    const editTaskDue = document.getElementById('edit-task-due');
    const editTaskPriority = document.getElementById('edit-task-priority');
    const saveTaskBtn = document.getElementById('save-task-btn');
    const cancelEditBtn = document.getElementById('cancel-edit-btn');
    
    // State
    let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    let currentFilter = 'all';
    let editingTaskId = null;
    
    // Initialize the app
    renderTasks();
    
    // Event Listeners
    addTaskBtn.addEventListener('click', addTask);
    taskInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') addTask();
    });
    
    filterBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            filterBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            currentFilter = this.dataset.filter;
            renderTasks();
        });
    });
    
    saveTaskBtn.addEventListener('click', saveTask);
    cancelEditBtn.addEventListener('click', cancelEdit);
    
    // Functions
    function addTask() {
        const title = taskInput.value.trim();
        if (title) {
            const newTask = {
                id: Date.now(),
                title,
                description: '',
                due: '',
                priority: 'low',
                completed: false,
                createdAt: new Date().toISOString()
            };
            
            tasks.push(newTask);
            saveTasks();
            taskInput.value = '';
            renderTasks();
            
            // Open the edit form for the new task
            editingTaskId = newTask.id;
            openEditForm(newTask);
        }
    }
    
    function openEditForm(task) {
        editingTaskId = task.id;
        editTaskTitle.value = task.title;
        editTaskDescription.value = task.description;
        editTaskDue.value = task.due;
        editTaskPriority.value = task.priority;
        taskForm.classList.add('active');
    }
    
    function saveTask() {
        const title = editTaskTitle.value.trim();
        if (title) {
            const taskIndex = tasks.findIndex(task => task.id === editingTaskId);
            
            if (taskIndex !== -1) {
                tasks[taskIndex] = {
                    ...tasks[taskIndex],
                    title,
                    description: editTaskDescription.value,
                    due: editTaskDue.value,
                    priority: editTaskPriority.value
                };
                
                saveTasks();
                renderTasks();
                cancelEdit();
            }
        }
    }
    
    function cancelEdit() {
        editingTaskId = null;
        taskForm.classList.remove('active');
    }
    
    function toggleTaskComplete(taskId) {
        const taskIndex = tasks.findIndex(task => task.id === taskId);
        if (taskIndex !== -1) {
            tasks[taskIndex].completed = !tasks[taskIndex].completed;
            saveTasks();
            renderTasks();
        }
    }
    
    function deleteTask(taskId) {
        tasks = tasks.filter(task => task.id !== taskId);
        saveTasks();
        renderTasks();
    }
    
    function saveTasks() {
        localStorage.setItem('tasks', JSON.stringify(tasks));
    }
    
    function renderTasks() {
        // Filter tasks based on current filter
        let filteredTasks = [];
        
        switch (currentFilter) {
            case 'active':
                filteredTasks = tasks.filter(task => !task.completed);
                break;
            case 'completed':
                filteredTasks = tasks.filter(task => task.completed);
                break;
            default:
                filteredTasks = [...tasks];
        }
        
        // Sort tasks: incomplete first, then by priority (high to low), then by creation date
        filteredTasks.sort((a, b) => {
            if (a.completed !== b.completed) {
                return a.completed ? 1 : -1;
            }
            
            const priorityOrder = { high: 3, medium: 2, low: 1 };
            if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
                return priorityOrder[b.priority] - priorityOrder[a.priority];
            }
            
            return new Date(a.createdAt) - new Date(b.createdAt);
        });
        
        // Clear the task list
        taskList.innerHTML = '';
        
        // Show empty state if no tasks
        if (filteredTasks.length === 0) {
            const emptyState = document.createElement('div');
            emptyState.className = 'empty-state';
            emptyState.innerHTML = `
                <i class="fas fa-tasks"></i>
                <h3>No tasks ${currentFilter === 'all' ? 'yet' : currentFilter}</h3>
                <p>${currentFilter === 'all' ? 'Add your first task to get started' : 'No tasks match this filter'}</p>
            `;
            taskList.appendChild(emptyState);
            return;
        }
        
        // Render each task
        filteredTasks.forEach(task => {
            const taskElement = document.createElement('div');
            taskElement.className = `task-card ${task.completed ? 'completed' : ''} priority-${task.priority}`;
            taskElement.innerHTML = `
                <div class="task-title">${task.title}</div>
                ${task.description ? `<div class="task-description">${task.description}</div>` : ''}
                ${task.due ? `<div class="task-due"><i class="far fa-clock"></i> ${formatDueDate(task.due)}</div>` : ''}
                <div class="task-priority">${task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}</div>
                <div class="task-actions">
                    <button class="action-btn complete-btn" data-id="${task.id}">
                        <i class="fas fa-${task.completed ? 'undo' : 'check'}"></i> ${task.completed ? 'Undo' : 'Complete'}
                    </button>
                    <button class="action-btn edit-btn" data-id="${task.id}">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="action-btn delete-btn" data-id="${task.id}">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            `;
            
            taskList.appendChild(taskElement);
        });
        
        // Add event listeners to action buttons
        document.querySelectorAll('.complete-btn').forEach(btn => {
            btn.addEventListener('click', () => toggleTaskComplete(parseInt(btn.dataset.id)));
        });
        
        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const task = tasks.find(t => t.id === parseInt(btn.dataset.id));
                if (task) openEditForm(task);
            });
        });
        
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                if (confirm('Are you sure you want to delete this task?')) {
                    deleteTask(parseInt(btn.dataset.id));
                }
            });
        });
    }
    
    function formatDueDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
});