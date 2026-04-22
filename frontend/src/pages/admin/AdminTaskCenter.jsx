import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    CheckSquare, AlertCircle, Clock, Flag, BarChart2, CheckCircle2,
    Search, Calendar, ArrowUpSquare, Plus, Edit2, Trash2, ExternalLink, X
} from "lucide-react";
import { taskService } from '../../api/dataService';
import { useNotifications } from '../../context/NotificationContext';

// Map API enum → display label
const STATUS_DISPLAY = { PENDING: 'Pending', IN_PROGRESS: 'In progress', OVERDUE: 'Overdue', COMPLETED: 'Completed' };
const PRIORITY_DISPLAY = { LOW: 'Low', MEDIUM: 'Medium', HIGH: 'High', URGENT: 'Urgent' };
// Map display label → API enum
const STATUS_API = { Pending: 'PENDING', 'In progress': 'IN_PROGRESS', Overdue: 'OVERDUE', Completed: 'COMPLETED' };
const PRIORITY_API = { Low: 'LOW', Medium: 'MEDIUM', High: 'HIGH', Urgent: 'URGENT' };

function formatDueDate(isoDate) {
    if (!isoDate) return 'No Date';
    const d = new Date(isoDate);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const due = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const diff = Math.round((due - today) / 86400000);
    if (diff < 0) return `Overdue (${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})`;
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Tomorrow';
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function normalizeTask(t) {
    const displayStatus = STATUS_DISPLAY[t.status] || t.status;
    return {
        ...t,
        status: displayStatus,
        priority: PRIORITY_DISPLAY[t.priority] || t.priority,
        dueDate: formatDueDate(t.due_date),
        dueDateObj: t.due_date ? new Date(t.due_date) : new Date(),
        caseNumber: t.case_number || null,
        checked: t.status === 'COMPLETED',
        tags: t.tags || [],
        hasStartButton: t.status === 'PENDING',
        hasMoveAndMarkCompleteButtons: t.status === 'IN_PROGRESS',
    };
}

export default function AdminTaskCenter() {
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

    const [sortBy, setSortBy] = useState('Due Date');
    const { addNotification } = useNotifications();

    const [tasks, setTasks] = useState([]);
    const [loadingTasks, setLoadingTasks] = useState(true);


    useEffect(() => {
        taskService.getTasks().then(res => {
            if (res.success) {
                const list = Array.isArray(res.data) ? res.data : (res.data?.items || []);
                setTasks(list.map(normalizeTask));
            }
            setLoadingTasks(false);
        }).catch(() => setLoadingTasks(false));
    }, []);

    const activeTasksCount = tasks.filter(t => t.status !== 'Completed').length;
    const overdueCount = tasks.filter(t => t.status === 'Overdue' || t.dueDate.includes('Overdue')).length;
    const dueTodayCount = tasks.filter(t => t.dueDate === 'Today').length;
    const urgentCount = tasks.filter(t => t.priority === 'Urgent').length;
    const inProgressCount = tasks.filter(t => t.status === 'In progress').length;
    const completedCount = tasks.filter(t => t.status === 'Completed').length;

    const filteredTasks = tasks.filter(task => {
        const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (task.caseNumber && task.caseNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
            task.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));

        const matchesStatus = statusFilter === 'All Status' ||
            (statusFilter === 'Active' && task.status !== 'Completed') ||
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

    const toggleTaskCheck = (id) => {
        const task = tasks.find(t => t.id === id);
        if (!task) return;
        const newStatus = task.checked ? 'PENDING' : 'COMPLETED';
        taskService.updateTask(id, { status: newStatus }).then(res => {
            if (res.success) {
                setTasks(prev => prev.map(t => t.id === id ? normalizeTask(res.data) : t));
            }
        });
    };

    const handleEditTask = (task) => {
        setEditingTask(task);
        setIsEditModalOpen(true);
    };

    const handleDeleteTask = (id) => {
        if (window.confirm('Are you sure you want to delete this task?')) {
            taskService.deleteTask(id).then(() => {
                setTasks(tasks.filter(t => t.id !== id));
            });
        }
    };

    const handleUpdateTask = (e) => {
        e.preventDefault();
        taskService.updateTask(editingTask.id, {
            title: editingTask.title,
            description: editingTask.description,
            priority: PRIORITY_API[editingTask.priority] || editingTask.priority,
            status: STATUS_API[editingTask.status] || editingTask.status,
            due_date: editingTask.dueDateObj ? editingTask.dueDateObj.toISOString() : null,
            module: editingTask.module,
        }).then(res => {
            if (res.success) {
                setTasks(prev => prev.map(t => t.id === editingTask.id ? normalizeTask(res.data) : t));
            }
        });
        setIsEditModalOpen(false);
        setEditingTask(null);
    };

    const handleCreateTask = async (e) => {
        e.preventDefault();
        if (!newTask.title.trim()) return;
        const res = await taskService.createTask({
            title: newTask.title,
            description: newTask.description || null,
            priority: PRIORITY_API[newTask.priority] || 'MEDIUM',
            status: 'PENDING',
            due_date: newTask.dueDate ? new Date(newTask.dueDate).toISOString() : null,
            module: newTask.module || null,
            tags: [],
        });
        if (res.success) {
            setTasks(prev => [normalizeTask(res.data), ...prev]);
            setIsNewTaskModalOpen(false);
            setNewTask({ title: '', description: '', priority: 'Medium', dueDate: '', module: 'Brickbanq' });
        } else {
            addNotification({ type: 'error', title: 'Task Creation Failed', message: res.error || 'Failed to create task. Please try again.' });
        }
    };

    return (
        <div className="space-y-4 animate-in fade-in duration-500 pb-8">

            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold text-gray-900">Task Center</h1>
                    <p className="text-sm text-gray-500 mt-1">Manage administrative tasks across the platform</p>
                </div>
                <button
                    onClick={() => setIsNewTaskModalOpen(true)}
                    className="bg-indigo-600 text-white px-3 py-1.5 rounded text-sm font-semibold hover:bg-indigo-700 transition-all flex items-center gap-1.5"
                >
                    <Plus size={13} /> New Task
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                <button
                    onClick={() => { setStatusFilter('Active'); setPriorityFilter('All Priorities'); }}
                    className={`bg-white p-4 rounded-xl border transition-all flex items-center justify-between text-left hover:shadow-sm ${statusFilter === 'Active' ? 'border-indigo-600 ring-1 ring-indigo-600' : 'border-gray-200 shadow-sm'}`}
                >
                    <div>
                        <h3 className="text-lg font-bold text-slate-900">{activeTasksCount}</h3>
                        <p className="text-xs font-medium text-gray-400">Active</p>
                    </div>
                    <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center border border-blue-100/50">
                        <CheckSquare size={14} className="text-blue-700" />
                    </div>
                </button>
                <button
                    onClick={() => { setStatusFilter('Overdue'); setPriorityFilter('All Priorities'); }}
                    className={`bg-white p-4 rounded-xl border transition-all flex items-center justify-between text-left hover:shadow-sm ${statusFilter === 'Overdue' ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-200 shadow-sm'}`}
                >
                    <div>
                        <h3 className="text-lg font-bold text-red-500">{overdueCount}</h3>
                        <p className="text-xs font-medium text-gray-400">Overdue</p>
                    </div>
                    <div className="w-7 h-7 rounded-lg bg-red-50 flex items-center justify-center border border-red-100/50">
                        <AlertCircle size={14} className="text-red-500" />
                    </div>
                </button>
                <button
                    onClick={() => { setStatusFilter('Due Today'); setPriorityFilter('All Priorities'); }}
                    className={`bg-white p-4 rounded-xl border transition-all flex items-center justify-between text-left hover:shadow-sm ${statusFilter === 'Due Today' ? 'border-orange-500 ring-1 ring-orange-500' : 'border-gray-200 shadow-sm'}`}
                >
                    <div>
                        <h3 className="text-lg font-bold text-orange-500">{dueTodayCount}</h3>
                        <p className="text-xs font-medium text-gray-400">Due Today</p>
                    </div>
                    <div className="w-7 h-7 rounded-lg bg-orange-50 flex items-center justify-center border border-orange-100/50">
                        <Clock size={14} className="text-orange-500" />
                    </div>
                </button>
                <button
                    onClick={() => { setPriorityFilter(priorityFilter === 'Urgent' ? 'All Priorities' : 'Urgent'); setStatusFilter('All Status'); }}
                    className={`bg-white p-4 rounded-xl border transition-all flex items-center justify-between text-left hover:shadow-sm ${priorityFilter === 'Urgent' ? 'border-violet-500 ring-1 ring-violet-500' : 'border-gray-200 shadow-sm'}`}
                >
                    <div>
                        <h3 className="text-lg font-bold text-violet-500">{urgentCount}</h3>
                        <p className="text-xs font-medium text-gray-400">Urgent</p>
                    </div>
                    <div className="w-7 h-7 rounded-lg bg-purple-50 flex items-center justify-center border border-purple-100/50">
                        <Flag size={14} className="text-violet-500" />
                    </div>
                </button>
                <button
                    onClick={() => { setStatusFilter('In progress'); setPriorityFilter('All Priorities'); }}
                    className={`bg-white p-4 rounded-xl border transition-all flex items-center justify-between text-left hover:shadow-sm ${statusFilter === 'In progress' ? 'border-blue-500 ring-1 ring-blue-500' : 'border-gray-200 shadow-sm'}`}
                >
                    <div>
                        <h3 className="text-lg font-bold text-blue-500">{inProgressCount}</h3>
                        <p className="text-xs font-medium text-gray-400">In Progress</p>
                    </div>
                    <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center border border-blue-100/50">
                        <BarChart2 size={14} className="text-blue-500" />
                    </div>
                </button>
                <button
                    onClick={() => { setStatusFilter('Completed'); setPriorityFilter('All Priorities'); }}
                    className={`bg-white p-4 rounded-xl border transition-all flex items-center justify-between text-left hover:shadow-sm ${statusFilter === 'Completed' ? 'border-emerald-500 ring-1 ring-emerald-500' : 'border-gray-200 shadow-sm'}`}
                >
                    <div>
                        <h3 className="text-lg font-bold text-emerald-500">{completedCount}</h3>
                        <p className="text-xs font-medium text-gray-400">Completed</p>
                    </div>
                    <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center border border-emerald-100/50">
                        <CheckCircle2 size={14} className="text-emerald-500" />
                    </div>
                </button>
            </div>

            {/* Filters and Controls */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-3">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-3">
                    <div className="relative">
                        <label className="block text-xs font-semibold text-gray-600 mb-1 pl-0.5">Search Tasks</label>
                        <div className="relative flex items-center">
                            <Search size={12} className="absolute left-3 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search by title, case number, or tags..."
                                className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1 pl-0.5">Status</label>
                        <select
                            className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors bg-white font-medium"
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
                        <label className="block text-xs font-semibold text-gray-600 mb-1 pl-0.5">Priority</label>
                        <select
                            className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors bg-white font-medium"
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
                        <label className="block text-xs font-semibold text-gray-600 mb-1 pl-0.5">Module</label>
                        <select
                            className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors bg-white font-medium"
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

                <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3 pt-3 border-t border-gray-100">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                        <span className="text-xs font-semibold text-gray-600">Sort by:</span>
                        <div className="flex flex-wrap gap-1.5">
                            <button
                                onClick={() => setSortBy('Due Date')}
                                className={`px-3 py-1.5 text-xs font-semibold rounded-md flex items-center gap-1.5 transition-colors ${sortBy === 'Due Date' ? 'bg-indigo-600 text-white' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}
                            >
                                <Calendar size={13} /> Due Date
                            </button>
                            <button
                                onClick={() => setSortBy('Priority')}
                                className={`px-3 py-1.5 text-xs font-semibold rounded-md flex items-center gap-1.5 transition-colors ${sortBy === 'Priority' ? 'bg-indigo-600 text-white' : 'bg-transparent text-gray-600 hover:bg-gray-50'}`}
                            >
                                <Flag size={13} /> Priority
                            </button>
                            <button
                                onClick={() => setSortBy('Status')}
                                className={`px-3 py-1.5 text-xs font-semibold rounded-md flex items-center gap-1.5 transition-colors ${sortBy === 'Status' ? 'bg-indigo-600 text-white' : 'bg-transparent text-gray-600 hover:bg-gray-50'}`}
                            >
                                <CheckSquare size={13} /> Status
                            </button>
                            <button
                                onClick={() => setSortBy('Created')}
                                className={`px-3 py-1.5 text-xs font-semibold rounded-md flex items-center gap-1.5 transition-colors ${sortBy === 'Created' ? 'bg-indigo-600 text-white' : 'bg-transparent text-gray-600 hover:bg-gray-50'}`}
                            >
                                <Clock size={13} /> Created
                            </button>
                        </div>
                    </div>
                    <span className="text-xs text-gray-400 font-medium pb-1 xl:pb-0">Showing {filteredTasks?.length || 0} of {tasks?.length || 0} tasks</span>
                </div>
            </div>

            {/* Tasks List */}
            <div className="space-y-4">
                {loadingTasks ? (
                    <p className="text-sm text-gray-400 text-center py-10">Loading tasks…</p>
                ) : filteredTasks.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-10">No tasks found.</p>
                ) : null}
                {(filteredTasks || []).map(task => (
                    <div key={task.id} className={`bg-white rounded-2xl border transition-shadow hover:shadow-md ${task.checked ? 'border-gray-100 opacity-70' : 'border-gray-200 shadow-sm'}`}>
                        <div className="flex flex-col md:flex-row md:items-start justify-between p-4 sm:p-5 gap-4">
                            <div className="flex items-start gap-4 flex-1">
                                <button
                                    onClick={() => toggleTaskCheck(task.id)}
                                    className={`w-5 h-5 mt-1 rounded border flex items-center justify-center transition-colors shrink-0 ${task.checked ? 'bg-blue-400 border-blue-400' : 'bg-gray-200/50 border-gray-300 hover:bg-gray-200'}`}
                                >
                                    {task.checked && <CheckSquare size={14} className="text-white" />}
                                </button>

                                <div className="flex-1">
                                    <h3 className={`text-sm font-semibold mb-1 ${task.checked ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
                                        {task.title}
                                    </h3>
                                    <p className={`text-sm mb-3 ${task.checked ? 'text-gray-400' : 'text-gray-500'}`}>
                                        {task.description}
                                    </p>

                                    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                                        {/* Priority Badge */}
                                        <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border ${task.priority === 'Urgent' ? 'bg-red-50 text-red-600 border-red-100' :
                                            task.priority === 'High' ? 'bg-orange-50 text-orange-600 border-orange-100' :
                                                task.priority === 'Medium' ? 'bg-yellow-50 text-yellow-600 border-yellow-100' :
                                                    'bg-emerald-50 text-emerald-600 border-emerald-100'
                                            } ${task.checked ? 'opacity-50' : ''}`}>
                                            <Flag size={10} className={task.priority === 'Urgent' ? 'text-red-500' : task.priority === 'High' ? 'text-orange-500' : task.priority === 'Medium' ? 'text-yellow-500' : 'text-emerald-500'} />
                                            {task.priority}
                                        </span>

                                        {/* Status Badge */}
                                        <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border ${task.status === 'Completed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                            task.status === 'Overdue' ? 'bg-red-50 text-red-600 border-red-100' :
                                                task.status === 'In progress' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                                                    'bg-gray-50 text-gray-700 border-gray-200'
                                            } ${task.checked && task.status !== 'Completed' ? 'opacity-50' : ''}`}>
                                            {task.status === 'Completed' ? <CheckCircle2 size={10} /> : <Clock size={10} />}
                                            {task.status}
                                        </span>

                                        {/* Due Date */}
                                        <div className={`flex items-center gap-1.5 text-xs font-semibold ${task.dueDate.includes('Overdue') ? 'text-red-500' :
                                            task.dueDate === 'Today' ? 'text-orange-500' :
                                                task.dueDate === 'Tomorrow' ? 'text-amber-500' :
                                                    'text-gray-500'
                                            }`}>
                                            <Calendar size={13} className="text-gray-400" />
                                            {task.dueDate}
                                        </div>

                                        {/* Module Badge */}
                                        <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500 bg-gray-50 px-2 py-1 rounded">
                                            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
                                            {task.module}
                                        </div>
                                    </div>

                                    {/* Action Buttons Row */}
                                    {(!task.checked && (task.hasStartButton || task.hasMoveAndMarkCompleteButtons)) && (
                                        <div className="mt-4 pt-4 border-t border-gray-50 flex flex-wrap items-center gap-2 sm:gap-3">
                                            {task.hasStartButton && (
                                                <button
                                                    onClick={() => {
                                                        taskService.updateTask(task.id, { status: 'IN_PROGRESS' }).then(res => {
                                                            if (res.success) {
                                                                setTasks(prev => prev.map(t => t.id === task.id ? normalizeTask(res.data) : t));
                                                            }
                                                        });
                                                    }}
                                                    className="px-4 py-1.5 rounded-lg border border-indigo-200 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 transition-colors shadow-sm"
                                                >
                                                    Start Task
                                                </button>
                                            )}
                                            {task.hasMoveAndMarkCompleteButtons && (
                                                <>
                                                    <button
                                                        onClick={() => {
                                                            taskService.updateTask(task.id, { status: 'PENDING' }).then(res => {
                                                                if (res.success) {
                                                                    setTasks(prev => prev.map(t => t.id === task.id ? normalizeTask(res.data) : t));
                                                                }
                                                            });
                                                        }}
                                                        className="px-4 py-1.5 rounded-lg border border-gray-200 text-xs font-semibold text-gray-700 bg-white hover:bg-gray-50 transition-colors shadow-sm"
                                                    >
                                                        Move to Pending
                                                    </button>
                                                    <button
                                                        onClick={() => toggleTaskCheck(task.id)}
                                                        className="px-4 py-1.5 rounded-lg text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-sm flex items-center gap-1.5"
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
                                            to={`/admin/case-details/${task.caseNumber}`}
                                            className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors mr-1"
                                        >
                                            <ExternalLink size={13} /> View Case
                                        </Link>
                                    )}
                                    <button
                                        onClick={() => handleEditTask(task)}
                                        className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-50 rounded border border-gray-200 transition-colors"
                                    >
                                        <Edit2 size={14} />
                                    </button>
                                    <button
                                        onClick={() => handleDeleteTask(task.id)}
                                        className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded border border-red-100 transition-colors"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                                <div className="flex items-center gap-1.5 sm:mt-auto">
                                    {(task?.tags || []).map(tag => (
                                        <span key={tag} className={`px-2 py-0.5 rounded-full text-xs font-medium border ${task.checked ? 'bg-gray-50 text-gray-400 border-gray-100' : 'bg-gray-50 text-gray-500 border-gray-200'}`}>
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* New Task Modal Widget Overlay */}
            {isNewTaskModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl w-full max-w-[460px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        {/* Modal Header */}
                        <div className="px-5 py-3 flex items-center justify-between border-b border-gray-100">
                            <h2 className="text-sm font-semibold text-gray-900">Create New Task</h2>
                            <button
                                onClick={() => setIsNewTaskModalOpen(false)}
                                className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
                            >
                                <X size={15} />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <form onSubmit={handleCreateTask}>
                            <div className="p-4 space-y-2.5">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1">Task Title</label>
                                    <input
                                        type="text"
                                        required
                                        value={newTask.title}
                                        onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                                        placeholder="Enter task title..."
                                        className="w-full px-4 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1">Description</label>
                                    <textarea
                                        rows="2"
                                        value={newTask.description}
                                        onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                                        placeholder="Enter task description..."
                                        className="w-full px-4 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors resize-none"
                                    ></textarea>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-700 mb-1">Priority</label>
                                        <select
                                            value={newTask.priority}
                                            onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                                            className="w-full px-4 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors bg-white font-medium shadow-sm"
                                        >
                                            <option>Low</option>
                                            <option>Medium</option>
                                            <option>High</option>
                                            <option>Urgent</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-700 mb-1">Due Date</label>
                                        <input
                                            type="date"
                                            name="dueDate"
                                            value={newTask.dueDate}
                                            onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                                            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors font-medium text-gray-700 shadow-sm bg-white"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1">Module</label>
                                    <select
                                        value={newTask.module}
                                        onChange={(e) => setNewTask({ ...newTask, module: e.target.value })}
                                        className="w-full px-4 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors bg-white font-medium text-gray-700 shadow-sm"
                                    >
                                        <option>Brickbanq</option>
                                        <option>Accounting</option>
                                        <option>CRM</option>
                                        <option>Compliance</option>
                                    </select>
                                </div>
                            </div>

                            {/* Modal Footer */}
                            <div className="px-5 py-3 bg-gray-50 flex items-center justify-end gap-3 border-t border-gray-100">
                                <button
                                    type="button"
                                    onClick={() => setIsNewTaskModalOpen(false)}
                                    className="px-4 py-1.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-1.5 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-500/20 flex items-center gap-2"
                                >
                                    <Plus size={15} /> Create Task
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Task Modal */}
            {isEditModalOpen && editingTask && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl w-full max-w-[460px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        {/* Modal Header */}
                        <div className="px-5 py-3 flex items-center justify-between border-b border-gray-100">
                            <h2 className="text-sm font-semibold text-gray-900">Edit Task</h2>
                            <button
                                onClick={() => setIsEditModalOpen(false)}
                                className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
                            >
                                <X size={15} />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <form onSubmit={handleUpdateTask}>
                            <div className="p-4 space-y-2.5">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1">Task Title</label>
                                    <input
                                        type="text"
                                        value={editingTask.title}
                                        onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })}
                                        className="w-full px-4 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1">Description</label>
                                    <textarea
                                        rows="2"
                                        value={editingTask.description}
                                        onChange={(e) => setEditingTask({ ...editingTask, description: e.target.value })}
                                        className="w-full px-4 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors resize-none"
                                    ></textarea>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-700 mb-1">Priority</label>
                                        <select
                                            value={editingTask.priority}
                                            onChange={(e) => setEditingTask({ ...editingTask, priority: e.target.value })}
                                            className="w-full px-4 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors bg-white font-medium"
                                        >
                                            <option>Low</option>
                                            <option>Medium</option>
                                            <option>High</option>
                                            <option>Urgent</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-700 mb-1">Due Date</label>
                                        <input
                                            type="date"
                                            name="dueDate"
                                            value={editingTask.dueDateObj ? editingTask.dueDateObj.toISOString().split('T')[0] : ''}
                                            onChange={(e) => setEditingTask({ ...editingTask, dueDateObj: new Date(e.target.value), dueDate: e.target.value })}
                                            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors font-medium text-gray-700 bg-white"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-700 mb-1">Status</label>
                                        <select
                                            value={editingTask.status}
                                            onChange={(e) => setEditingTask({ ...editingTask, status: e.target.value })}
                                            className="w-full px-4 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors bg-white font-medium"
                                        >
                                            <option>Pending</option>
                                            <option>In progress</option>
                                            <option>Overdue</option>
                                            <option>Completed</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-700 mb-1">Module</label>
                                        <select
                                            value={editingTask.module}
                                            onChange={(e) => setEditingTask({ ...editingTask, module: e.target.value })}
                                            className="w-full px-4 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors bg-white font-medium text-gray-700"
                                        >
                                            <option>Accounting</option>
                                            <option>Brickbanq</option>
                                            <option>Crm</option>
                                            <option>Compliance</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Modal Footer */}
                            <div className="px-5 py-3 bg-gray-50 flex items-center justify-end gap-3 border-t border-gray-100">
                                <button
                                    type="button"
                                    onClick={() => setIsEditModalOpen(false)}
                                    className="px-4 py-1.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-1.5 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-500/20 flex items-center gap-2"
                                >
                                    <Edit2 size={15} /> Save Changes
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
