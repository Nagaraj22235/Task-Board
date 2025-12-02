// Task Dashboard Application
class TaskScheduler {
    constructor() {
        this.tasks = [];
        this.plans = '';
        this.currentFilter = 'all';

        // DOM elements
        this.currentDateElement = document.getElementById('currentDate');
        this.taskInput = document.getElementById('taskInput');
        this.taskPriority = document.getElementById('taskPriority');
        this.addTaskBtn = document.getElementById('addTaskBtn');
        this.tasksContainer = document.getElementById('tasksContainer');
        this.filterButtons = document.querySelectorAll('.filter-btn');
        this.plansTextarea = document.getElementById('plansTextarea');
        this.savePlansBtn = document.getElementById('savePlansBtn');
        this.clearCompletedBtn = document.getElementById('clearCompletedBtn');
        this.clearAllBtn = document.getElementById('clearAllBtn');

        // Modal elements
        this.commentModal = document.getElementById('commentModal');
        this.commentTextarea = this.commentModal.querySelector('.comment-textarea');
        this.commentCurrentTask = document.getElementById('commentCurrentTask');
        this.saveCommentBtn = document.getElementById('saveComment');
        this.cancelCommentBtn = document.getElementById('cancelComment');

        this.attachmentModal = document.getElementById('attachmentModal');
        this.attachmentInput = document.getElementById('attachmentInput');
        this.attachmentCurrentTask = document.getElementById('attachmentCurrentTask');
        this.attachmentsList = document.getElementById('attachmentsList');
        this.closeAttachmentModalBtn = document.getElementById('closeAttachmentModal');



        this.currentTaskId = null; // Track which task is being edited

        this.init();
    }

    init() {
        this.loadData();
        this.displayCurrentDate();
        this.setupEventListeners();
        this.renderTasks();
        this.updateStats();
    }

