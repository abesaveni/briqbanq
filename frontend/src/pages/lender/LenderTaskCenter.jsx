import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
    CheckSquare, AlertCircle, Clock, Flag, BarChart2, CheckCircle2,
    Search, Calendar, ArrowUpSquare, Plus, Edit2, Trash2, ExternalLink, X
} from "lucide-react";
import { activityService, taskService } from "../../api/dataService";
import { useNotifications } from "../../context/NotificationContext";
import GlobalDatePicker from '../../components/common/GlobalDatePicker';

export default function LenderTaskCenter() {
    const { addNotification } = useNotifications();
    const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingTask, setEditingTask] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('All Status');
    const [priorityFilter, setPriorityFilter] = useState('All Priorities');
    const [moduleFilter, setModuleFilter] = useState('All Modules');
    const [newTask, setNewTask] = useState({
        title: '',
        description: '',
        priority: 'Medium',
        dueDate: '',
        module: 'Brickbanq'
    });

    // Sort states
    const [sortBy, setSortBy] = useState('Due Date'); // Due Date, Priority, Status, Created

    const [tasks, setTasks] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const mapTaskFromBackend = React.useCallback((task) => {
        const dueDateObj = task.due_date ? new Date(task.due_date) : null;
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        let dueDateStr = 'No Date';

        if (dueDateObj) {
            const taskDate = new Date(dueDateObj);
            taskDate.setHours(0, 0, 0, 0);

            if (taskDate < now && task.status !== 'COMPLETED') {
                dueDateStr = `Overdue (${dueDateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})`;
            } else if (taskDate.getTime() === now.getTime()) {
                dueDateStr = 'Today';
            } else {
                dueDateStr = dueDateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
            }
        }

        return {
            id: task.id,
            title: task.title,
            description: task.description,
            priority: task.priority.charAt(0) + task.priority.slice(1).toLowerCase(),
            status: task.status === 'IN_PROGRESS' ? 'In progress' : task.status.charAt(0) + task.status.slice(1).toLowerCase(),
            dueDate: dueDateStr,
            dueDateObj: dueDateObj || new Date(),
            createdAt: new Date(task.created_at),
            caseNumber: task.case_number,
            module: task.module,
            category: task.category,
            tags: task.tags || [],
            checked: task.status === 'COMPLETED',
            hasStartButton: task.status === 'PENDING' || task.status === 'OVERDUE',
            hasMoveAndMarkCompleteButtons: task.status === 'IN_PROGRESS'
        };
    }, []);

    const fetchTasks = React.useCallback(async (isSilent = false) => {
        if (!isSilent) setIsLoading(true);
        try {
            const tasksRes = await taskService.getTasks();

            if (tasksRes.success) {
                setTasks(Array.isArray(tasksRes.data) ? tasksRes.data.map(mapTaskFromBackend) : []);
            }
        } catch (error) {
            console.error('Failed to fetch tasks:', error);
        } finally {
            if (!isSilent) setIsLoading(false);
        }
    }, [mapTaskFromBackend]);

    React.useEffect(() => {
        fetchTasks();
    }, [fetchTasks]);

    // Stats calculations
    const activeTasksCount = tasks.filter(t => t.status !== 'Completed').length;
    const overdueCount = tasks.filter(t => t.status === 'Overdue' || t.dueDate.includes('Overdue')).length;
    const dueTodayCount = tasks.filter(t => t.dueDate === 'Today').length;
    const urgentCount = tasks.filter(t => t.priority === 'Urgent').length;
    const inProgressCount = tasks.filter(t => t.status === 'In progress').length;
    const completedCount = tasks.filter(t => t.status === 'Completed').length;

    // Filtering logic
    const filteredTasks = tasks.filter(task => {
        const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (task.caseNumber && task.caseNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
            task.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));

        const matchesStatus = statusFilter === 'All Status' ||
            (statusFilter === 'Completed' && task.status === 'Completed') ||
            (statusFilter === 'Pending' && task.status === 'Pending') ||
            (statusFilter === 'In progress' && task.status === 'In progress') ||
            (statusFilter === 'Overdue' && (task.status === 'Overdue' || task.dueDate.includes('Overdue'))) ||
            (statusFilter === 'Due Today' && task.dueDate === 'Today');

        const matchesPriority = priorityFilter === 'All Priorities' ||
            (priorityFilter === 'Urgent' && task.priority === 'Urgent') ||
            task.priority === priorityFilter;

        const matchesModule = moduleFilter === 'All Modules' || task.module === moduleFilter;

        return matchesSearch && matchesStatus && matchesPriority && matchesModule;
    }).sort((a, b) => {
        if (sortBy === 'Due Date') {
            return a.dueDateObj - b.dueDateObj;
        }
        if (sortBy === 'Priority') {
            const pMap = { 'Urgent': 0, 'High': 1, 'Medium': 2, 'Low': 3 };
            return pMap[a.priority] - pMap[b.priority];
        }
        if (sortBy === 'Status') {
            const sMap = { 'Overdue': 0, 'In progress': 1, 'Pending': 2, 'Completed': 3 };
            return sMap[a.status] - sMap[b.status];
        }
        if (sortBy === 'Created') {
            return b.createdAt - a.createdAt;
        }
        return 0;
    });

    const toggleTaskCheck = async (id) => {
        const task = tasks.find(t => t.id === id);
        if (!task) return;

        const newChecked = !task.checked;
        const newStatus = newChecked ? 'COMPLETED' : 'PENDING';

        // Optimistic update
        setTasks(prev => prev.map(t => t.id === id ? { ...t, checked: newChecked, status: newChecked ? 'Completed' : 'Pending' } : t));

        if (newChecked) {
            addNotification({
                type: 'task',
                title: 'Task Completed',
                message: `Task "${task.title}" has been marked as completed.`,
            });
            activityService.logActivity({
                type: 'task',
                action: 'Task Completed',
                title: task.title,
                time: 'Just now'
            });
        }

        const res = await taskService.updateTask(id, { status: newStatus });
        if (res.success) fetchTasks(true);
    };

    const handleEditTask = (task) => {
        setEditingTask(task);
        setIsEditModalOpen(true);
    };

    const handleDeleteTask = async (id) => {
        if (window.confirm('Are you sure you want to delete this task?')) {
            const taskToDelete = tasks.find(t => t.id === id);
            
            // Optimistic update
            setTasks(prev => prev.filter(t => t.id !== id));

            const res = await taskService.deleteTask(id);
            if (res.success && taskToDelete) {
                activityService.logActivity({
                    type: 'task',
                    action: 'Task Deleted',
                    title: taskToDelete.title,
                    time: 'Just now'
                });
                fetchTasks(true);
            }
        }
    };

    const handleUpdateTask = async (e) => {
        e.preventDefault();
        const payload = {
            title: editingTask.title,
            description: editingTask.description,
            priority: editingTask.priority.toUpperCase(),
            status: editingTask.status.toUpperCase().replace(' ', '_'),
            module: editingTask.module,
            due_date: editingTask.dueDateObj ? editingTask.dueDateObj.toISOString() : null
        };

        const res = await taskService.updateTask(editingTask.id, payload);
        if (res.success) {
            setIsEditModalOpen(false);
            setEditingTask(null);
            addNotification({
                type: 'task',
                title: 'Task Updated',
                message: 'Task details have been successfully updated.',
            });
            fetchTasks();
        }
    };

    const handleCreateTask = async (e) => {
        e.preventDefault();
        if (!newTask.title.trim()) return;

        const payload = {
            title: newTask.title,
            description: newTask.description,
            priority: newTask.priority.toUpperCase(),
            status: 'PENDING',
            module: newTask.module,
            due_date: newTask.dueDate ? new Date(newTask.dueDate).toISOString() : new Date().toISOString()
        };

        const res = await taskService.createTask(payload);
        if (res.success) {
            setIsNewTaskModalOpen(false);
            addNotification({
                type: 'task',
                title: 'New Task Created',
                message: `Task "${newTask.title}" has been added to your list.`,
            });
            activityService.logActivity({
                type: 'task',
                action: 'New Task Created',
                title: newTask.title,
                time: 'Just now'
            });
            setNewTask({
                title: '',
                description: '',
                priority: 'Medium',
                dueDate: '',
                module: 'Brickbanq'
            });
            fetchTasks();
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-12 pt-6">

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-[24px] sm:text-[28px] font-extrabold text-slate-900 mb-1">Task Center</h1>
                    <p className="text-slate-500 text-xs sm:text-sm">Manage all your tasks across Grow platform</p>
                </div>
                <button
                    onClick={() => setIsNewTaskModalOpen(true)}
                    className="bg-indigo-800 text-white px-5 py-2.5 rounded-lg text-sm font-bold shadow-md shadow-indigo-500/20 hover:bg-indigo-900 transition-all flex items-center justify-center gap-2 w-full sm:w-auto"
                >
                    <Plus size={16} /> New Task
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
                <button
                    onClick={() => { setStatusFilter('All Status'); setPriorityFilter('All Priorities'); }}
                    className={`bg-white p-4 sm:p-5 rounded-2xl border transition-all flex items-center justify-between text-left hover:shadow-md ${statusFilter === 'All Status' ? 'border-indigo-800 ring-1 ring-indigo-800' : 'border-gray-100 shadow-sm'}`}
                >
                    <div>
                        <h3 className="text-xl sm:text-2xl font-black text-gray-900 mb-0.5 sm:mb-1">{activeTasksCount}</h3>
                        <p className="text-[10px] sm:text-xs font-semibold text-gray-500">Active Tasks</p>
                    </div>
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-blue-50/50 flex items-center justify-center border border-blue-100/50">
                        <CheckSquare size={18} className="text-blue-700" />
                    </div>
                </button>
                <button
                    onClick={() => setStatusFilter('Overdue')}
                    className={`bg-white p-4 sm:p-5 rounded-2xl border transition-all flex items-center justify-between text-left hover:shadow-md ${statusFilter === 'Overdue' ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-100 shadow-sm'}`}
                >
                    <div>
                        <h3 className="text-xl sm:text-2xl font-black text-red-500 mb-0.5 sm:mb-1">{overdueCount}</h3>
                        <p className="text-[10px] sm:text-xs font-semibold text-gray-500">Overdue</p>
                    </div>
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-red-50/50 flex items-center justify-center border border-red-100/50">
                        <AlertCircle size={18} className="text-red-500" />
                    </div>
                </button>
                <button
                    onClick={() => setStatusFilter('Due Today')}
                    className={`bg-white p-4 sm:p-5 rounded-2xl border transition-all flex items-center justify-between text-left hover:shadow-md ${statusFilter === 'Due Today' ? 'border-orange-500 ring-1 ring-orange-500' : 'border-gray-100 shadow-sm'}`}
                >
                    <div>
                        <h3 className="text-xl sm:text-2xl font-black text-orange-500 mb-0.5 sm:mb-1">{dueTodayCount}</h3>
                        <p className="text-[10px] sm:text-xs font-semibold text-gray-500">Due Today</p>
                    </div>
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-orange-50/50 flex items-center justify-center border border-orange-100/50">
                        <Clock size={18} className="text-orange-500" />
                    </div>
                </button>
                <button
                    onClick={() => { setPriorityFilter('Urgent'); setStatusFilter('All Status'); }}
                    className={`bg-white p-4 sm:p-5 rounded-2xl border transition-all flex items-center justify-between text-left hover:shadow-md ${priorityFilter === 'Urgent' ? 'border-violet-500 ring-1 ring-violet-500' : 'border-gray-100 shadow-sm'}`}
                >
                    <div>
                        <h3 className="text-xl sm:text-2xl font-black text-violet-500 mb-0.5 sm:mb-1">{urgentCount}</h3>
                        <p className="text-[10px] sm:text-xs font-semibold text-gray-500">Urgent</p>
                    </div>
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-purple-50/50 flex items-center justify-center border border-purple-100/50">
                        <Flag size={18} className="text-violet-500" />
                    </div>
                </button>
                <button
                    onClick={() => setStatusFilter('In progress')}
                    className={`bg-white p-4 sm:p-5 rounded-2xl border transition-all flex items-center justify-between text-left hover:shadow-md ${statusFilter === 'In progress' ? 'border-blue-500 ring-1 ring-blue-500' : 'border-gray-100 shadow-sm'}`}
                >
                    <div>
                        <h3 className="text-xl sm:text-2xl font-black text-blue-500 mb-0.5 sm:mb-1">{inProgressCount}</h3>
                        <p className="text-[10px] sm:text-xs font-semibold text-gray-500">In Progress</p>
                    </div>
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-blue-50/50 flex items-center justify-center border border-blue-100/50">
                        <BarChart2 size={18} className="text-blue-500" />
                    </div>
                </button>
                <button
                    onClick={() => setStatusFilter('Completed')}
                    className={`bg-white p-4 sm:p-5 rounded-2xl border transition-all flex items-center justify-between text-left hover:shadow-md ${statusFilter === 'Completed' ? 'border-emerald-500 ring-1 ring-emerald-500' : 'border-gray-100 shadow-sm'}`}
                >
                    <div>
                        <h3 className="text-xl sm:text-2xl font-black text-emerald-500 mb-0.5 sm:mb-1">{completedCount}</h3>
                        <p className="text-[10px] sm:text-xs font-semibold text-gray-500">Completed</p>
                    </div>
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-emerald-50/50 flex items-center justify-center border border-emerald-100/50">
                        <CheckCircle2 size={18} className="text-emerald-500" />
                    </div>
                </button>
            </div>

            {/* Filters and Controls */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                    <div className="relative">
                        <label className="block text-[11px] font-bold text-gray-900 mb-1.5 pl-1">Search Tasks</label>
                        <div className="relative flex items-center">
                            <Search size={14} className="absolute left-3.5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search by title, case number, or tags..."
                                className="w-full pl-9 pr-4 py-2 text-[13px] border border-gray-200 rounded-lg focus:outline-none focus:border-blue-700 focus:ring-1 focus:ring-blue-700 transition-colors shadow-sm"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-[11px] font-bold text-gray-900 mb-1.5 pl-1">Status</label>
                        <select
                            className="w-full px-3 py-2 text-[13px] border border-gray-200 rounded-lg focus:outline-none focus:border-blue-700 focus:ring-1 focus:ring-blue-700 transition-colors bg-white font-medium shadow-sm"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option>All Status</option>
                            <option>Pending</option>
                            <option>In progress</option>
                            <option>Overdue</option>
                            <option>Completed</option>
                            <option>Due Today</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-[11px] font-bold text-gray-900 mb-1.5 pl-1">Priority</label>
                        <select
                            className="w-full px-3 py-2 text-[13px] border border-gray-200 rounded-lg focus:outline-none focus:border-blue-700 focus:ring-1 focus:ring-blue-700 transition-colors bg-white font-medium shadow-sm"
                            value={priorityFilter}
                            onChange={(e) => setPriorityFilter(e.target.value)}
                        >
                            <option>All Priorities</option>
                            <option>Low</option>
                            <option>Medium</option>
                            <option>High</option>
                            <option>Urgent</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-[11px] font-bold text-gray-900 mb-1.5 pl-1">Module</label>
                        <select
                            className="w-full px-3 py-2 text-[13px] border border-gray-200 rounded-lg focus:outline-none focus:border-blue-700 focus:ring-1 focus:ring-blue-700 transition-colors bg-white font-medium shadow-sm"
                            value={moduleFilter}
                            onChange={(e) => setModuleFilter(e.target.value)}
                        >
                            <option>All Modules</option>
                            <option>Accounting</option>
                            <option>Brickbanq</option>
                            <option>Crm</option>
                            <option>Compliance</option>
                        </select>
                    </div>
                </div>

                <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 pt-4 border-t border-gray-50">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                        <span className="text-[12px] font-bold text-gray-700">Sort by:</span>
                        <div className="flex flex-wrap gap-1.5">
                            <button
                                onClick={() => setSortBy('Due Date')}
                                className={`px-3 py-1.5 text-[12px] font-bold rounded-md flex items-center gap-1.5 transition-all ${sortBy === 'Due Date' ? 'bg-indigo-800 text-white shadow-md shadow-indigo-200' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}
                            >
                                <Calendar size={13} /> Due Date
                            </button>
                            <button
                                onClick={() => setSortBy('Priority')}
                                className={`px-3 py-1.5 text-[12px] font-bold rounded-md flex items-center gap-1.5 transition-all ${sortBy === 'Priority' ? 'bg-indigo-800 text-white shadow-md shadow-indigo-200' : 'bg-transparent text-gray-600 hover:bg-gray-50'}`}
                            >
                                <Flag size={13} /> Priority
                            </button>
                            <button
                                onClick={() => setSortBy('Status')}
                                className={`px-3 py-1.5 text-[12px] font-bold rounded-md flex items-center gap-1.5 transition-all ${sortBy === 'Status' ? 'bg-indigo-800 text-white shadow-md shadow-indigo-200' : 'bg-transparent text-gray-600 hover:bg-gray-50'}`}
                            >
                                <CheckSquare size={13} /> Status
                            </button>
                            <button
                                onClick={() => setSortBy('Created')}
                                className={`px-3 py-1.5 text-[12px] font-bold rounded-md flex items-center gap-1.5 transition-all ${sortBy === 'Created' ? 'bg-indigo-800 text-white shadow-md shadow-indigo-200' : 'bg-transparent text-gray-600 hover:bg-gray-50'}`}
                            >
                                <Clock size={13} /> Created
                            </button>
                        </div>
                    </div>
                    <span className="text-[12px] text-gray-500 font-medium pb-1 xl:pb-0">Showing {filteredTasks?.length || 0} of {tasks?.length || 0} tasks</span>
                </div>
            </div>

            {/* Tasks List */}
            <div className="space-y-4">
                {filteredTasks.map(task => (
                    <div key={task.id} className={`bg-white rounded-2xl border transition-all hover:shadow-md ${task.checked ? 'border-gray-100 opacity-80' : 'border-gray-200 shadow-sm'}`}>
                        <div className="flex flex-col md:flex-row md:items-start justify-between p-4 sm:p-5 gap-4">
                            <div className="flex items-start gap-4 flex-1">
                                <button
                                    onClick={() => toggleTaskCheck(task.id)}
                                    className={`w-5 h-5 mt-1 rounded border flex items-center justify-center transition-colors shrink-0 ${task.checked ? 'bg-blue-400 border-blue-400' : 'bg-gray-50 border-gray-300 hover:border-indigo-400'}`}
                                >
                                    {task.checked && <CheckSquare size={14} className="text-white" />}
                                </button>

                                <div className="flex-1">
                                    <h3 className={`text-[15px] sm:text-[16px] font-bold mb-1 tracking-tight ${task.checked ? 'text-gray-400 line-through font-semibold' : 'text-slate-800'}`}>
                                        {task.title}
                                    </h3>
                                    <p className={`text-[12px] sm:text-[13px] mb-3 ${task.checked ? 'text-gray-400' : 'text-gray-500'}`}>
                                        {task.description}
                                    </p>

                                    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                                        {/* Priority Badge */}
                                        <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] sm:text-[11px] font-extrabold border ${task.priority === 'Urgent' ? 'bg-red-50 text-red-600 border-red-100' :
                                            task.priority === 'High' ? 'bg-orange-50 text-orange-600 border-orange-100' :
                                                task.priority === 'Medium' ? 'bg-yellow-50 text-yellow-600 border-yellow-100' :
                                                    'bg-emerald-50 text-emerald-600 border-emerald-100'
                                            } ${task.checked ? 'opacity-50' : ''}`}>
                                            <Flag size={10} className={task.priority === 'Urgent' ? 'text-red-500' : task.priority === 'High' ? 'text-orange-500' : task.priority === 'Medium' ? 'text-yellow-500' : 'text-emerald-500'} />
                                            {task.priority}
                                        </span>

                                        {/* Status Badge */}
                                        <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] sm:text-[11px] font-extrabold border ${task.status === 'Completed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                            task.status === 'Overdue' ? 'bg-red-50 text-red-600 border-red-100' :
                                                task.status === 'In progress' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                                                    'bg-gray-50 text-gray-700 border-gray-200'
                                            } ${task.checked && task.status !== 'Completed' ? 'opacity-50' : ''}`}>
                                            {task.status === 'Completed' ? <CheckCircle2 size={10} /> : <Clock size={10} />}
                                            {task.status}
                                        </span>

                                        {/* Due Date */}
                                        <div className={`flex items-center gap-1.5 text-[11px] sm:text-[12px] font-bold ${task.dueDate.includes('Overdue') ? 'text-red-500 font-extrabold' :
                                            task.dueDate === 'Today' ? 'text-orange-500 font-extrabold' :
                                                task.dueDate === 'Tomorrow' ? 'text-amber-500 font-extrabold' :
                                                    'text-gray-500'
                                            }`}>
                                            <Calendar size={13} className="text-gray-400" />
                                            {task.dueDate}
                                        </div>

                                        {/* Reference Badge */}
                                        {task.caseNumber && (
                                            <div className="flex items-center gap-1.5 text-[11px] sm:text-[12px] font-bold text-slate-500 bg-gray-50 px-2 py-1 rounded border border-gray-100">
                                                <Edit2 size={11} className="text-slate-400" />
                                                {task.caseNumber}
                                            </div>
                                        )}

                                        {/* Module Badge */}
                                        <div className="flex items-center gap-1.5 text-[11px] sm:text-[12px] font-bold text-slate-500 bg-gray-50 px-2 py-1 rounded border border-gray-100">
                                            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
                                            {task.module}
                                        </div>

                                        {/* Category Badge */}
                                        <div className="flex items-center gap-1.5 text-[11px] sm:text-[12px] font-bold text-slate-500 bg-white px-2 py-1 rounded">
                                            <ArrowUpSquare size={13} className="text-slate-400 rotate-45" />
                                            {task.category}
                                        </div>
                                    </div>

                                    {/* Action Buttons Row */}
                                    {(!task.checked && (task.hasStartButton || task.hasMoveAndMarkCompleteButtons)) && (
                                        <div className="mt-4 pt-4 border-t border-gray-50 flex flex-wrap items-center gap-2 sm:gap-3">
                                            {task.hasStartButton && (
                                                <button 
                                                    onClick={async () => {
                                                        setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: 'In progress', hasStartButton: false, hasMoveAndMarkCompleteButtons: true } : t));
                                                        await taskService.updateTask(task.id, { status: 'IN_PROGRESS' });
                                                        fetchTasks(true);
                                                    }}
                                                    className="px-5 py-2 rounded-xl border border-gray-200 text-[12px] font-bold text-gray-700 bg-white hover:bg-gray-50 transition-all shadow-sm active:scale-95"
                                                >
                                                    Start Task
                                                </button>
                                            )}
                                            {task.hasMoveAndMarkCompleteButtons && (
                                                <>
                                                    <button 
                                                        onClick={async () => {
                                                            setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: 'Pending', hasStartButton: true, hasMoveAndMarkCompleteButtons: false } : t));
                                                            await taskService.updateTask(task.id, { status: 'PENDING' });
                                                            fetchTasks(true);
                                                        }}
                                                        className="px-5 py-2 rounded-xl border border-gray-200 text-[12px] font-bold text-gray-700 bg-white hover:bg-gray-50 transition-all shadow-sm active:scale-95"
                                                    >
                                                        Move to Pending
                                                    </button>
                                                    <button
                                                        onClick={() => toggleTaskCheck(task.id)}
                                                        className="px-5 py-2 rounded-xl text-[12px] font-bold text-white bg-indigo-800 hover:bg-indigo-900 transition-all shadow-md shadow-indigo-100 flex items-center gap-1.5 active:scale-95"
                                                    >
                                                        <CheckCircle2 size={13} /> Mark Complete
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Top Right Controls & Tags */}
                            <div className="flex flex-col items-start md:items-end justify-between md:self-stretch gap-3 md:gap-0 pl-9 md:pl-0">
                                <div className="flex items-center gap-2">
                                    {task.caseNumber && (
                                        <Link
                                            to={`/lender/case-details/${task.caseNumber}`}
                                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 text-[12px] font-bold text-slate-700 hover:bg-gray-50 transition-all active:scale-95 shadow-sm"
                                        >
                                            <ExternalLink size={13} /> View Case
                                        </Link>
                                    )}
                                    <button
                                        onClick={() => handleEditTask(task)}
                                        className="p-2 text-gray-400 hover:text-slate-700 hover:bg-gray-50 rounded-xl border border-gray-200 transition-all shadow-sm active:scale-95"
                                    >
                                        <Edit2 size={14} />
                                    </button>
                                    <button
                                        onClick={() => handleDeleteTask(task.id)}
                                        className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl border border-red-100 transition-all shadow-sm active:scale-95"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                                <div className="flex items-center gap-1.5 sm:mt-auto">
                                    {(task.tags || []).map(tag => (
                                        <span key={tag} className={`px-2 py-0.5 rounded border ${task.checked ? 'bg-gray-50 text-gray-400 border-gray-100' : 'bg-gray-50 text-gray-500 border-gray-200'} text-[10px] font-bold`}>
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* New Task Modal */}
            {isNewTaskModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setIsNewTaskModalOpen(false)}>
                    <div className="bg-white rounded-[2rem] w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-100" onClick={(e) => e.stopPropagation()}>
                        <div className="px-8 py-6 flex items-center justify-between border-b border-gray-100">
                            <h2 className="text-lg font-bold text-slate-900">Create New Task</h2>
                            <button
                                onClick={() => setIsNewTaskModalOpen(false)}
                                className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-gray-100 text-gray-400 transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleCreateTask}>
                            <div className="p-8 space-y-5">
                                <div>
                                    <label className="block text-[11px] font-bold text-gray-700 mb-1.5 pl-1 uppercase tracking-wider">Task Title</label>
                                    <input
                                        type="text"
                                        required
                                        value={newTask.title}
                                        onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                                        placeholder="Enter task title..."
                                        className="w-full px-5 py-3 text-sm border border-gray-200 rounded-[1.25rem] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[11px] font-bold text-gray-700 mb-1.5 pl-1 uppercase tracking-wider">Description</label>
                                    <textarea
                                        rows="3"
                                        value={newTask.description}
                                        onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                                        placeholder="Enter task description..."
                                        className="w-full px-5 py-3 text-sm border border-gray-200 rounded-[1.25rem] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none"
                                    ></textarea>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[11px] font-bold text-gray-700 mb-1.5 pl-1 uppercase tracking-wider">Priority</label>
                                        <select
                                            value={newTask.priority}
                                            onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                                            className="w-full px-5 py-3 text-sm border border-gray-200 rounded-[1.25rem] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all bg-white font-semibold"
                                        >
                                            <option>Low</option>
                                            <option>Medium</option>
                                            <option>High</option>
                                            <option>Urgent</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold text-gray-700 mb-1.5 pl-1 uppercase tracking-wider">Due Date</label>
                                        <GlobalDatePicker
                                            name="dueDate"
                                            value={newTask.dueDate}
                                            onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                                            className="w-full px-5 py-3 text-sm border border-gray-200 rounded-[1.25rem] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-semibold text-gray-700"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[11px] font-bold text-gray-700 mb-1.5 pl-1 uppercase tracking-wider">Module</label>
                                    <select
                                        value={newTask.module}
                                        onChange={(e) => setNewTask({ ...newTask, module: e.target.value })}
                                        className="w-full px-5 py-3 text-sm border border-gray-200 rounded-[1.25rem] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all bg-white font-semibold text-gray-700"
                                    >
                                        <option>Brickbanq</option>
                                        <option>Accounting</option>
                                        <option>CRM</option>
                                        <option>Compliance</option>
                                    </select>
                                </div>
                            </div>

                            <div className="px-8 py-5 bg-gray-50 flex items-center justify-end gap-3 border-t border-gray-100">
                                <button
                                    type="button"
                                    onClick={() => setIsNewTaskModalOpen(false)}
                                    className="px-6 py-2.5 text-xs font-bold text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all active:scale-95 shadow-sm"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-8 py-2.5 text-xs font-bold text-white bg-indigo-800 rounded-xl hover:bg-indigo-900 transition-all shadow-lg shadow-indigo-100 flex items-center gap-2 active:scale-95"
                                >
                                    <Plus size={16} /> Create Task
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Task Modal */}
            {isEditModalOpen && editingTask && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setIsEditModalOpen(false)}>
                    <div className="bg-white rounded-[2rem] w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-100" onClick={(e) => e.stopPropagation()}>
                        <div className="px-8 py-6 flex items-center justify-between border-b border-gray-100">
                            <h2 className="text-lg font-bold text-slate-900">Edit Task</h2>
                            <button
                                onClick={() => setIsEditModalOpen(false)}
                                className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-gray-100 text-gray-400 transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleUpdateTask}>
                            <div className="p-8 space-y-5">
                                <div>
                                    <label className="block text-[11px] font-bold text-gray-700 mb-1.5 pl-1 uppercase tracking-wider">Task Title</label>
                                    <input
                                        type="text"
                                        value={editingTask.title}
                                        onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })}
                                        className="w-full px-5 py-3 text-sm border border-gray-200 rounded-[1.25rem] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[11px] font-bold text-gray-700 mb-1.5 pl-1 uppercase tracking-wider">Description</label>
                                    <textarea
                                        rows="3"
                                        value={editingTask.description}
                                        onChange={(e) => setEditingTask({ ...editingTask, description: e.target.value })}
                                        className="w-full px-5 py-3 text-sm border border-gray-200 rounded-[1.25rem] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all resize-none"
                                    ></textarea>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[11px] font-bold text-gray-700 mb-1.5 pl-1 uppercase tracking-wider">Priority</label>
                                        <select
                                            value={editingTask.priority}
                                            onChange={(e) => setEditingTask({ ...editingTask, priority: e.target.value })}
                                            className="w-full px-5 py-3 text-sm border border-gray-200 rounded-[1.25rem] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all bg-white font-semibold"
                                        >
                                            <option>Low</option>
                                            <option>Medium</option>
                                            <option>High</option>
                                            <option>Urgent</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold text-gray-700 mb-1.5 pl-1 uppercase tracking-wider">Due Date</label>
                                        <GlobalDatePicker
                                            name="dueDate"
                                            value={editingTask.dueDateObj ? editingTask.dueDateObj.toISOString().split('T')[0] : ''}
                                            onChange={(e) => setEditingTask({ ...editingTask, dueDateObj: new Date(e.target.value), dueDate: e.target.value })}
                                            className="w-full px-5 py-3 text-sm border border-gray-200 rounded-[1.25rem] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-semibold text-gray-700"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[11px] font-bold text-gray-700 mb-1.5 pl-1 uppercase tracking-wider">Status</label>
                                        <select
                                            value={editingTask.status}
                                            onChange={(e) => setEditingTask({ ...editingTask, status: e.target.value })}
                                            className="w-full px-5 py-3 text-sm border border-gray-200 rounded-[1.25rem] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all bg-white font-semibold"
                                        >
                                            <option>Pending</option>
                                            <option>In progress</option>
                                            <option>Overdue</option>
                                            <option>Completed</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold text-gray-700 mb-1.5 pl-1 uppercase tracking-wider">Module</label>
                                        <select
                                            value={editingTask.module}
                                            onChange={(e) => setEditingTask({ ...editingTask, module: e.target.value })}
                                            className="w-full px-5 py-3 text-sm border border-gray-200 rounded-[1.25rem] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all bg-white font-semibold text-gray-700"
                                        >
                                            <option>Accounting</option>
                                            <option>Brickbanq</option>
                                            <option>Crm</option>
                                            <option>Compliance</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="px-8 py-5 bg-gray-50 flex items-center justify-end gap-3 border-t border-gray-100">
                                <button
                                    type="button"
                                    onClick={() => setIsEditModalOpen(false)}
                                    className="px-6 py-2.5 text-xs font-bold text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all active:scale-95 shadow-sm"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-8 py-2.5 text-xs font-bold text-white bg-indigo-800 rounded-xl hover:bg-indigo-900 transition-all shadow-lg shadow-indigo-100 flex items-center gap-2 active:scale-95"
                                >
                                    <Edit2 size={16} /> Save Changes
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
