import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
    CheckSquare, AlertCircle, Clock, Flag, BarChart2, CheckCircle2,
    Search, Calendar, ArrowUpSquare, Plus, Edit2, Trash2, ExternalLink, X
} from "lucide-react";
import GlobalDatePicker from '../../components/common/GlobalDatePicker';
import { taskService } from '../../api/dataService';

export default function InvestorTaskCenter() {
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
    const [stats, setStats] = useState({
        activeTasks: 0,
        overdue: 0,
        dueToday: 0,
        urgent: 0,
        inProgress: 0,
        completed: 0
    });

    const mapTaskFromBackend = useCallback((task) => {
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

    const fetchTasks = useCallback(async (isSilent = false) => {
        if (!isSilent) setIsLoading(true);
        try {
            const [tasksRes, statsRes] = await Promise.all([
                taskService.getTasks(),
                taskService.getSummaryStats()
            ]);

            if (tasksRes.success) {
                setTasks(tasksRes.data.map(mapTaskFromBackend));
            }
            if (statsRes.success) {
                setStats({
                    activeTasks: statsRes.data.activeTasks || 0,
                    overdue: statsRes.data.overdue || 0,
                    dueToday: statsRes.data.dueToday || 0,
                    urgent: statsRes.data.urgent || 0,
                    inProgress: statsRes.data.inProgress || 0,
                    completed: statsRes.data.completed || 0
                });
            }
        } catch (error) {
            console.error('Failed to fetch tasks:', error);
        } finally {
            if (!isSilent) setIsLoading(false);
        }
    }, [mapTaskFromBackend]);

    useEffect(() => {
        fetchTasks();
    }, [fetchTasks]);

    // Stats calculations from fetched stats
    const activeTasksCount = stats.activeTasks;
    const overdueCount = stats.overdue;
    const dueTodayCount = stats.dueToday;
    const urgentCount = stats.urgent;
    const inProgressCount = stats.inProgress;
    const completedCount = stats.completed;

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

    const toggleTaskCheck = async (taskId) => {
        const task = tasks.find(t => t.id === taskId);
        if (!task) return;

        const newChecked = !task.checked;
        const newStatus = newChecked ? 'COMPLETED' : 'PENDING';

        // Optimistic Update
        setTasks(prev => prev.map(t =>
            t.id === taskId ? {
                ...t,
                checked: newChecked,
                status: newChecked ? 'Completed' : 'Pending',
                hasStartButton: !newChecked,
                hasMoveAndMarkCompleteButtons: false
            } : t
        ));

        const res = await taskService.updateTask(taskId, { status: newStatus });
        if (res.success) {
            fetchTasks(true); // silent refresh
        } else {
            fetchTasks(); // full refresh to recover state
        }
    };

    const handleEditTask = (task) => {
        setEditingTask(task);
        setIsEditModalOpen(true);
    };

    const handleDeleteTask = async (id) => {
        if (window.confirm('Are you sure you want to delete this task?')) {
            // Optimistic Update
            setTasks(prev => prev.filter(t => t.id !== id));

            const res = await taskService.deleteTask(id);
            if (res.success) {
                fetchTasks(true); // silent refresh
            } else {
                fetchTasks(); // full refresh to recover state
            }
        }
    };

    const handleUpdateTask = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                title: editingTask.title,
                description: editingTask.description,
                status: editingTask.status.toUpperCase().replace(' ', '_'),
                priority: editingTask.priority.toUpperCase(),
                module: editingTask.module,
                tags: editingTask.tags || []
            };

            if (editingTask.dueDateObj) {
                payload.due_date = editingTask.dueDateObj.toISOString();
            }

            const res = await taskService.updateTask(editingTask.id, payload);
            if (res.success) {
                setIsEditModalOpen(false);
                setEditingTask(null);
                fetchTasks();
            }
        } catch (err) {
            console.error('Update error:', err);
        }
    };

    const handleCreateTask = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                title: newTask.title,
                description: newTask.description || "",
                status: "PENDING",
                priority: (newTask.priority || "MEDIUM").toUpperCase(),
                module: newTask.module || "Brickbanq",
                category: "General",
                tags: newTask.tags || []
            };

            if (newTask.dueDate) {
                const dateObj = new Date(newTask.dueDate);
                if (!isNaN(dateObj.getTime())) {
                    payload.due_date = dateObj.toISOString();
                }
            }

            const res = await taskService.createTask(payload);
            if (res.success) {
                setIsNewTaskModalOpen(false);
                setNewTask({
                    title: "",
                    description: "",
                    priority: "Medium",
                    dueDate: "",
                    module: "Brickbanq",
                    category: "General",
                    tags: []
                });
                fetchTasks();
            }
        } catch (err) {
            console.error('Create error:', err);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-12">

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-[28px] font-extrabold text-slate-900 mb-1">Task Center</h1>
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
                        <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-0.5 sm:mb-1">{activeTasksCount}</h3>
                        <p className="text-xs sm:text-xs font-semibold text-gray-500">Active Tasks</p>
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
                        <h3 className="text-xl sm:text-2xl font-bold text-red-500 mb-0.5 sm:mb-1">{overdueCount}</h3>
                        <p className="text-xs sm:text-xs font-semibold text-gray-500">Overdue</p>
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
                        <h3 className="text-xl sm:text-2xl font-bold text-orange-500 mb-0.5 sm:mb-1">{dueTodayCount}</h3>
                        <p className="text-xs sm:text-xs font-semibold text-gray-500">Due Today</p>
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
                        <h3 className="text-xl sm:text-2xl font-bold text-violet-500 mb-0.5 sm:mb-1">{urgentCount}</h3>
                        <p className="text-xs sm:text-xs font-semibold text-gray-500">Urgent</p>
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
                        <h3 className="text-xl sm:text-2xl font-bold text-blue-500 mb-0.5 sm:mb-1">{inProgressCount}</h3>
                        <p className="text-xs sm:text-xs font-semibold text-gray-500">In Progress</p>
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
                        <h3 className="text-xl sm:text-2xl font-bold text-emerald-500 mb-0.5 sm:mb-1">{completedCount}</h3>
                        <p className="text-xs sm:text-xs font-semibold text-gray-500">Completed</p>
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
                                className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-blue-700 focus:ring-1 focus:ring-blue-700 transition-colors"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-[11px] font-bold text-gray-900 mb-1.5 pl-1">Status</label>
                        <select
                            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-blue-700 focus:ring-1 focus:ring-blue-700 transition-colors bg-white font-medium"
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
                            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-blue-700 focus:ring-1 focus:ring-blue-700 transition-colors bg-white font-medium"
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
                            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-blue-700 focus:ring-1 focus:ring-blue-700 transition-colors bg-white font-medium"
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
                        <span className="text-xs font-bold text-gray-700">Sort by:</span>
                        <div className="flex flex-wrap gap-1.5">
                            <button
                                onClick={() => setSortBy('Due Date')}
                                className={`px-3 py-1.5 text-xs font-bold rounded-md flex items-center gap-1.5 transition-colors ${sortBy === 'Due Date' ? 'bg-indigo-800 text-white' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}
                            >
                                <Calendar size={13} /> Due Date
                            </button>
                            <button
                                onClick={() => setSortBy('Priority')}
                                className={`px-3 py-1.5 text-xs font-bold rounded-md flex items-center gap-1.5 transition-colors ${sortBy === 'Priority' ? 'bg-indigo-800 text-white' : 'bg-transparent text-gray-600 hover:bg-gray-50'}`}
                            >
                                <Flag size={13} /> Priority
                            </button>
                            <button
                                onClick={() => setSortBy('Status')}
                                className={`px-3 py-1.5 text-xs font-bold rounded-md flex items-center gap-1.5 transition-colors ${sortBy === 'Status' ? 'bg-indigo-800 text-white' : 'bg-transparent text-gray-600 hover:bg-gray-50'}`}
                            >
                                <CheckSquare size={13} /> Status
                            </button>
                            <button
                                onClick={() => setSortBy('Created')}
                                className={`px-3 py-1.5 text-xs font-bold rounded-md flex items-center gap-1.5 transition-colors ${sortBy === 'Created' ? 'bg-indigo-800 text-white' : 'bg-transparent text-gray-600 hover:bg-gray-50'}`}
                            >
                                <Clock size={13} /> Created
                            </button>
                        </div>
                    </div>
                    <span className="text-xs text-gray-500 font-medium pb-1 xl:pb-0">Showing {filteredTasks?.length || 0} of {tasks?.length || 0} tasks</span>
                </div>
            </div>

            {/* Tasks List */}
            <div className="space-y-4">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-dotted border-gray-300">
                        <CheckSquare className="w-10 h-10 text-indigo-800 animate-pulse mb-4" />
                        <p className="text-gray-500 font-medium">Loading your tasks...</p>
                    </div>
                ) : filteredTasks.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-dotted border-gray-300">
                        <CheckSquare className="w-12 h-12 text-gray-200 mb-4" />
                        <p className="text-gray-500 font-medium">No tasks found matching your filters</p>
                        <button
                            onClick={() => { setStatusFilter('All Status'); setPriorityFilter('All Priorities'); setModuleFilter('All Modules'); setSearchQuery(''); }}
                            className="mt-4 text-indigo-800 font-bold text-sm hover:underline"
                        >
                            Clear all filters
                        </button>
                    </div>
                ) : (
                    filteredTasks.map(task => (
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
                                        <div className="flex items-center gap-2 flex-wrap mb-1">
                                            <h3 className={`text-base sm:text-base font-bold tracking-tight ${task.checked ? 'text-gray-400 line-through' : 'text-slate-800'}`}>
                                                {task.title}
                                            </h3>
                                            {task.id && (
                                                <span className="text-[10px] font-mono text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded shrink-0">
                                                    #{task.id.slice(0, 8)}
                                                </span>
                                            )}
                                        </div>
                                        <p className={`text-xs sm:text-sm mb-3 ${task.checked ? 'text-gray-400' : 'text-gray-500'}`}>
                                            {task.description}
                                        </p>

                                        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                                            {/* Priority Badge */}
                                            <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs sm:text-[11px] font-extrabold border ${task.priority === 'Urgent' ? 'bg-red-50 text-red-600 border-red-100' :
                                                task.priority === 'High' ? 'bg-orange-50 text-orange-600 border-orange-100' :
                                                    task.priority === 'Medium' ? 'bg-yellow-50 text-yellow-600 border-yellow-100' :
                                                        'bg-emerald-50 text-emerald-600 border-emerald-100'
                                                } ${task.checked ? 'opacity-50' : ''}`}>
                                                <Flag size={10} className={task.priority === 'Urgent' ? 'text-red-500' : task.priority === 'High' ? 'text-orange-500' : task.priority === 'Medium' ? 'text-yellow-500' : 'text-emerald-500'} />
                                                {task.priority}
                                            </span>

                                            {/* Status Badge */}
                                            <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs sm:text-[11px] font-extrabold border ${task.status === 'Completed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                                task.status === 'Overdue' ? 'bg-red-50 text-red-600 border-red-100' :
                                                    task.status === 'In progress' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                                                        'bg-gray-50 text-gray-700 border-gray-200'
                                                } ${task.checked && task.status !== 'Completed' ? 'opacity-50' : ''}`}>
                                                {task.status === 'Completed' ? <CheckCircle2 size={10} /> : <Clock size={10} />}
                                                {task.status}
                                            </span>

                                            {/* Due Date */}
                                            <div className="relative group">
                                                <GlobalDatePicker
                                                    value={task.dueDateObj}
                                                    onChange={async (e) => {
                                                        const newDate = e.target.value;
                                                        const res = await taskService.updateTask(task.id, { due_date: new Date(newDate).toISOString() });
                                                        if (res.success) fetchTasks();
                                                    }}
                                                    className="!w-auto"
                                                    inputClassName="!h-auto !p-0 !bg-transparent !border-none !shadow-none !text-[11px] !sm:text-xs !font-bold !cursor-pointer hover:!text-blue-600 !w-24 px-1"
                                                />
                                                {task.dueDate && task.dueDate.includes('Overdue') && <span className="absolute -top-1 -right-1 flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span></span>}
                                            </div>

                                            {/* Module Badge */}
                                            <div className="flex items-center gap-1.5 text-[11px] sm:text-xs font-bold text-slate-500 bg-gray-50 px-2 py-1 rounded">
                                                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
                                                {task.module}
                                            </div>
                                        </div>

                                        {/* Action Buttons Row */}
                                        {(!task.checked && (task.hasStartButton || task.hasMoveAndMarkCompleteButtons)) && (
                                            <div className="mt-4 pt-4 border-t border-gray-50 flex flex-wrap items-center gap-2 sm:gap-3">
                                                {task.hasStartButton && (
                                                    <button
                                                        onClick={async () => {
                                                            // Optimistic update
                                                            setTasks(prev => prev.map(t =>
                                                                t.id === task.id ? { ...t, status: 'In progress', hasStartButton: false, hasMoveAndMarkCompleteButtons: true } : t
                                                            ));
                                                            await taskService.updateTask(task.id, { status: 'IN_PROGRESS' });
                                                            fetchTasks(true);
                                                        }}
                                                        className="px-4 py-1.5 rounded-lg border border-gray-200 text-xs font-bold text-gray-700 bg-white hover:bg-gray-50 transition-colors shadow-sm"
                                                    >
                                                        Start Task
                                                    </button>
                                                )}
                                                {task.hasMoveAndMarkCompleteButtons && (
                                                    <>
                                                        <button
                                                            onClick={async () => {
                                                                // Optimistic update
                                                                setTasks(prev => prev.map(t =>
                                                                    t.id === task.id ? { ...t, status: 'Pending', hasStartButton: true, hasMoveAndMarkCompleteButtons: false } : t
                                                                ));
                                                                await taskService.updateTask(task.id, { status: 'PENDING' });
                                                                fetchTasks(true);
                                                            }}
                                                            className="px-4 py-1.5 rounded-lg border border-gray-200 text-xs font-bold text-gray-700 bg-white hover:bg-gray-50 transition-colors shadow-sm"
                                                        >
                                                            Move to Pending
                                                        </button>
                                                        <button
                                                            onClick={() => toggleTaskCheck(task.id)}
                                                            className="px-4 py-1.5 rounded-lg text-xs font-bold text-white bg-indigo-800 hover:bg-indigo-900 transition-colors shadow-sm flex items-center gap-1.5"
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
                                                to={`/investor/case-details/${task.caseNumber}`}
                                                className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-gray-200 text-[11px] sm:text-xs font-bold text-gray-700 hover:bg-gray-50 transition-colors mr-1"
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
                                            <span key={tag} className={`px-2 py-0.5 rounded-full text-[9px] sm:text-xs font-bold border ${task.checked ? 'bg-gray-50 text-gray-400 border-gray-100' : 'bg-gray-50 text-gray-500 border-gray-200'}`}>
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* New Task Modal Widget Overlay */}
            {isNewTaskModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl w-full max-w-[460px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        {/* Modal Header */}
                        <div className="px-5 py-3 flex items-center justify-between border-b border-gray-100">
                            <h2 className="text-base font-bold text-slate-900">Create New Task</h2>
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
                                    <label className="block text-[11px] font-bold text-gray-700 mb-0.5">Task Title</label>
                                    <input
                                        type="text"
                                        required
                                        value={newTask.title}
                                        onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                                        placeholder="Enter task title..."
                                        className="w-full px-4 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-blue-700 focus:ring-1 focus:ring-blue-700 transition-colors"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[11px] font-bold text-gray-700 mb-0.5">Description</label>
                                    <textarea
                                        rows="2"
                                        value={newTask.description}
                                        onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                                        placeholder="Enter task description..."
                                        className="w-full px-4 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-blue-700 focus:ring-1 focus:ring-blue-700 transition-colors resize-none"
                                    ></textarea>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-[11px] font-bold text-gray-700 mb-0.5">Priority</label>
                                        <select
                                            value={newTask.priority}
                                            onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                                            className="w-full px-4 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-blue-700 focus:ring-1 focus:ring-blue-700 transition-colors bg-white font-medium shadow-sm"
                                        >
                                            <option>Low</option>
                                            <option>Medium</option>
                                            <option>High</option>
                                            <option>Urgent</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold text-gray-700 mb-0.5">Due Date</label>
                                        <GlobalDatePicker
                                            value={newTask.dueDate}
                                            onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[11px] font-bold text-gray-700 mb-0.5">Module</label>
                                    <select
                                        value={newTask.module}
                                        onChange={(e) => setNewTask({ ...newTask, module: e.target.value })}
                                        className="w-full px-4 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-blue-700 focus:ring-1 focus:ring-blue-700 transition-colors bg-white font-medium text-gray-700 shadow-sm"
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
                                    className="px-4 py-1.5 text-xs font-bold text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-1.5 text-xs font-bold text-white bg-indigo-800 rounded-lg hover:bg-indigo-900 transition-colors shadow-sm shadow-indigo-500/20 flex items-center gap-2"
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
                            <h2 className="text-base font-bold text-slate-900">Edit Task</h2>
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
                                    <label className="block text-[11px] font-bold text-gray-700 mb-0.5">Task Title</label>
                                    <input
                                        type="text"
                                        value={editingTask.title}
                                        onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })}
                                        className="w-full px-4 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-blue-700 focus:ring-1 focus:ring-blue-700 transition-colors"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[11px] font-bold text-gray-700 mb-0.5">Description</label>
                                    <textarea
                                        rows="2"
                                        value={editingTask.description}
                                        onChange={(e) => setEditingTask({ ...editingTask, description: e.target.value })}
                                        className="w-full px-4 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-blue-700 focus:ring-1 focus:ring-blue-700 transition-colors resize-none"
                                    ></textarea>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-[11px] font-bold text-gray-700 mb-0.5">Priority</label>
                                        <select
                                            value={editingTask.priority}
                                            onChange={(e) => setEditingTask({ ...editingTask, priority: e.target.value })}
                                            className="w-full px-4 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-blue-700 focus:ring-1 focus:ring-blue-700 transition-colors bg-white font-medium"
                                        >
                                            <option>Low</option>
                                            <option>Medium</option>
                                            <option>High</option>
                                            <option>Urgent</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold text-gray-700 mb-0.5">Due Date</label>
                                        <GlobalDatePicker
                                            value={editingTask.dueDateObj.toISOString().split('T')[0]}
                                            onChange={(e) => setEditingTask({ ...editingTask, dueDateObj: new Date(e.target.value), dueDate: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-[11px] font-bold text-gray-700 mb-0.5">Status</label>
                                        <select
                                            value={editingTask.status}
                                            onChange={(e) => setEditingTask({ ...editingTask, status: e.target.value })}
                                            className="w-full px-4 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-blue-700 focus:ring-1 focus:ring-blue-700 transition-colors bg-white font-medium"
                                        >
                                            <option>Pending</option>
                                            <option>In progress</option>
                                            <option>Overdue</option>
                                            <option>Completed</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold text-gray-700 mb-0.5">Module</label>
                                        <select
                                            value={editingTask.module}
                                            onChange={(e) => setEditingTask({ ...editingTask, module: e.target.value })}
                                            className="w-full px-4 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-blue-700 focus:ring-1 focus:ring-blue-700 transition-colors bg-white font-medium text-gray-700"
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
                                    className="px-4 py-1.5 text-xs font-bold text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-1.5 text-xs font-bold text-white bg-indigo-800 rounded-lg hover:bg-indigo-900 transition-colors shadow-sm shadow-indigo-500/20 flex items-center gap-2"
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