    setupEventListeners() {
        // Add task
        this.addTaskBtn.addEventListener('click', () => this.addTask());
        this.taskInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addTask();
        });

        // Filter tasks
        this.filterButtons.forEach(button => {
            button.addEventListener('click', () => {
                this.currentFilter = button.dataset.filter;
                this.updateFilterButtons();
                this.renderTasks();
            });
        });

        // Save plans
        this.savePlansBtn.addEventListener('click', () => this.savePlans());

        // Clear actions
        this.clearCompletedBtn.addEventListener('click', () => this.clearCompleted());
        this.clearAllBtn.addEventListener('click', () => this.clearAll());

        // Modal event listeners
        this.commentModal.querySelector('.close-modal').addEventListener('click', () => this.closeCommentModal());
        this.cancelCommentBtn.addEventListener('click', () => this.closeCommentModal());
        this.saveCommentBtn.addEventListener('click', () => this.saveComment());

        this.attachmentModal.querySelector('.close-modal').addEventListener('click', () => this.closeAttachmentModal());
        this.closeAttachmentModalBtn.addEventListener('click', () => this.closeAttachmentModal());
        this.attachmentInput.addEventListener('change', (e) => this.addAttachments(e.target.files));
        this.attachmentModal.querySelector('.attachments-upload').addEventListener('click', () => {
            this.attachmentInput.click();
        });

        // Close modal when clicking outside
        this.commentModal.addEventListener('click', (e) => {
            if (e.target === this.commentModal) this.closeCommentModal();
        });
        this.attachmentModal.addEventListener('click', (e) => {
            if (e.target === this.attachmentModal) this.closeAttachmentModal();
        });


    }

    displayCurrentDate() {
        const today = new Date();
        const options = {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        };
        this.currentDateElement.textContent = today.toLocaleDateString('en-US', options);
    }

    addTask() {
        const taskText = this.taskInput.value.trim();
        if (!taskText) return;

        const task = {
            id: Date.now(),
            text: taskText,
            priority: this.taskPriority.value,
            completed: false,
            createdAt: new Date().toISOString(),
            comments: '',
            attachments: []
        };

        this.tasks.push(task);
        this.taskInput.value = '';
        this.saveData();
        this.renderTasks();
        this.updateStats();

        // Show success animation
        this.animateElement(this.addTaskBtn, 'bounce-animation');

        // Add pulse effect to the newly added task
        setTimeout(() => {
            const taskElements = document.querySelectorAll('.task-item');
            const lastTaskElement = taskElements[taskElements.length - 1];
            if (lastTaskElement) {
                lastTaskElement.classList.add('bounce-animation');
                setTimeout(() => {
                    lastTaskElement.classList.remove('bounce-animation');
                }, 1000);
            }
        }, 10);

        this.showNotification('Task added successfully!', 'success');
    }

    renderTasks() {
        let filteredTasks = this.tasks;

        // Apply filters
        switch (this.currentFilter) {
            case 'pending':
                filteredTasks = this.tasks.filter(task => !task.completed);
                break;
            case 'completed':
                filteredTasks = this.tasks.filter(task => task.completed);
                break;
            case 'high':
                filteredTasks = this.tasks.filter(task => task.priority === 'high');
                break;
        }

        this.tasksContainer.innerHTML = '';

        if (filteredTasks.length === 0) {
            this.tasksContainer.innerHTML = `
                <div class="empty-state">
                    <p>${this.getEmptyStateMessage()}</p>
                </div>
            `;
            return;
        }

        filteredTasks.forEach(task => {
            const taskElement = this.createTaskElement(task);
            this.tasksContainer.appendChild(taskElement);
        });
    }

    createTaskElement(task) {
        const taskItem = document.createElement('div');
        taskItem.className = `task-item ${task.completed ? 'completed' : ''}`;
        taskItem.dataset.id = task.id;

        const completedClass = task.completed ? 'completed' : '';
        const checked = task.completed ? 'checked' : '';

        const commentsInfo = task.comments ? '<span class="indicator">💬</span>' : '';
        const attachmentsInfo = task.attachments.length > 0 ? `<span class="indicator">📎${task.attachments.length}</span>` : '';

        taskItem.innerHTML = `
            <input type="checkbox" class="task-checkbox" ${checked}>
            <div class="task-content">
                <div class="task-text">${this.escapeHtml(task.text)}</div>
                <div class="task-info">
                    ${commentsInfo} ${attachmentsInfo}
                </div>
                <div class="task-meta">
                    <span class="task-time">
                        📅 ${new Date(task.createdAt).toLocaleDateString()}
                    </span>
                    <span class="task-priority ${task.priority}">
                        ${task.priority}
                    </span>
                </div>
            </div>
            <div class="task-actions">
                <button class="task-btn comment" title="Add/Edit Comment">💬</button>
                <button class="task-btn attachment" title="Add Attachment">📎</button>
                <button class="task-btn edit" title="Edit task">✏️</button>
                <button class="task-btn delete" title="Delete task">🗑️</button>
            </div>
        `;

        // Event listeners for task actions
        const checkbox = taskItem.querySelector('.task-checkbox');
        const commentBtn = taskItem.querySelector('.task-btn.comment');
        const attachmentBtn = taskItem.querySelector('.task-btn.attachment');
        const editBtn = taskItem.querySelector('.task-btn.edit');
        const deleteBtn = taskItem.querySelector('.task-btn.delete');

        checkbox.addEventListener('change', () => this.toggleTask(task.id));
        commentBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.manageComments(task.id);
        });
        attachmentBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.manageAttachments(task.id);
        });
        editBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.editTask(task.id);
        });
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.deleteTask(task.id);
        });

        return taskItem;
    }

    toggleTask(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (task) {
            task.completed = !task.completed;
            this.saveData();
            this.renderTasks();
            this.updateStats();
        }
    }

    editTask(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (!task) return;

        const newText = prompt('Edit task:', task.text);
        if (newText && newText.trim() && newText !== task.text) {
            task.text = newText.trim();
            this.saveData();
            this.renderTasks();
        }
    }

    deleteTask(taskId) {
        if (confirm('Are you sure you want to delete this task?')) {
            this.tasks = this.tasks.filter(t => t.id !== taskId);
            this.saveData();
            this.renderTasks();
            this.updateStats();
        }
    }

    updateFilterButtons() {
        this.filterButtons.forEach(button => {
            button.classList.toggle('active', button.dataset.filter === this.currentFilter);
        });
    }

    updateStats() {
        const total = this.tasks.length;
        const completed = this.tasks.filter(task => task.completed).length;
        const pending = total - completed;

        document.getElementById('totalTasks').textContent = total;
        document.getElementById('completedTasks').textContent = completed;
        document.getElementById('pendingTasks').textContent = pending;
    }

    getEmptyStateMessage() {
        switch (this.currentFilter) {
            case 'pending':
                return 'No pending tasks! 🎉';
            case 'completed':
                return 'No completed tasks yet.';
            case 'high':
                return 'No high priority tasks.';
            default:
                return 'No tasks yet. Add your first task above! 📝';
        }
    }


    savePlans() {
        this.plans = this.plansTextarea.value;
        this.saveData();

        // Show success feedback
        this.animateElement(this.savePlansBtn, 'animate-pulse');
        this.showNotification('Plans saved successfully!');
    }

    clearCompleted() {
        const completedCount = this.tasks.filter(task => task.completed).length;
        if (completedCount === 0) {
            alert('No completed tasks to clear.');
            return;
        }

        if (confirm(`Clear ${completedCount} completed task(s)?`)) {
            this.tasks = this.tasks.filter(task => !task.completed);
            this.saveData();
            this.renderTasks();
            this.updateStats();
        }
    }

    clearAll() {
        if (this.tasks.length === 0) {
            alert('No tasks to clear.');
            return;
        }

        if (confirm('Are you sure you want to clear all tasks?')) {
            this.tasks = [];
            this.saveData();
            this.renderTasks();
            this.updateStats();
        }
    }

    saveData() {
        try {
            localStorage.setItem('taskDashboard_tasks', JSON.stringify(this.tasks));
            localStorage.setItem('taskDashboard_plans', this.plans);
        } catch (error) {
            console.error('Failed to save data:', error);
            this.showNotification('Failed to save data to local storage', 'error');
        }
    }

    loadData() {
        try {
            // Try new keys first, then fall back to old keys for backward compatibility
            let tasksData = localStorage.getItem('taskDashboard_tasks');
            if (!tasksData) {
                tasksData = localStorage.getItem('dailyScheduler_tasks');
            }
            if (tasksData) {
                this.tasks = JSON.parse(tasksData);
            }

            let plansData = localStorage.getItem('taskDashboard_plans');
            if (!plansData) {
                plansData = localStorage.getItem('dailyScheduler_plans');
            }
            if (plansData) {
                this.plans = plansData;
                this.plansTextarea.value = plansData;
            }
        } catch (error) {
            console.error('Failed to load data:', error);
            this.tasks = [];
            this.plans = '';
            this.showNotification('Failed to load saved data', 'error');
        }
    }

    animateElement(element, animationClass) {
        element.classList.add('animate-bounce');
        setTimeout(() => {
            element.classList.remove('animate-bounce');
        }, 300);
    }

    showNotification(message, type = 'success') {
        // Simple notification system
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;

        // Add basic notification styles
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 10px;
            color: white;
            font-weight: 600;
            z-index: 1000;
            animation: slideIn 0.3s ease;
        `;

        if (type === 'error') {
            notification.style.background = '#ef4444';
        } else {
            notification.style.background = '#22c55e';
        }

        document.body.appendChild(notification);

        // Remove after 3 seconds
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }



    manageComments(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (!task) return;

        // Set current task
        this.currentTaskId = taskId;

        // Fill modal with task data
        this.commentCurrentTask.innerHTML = `<strong>Task:</strong> ${this.escapeHtml(task.text)}`;
        this.commentTextarea.value = task.comments;

        // Show modal
        this.commentModal.classList.add('show');
        this.commentTextarea.focus();
    }

    closeCommentModal() {
        this.commentModal.classList.remove('show');
        this.commentTextarea.value = '';
        this.currentTaskId = null;
    }

    saveComment() {
        if (!this.currentTaskId) return;

        const task = this.tasks.find(t => t.id === this.currentTaskId);
        if (!task) return;

        const commentText = this.commentTextarea.value.trim();
        task.comments = commentText;

        this.saveData();
        this.renderTasks();
        this.showNotification('Comment updated successfully!');

        this.closeCommentModal();
    }

    manageAttachments(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (!task) return;

        // Set current task
        this.currentTaskId = taskId;

        // Fill modal with task data
        this.attachmentCurrentTask.innerHTML = `<strong>Task:</strong> ${this.escapeHtml(task.text)}`;

        // Render existing attachments
        this.renderAttachmentList(task);

        // Show modal
        this.attachmentModal.classList.add('show');
    }

    closeAttachmentModal() {
        this.attachmentModal.classList.remove('show');
        this.attachmentsList.innerHTML = '';
        this.attachmentInput.value = '';
        this.currentTaskId = null;
    }

    addAttachments(files) {
        if (!this.currentTaskId) return;

        const task = this.tasks.find(t => t.id === this.currentTaskId);
        if (!task || files.length === 0) return;

        // Display a loading notification
        this.showNotification(`Processing ${files.length} attachment(s)...`);

        let processedCount = 0;
        Array.from(files).forEach(file => {
            const reader = new FileReader();

            reader.onload = (event) => {
                const attachment = {
                    id: Date.now() + Math.random(),
                    name: file.name,
                    type: file.type,
                    size: file.size,
                    data: event.target.result // Base64 encoded data
                };

                // Add to task attachments with size limit (5MB per file)
                if (file.size > 5 * 1024 * 1024) {
                    this.showNotification(`File "${file.name}" is too large (max 5MB)`, 'error');
                } else {
                    task.attachments.push(attachment);
                }

                processedCount++;
                if (processedCount === files.length) {
                    this.saveData();
                    this.renderAttachmentList(task);
                    this.renderTasks();
                    this.showNotification(`${task.attachments.length} attachment(s) added successfully!`);
                }
            };

            reader.onerror = () => {
                this.showNotification(`Failed to read file "${file.name}"`, 'error');
                processedCount++;
            };

            reader.readAsDataURL(file);
        });
    }

    renderAttachmentList(task) {
        this.attachmentsList.innerHTML = '';

        if (task.attachments.length === 0) {
            this.attachmentsList.innerHTML = '<p style="text-align: center; color: #666; margin: 20px 0;">No attachments yet</p>';
            return;
        }

        task.attachments.forEach(attachment => {
            const attachmentItem = document.createElement('div');
            attachmentItem.className = 'attachment-item';

            const getFileIcon = (type) => {
                if (type.startsWith('image/')) return '🖼️';
                if (type === 'application/pdf') return '📄';
                if (type.includes('document') || type.includes('word')) return '📝';
                if (type === 'text/plain') return '📄';
                return '📎';
            };

            attachmentItem.innerHTML = `
                <div class="attachment-info">
                    <span class="attachment-icon">${getFileIcon(attachment.type)}</span>
                    <div class="attachment-details">
                        <div class="attachment-name">${this.escapeHtml(attachment.name)}</div>
                        <div class="attachment-size">${(attachment.size / 1024).toFixed(1)} KB</div>
                    </div>
                </div>
                <div class="attachment-actions">
                    <button class="attachment-action view" title="View attachment">👁️</button>
                    <button class="attachment-action delete" title="Delete attachment">🗑️</button>
                </div>
            `;

            // Add event listeners
            const viewBtn = attachmentItem.querySelector('.view');
            const deleteBtn = attachmentItem.querySelector('.delete');

            viewBtn.addEventListener('click', () => this.viewAttachment(task.id, attachment.id));
            deleteBtn.addEventListener('click', () => {
                this.deleteAttachment(task.id, attachment.id);
                // Re-render after deletion
                setTimeout(() => this.renderAttachmentList(task), 100);
            });

            this.attachmentsList.appendChild(attachmentItem);
        });
    }

    viewAttachment(taskId, attachmentId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (!task) return;

        const attachment = task.attachments.find(a => a.id === attachmentId);
        if (!attachment) return;

        // Open attachment in new window/tab
        const newWindow = window.open();
        if (newWindow) {
            newWindow.document.write(`
                <html>
                <head>
                    <title>${attachment.name}</title>
                    <style>
                        body { margin: 0; background: #f5f5f5; display: flex; flex-direction: column; align-items: center; padding: 20px; }
                        .header { margin-bottom: 20px; text-align: center; }
                        img { max-width: 100%; max-height: 80vh; object-fit: contain; border-radius: 10px; box-shadow: 0 5px 15px rgba(0,0,0,0.2); }
                        iframe { width: 100%; height: 80vh; border: none; border-radius: 10px; box-shadow: 0 5px 15px rgba(0,0,0,0.2); }
                        .download-btn { margin-top: 20px; padding: 10px 20px; background: #667eea; color: white; border: none; border-radius: 5px; cursor: pointer; }
                        .download-btn:hover { background: #5a67d8; }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <h2>${attachment.name}</h2>
                        <p>Size: ${(attachment.size / 1024).toFixed(1)} KB</p>
                    </div>
                    ${attachment.type.startsWith('image/') ?
                        `<img src="${attachment.data}" alt="${attachment.name}">` :
                        `<iframe src="${attachment.data}" title="${attachment.name}"></iframe>`
                    }
                    <button class="download-btn" onclick="downloadFile()">Download</button>
                    <script>
                        function downloadFile() {
                            const link = document.createElement('a');
                            link.href = '${attachment.data}';
                            link.download = '${attachment.name}';
                            link.click();
                        }
                    </script>
                </body>
                </html>
            `);
        }
    }

    deleteAttachment(taskId, attachmentId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (!task) return;

        if (confirm('Delete this attachment?')) {
            task.attachments = task.attachments.filter(a => a.id !== attachmentId);
            this.saveData();
            this.renderTasks();
            this.showNotification('Attachment deleted successfully!');
        }
    }



    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new TaskScheduler();
});
