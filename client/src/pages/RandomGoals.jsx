import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, CheckCircle, Circle, Shuffle, Sparkles } from 'lucide-react';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL || '/api';

const RandomGoals = () => {
    const [goals, setGoals] = useState([]);
    const [newGoal, setNewGoal] = useState('');
    const [loading, setLoading] = useState(true);

    const fetchGoals = useCallback(async () => {
        try {
            const { data } = await axios.get(`${API}/tasks`, {
                params: { scope: 'random' }
            });
            setGoals(data);
        } catch (err) {
            console.error('Failed to fetch random goals:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchGoals();
    }, [fetchGoals]);

    const addGoal = async (e) => {
        e.preventDefault();
        if (!newGoal.trim()) return;

        try {
            await axios.post(`${API}/tasks`, {
                title: newGoal.trim(),
                scope: 'random',
                section: 'topPriority'
            });
            setNewGoal('');
            fetchGoals();
        } catch (err) {
            console.error('Failed to add goal:', err);
        }
    };

    const toggleGoal = async (goal) => {
        try {
            await axios.put(`${API}/tasks/${goal._id}`, {
                completed: !goal.completed,
                __v: goal.__v
            });
            fetchGoals();
        } catch (err) {
            console.error('Failed to toggle goal:', err);
        }
    };

    const deleteGoal = async (id) => {
        try {
            await axios.delete(`${API}/tasks/${id}`);
            fetchGoals();
        } catch (err) {
            console.error('Failed to delete goal:', err);
        }
    };

    const activeGoals = goals.filter(g => !g.completed);
    const completedGoals = goals.filter(g => g.completed);

    return (
        <div className="p-6 max-w-4xl mx-auto">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8"
            >
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-forest-800 to-sage-500 flex items-center justify-center">
                        <Shuffle size={20} className="text-cream-50" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-display font-bold text-foreground">
                            Random Goals
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Untimed aspirations — no deadlines, no pressure
                        </p>
                    </div>
                </div>
            </motion.div>

            {/* Add Goal Form */}
            <motion.form
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                onSubmit={addGoal}
                className="mb-8 flex gap-3"
            >
                <input
                    type="text"
                    value={newGoal}
                    onChange={(e) => setNewGoal(e.target.value)}
                    placeholder="Add a new aspiration..."
                    className="flex-1 px-4 py-3 rounded-xl bg-card border border-border focus:outline-none focus:ring-2 focus:ring-primary/30 text-foreground placeholder:text-muted-foreground transition-all"
                />
                <button
                    type="submit"
                    disabled={!newGoal.trim()}
                    className="px-5 py-3 rounded-xl bg-primary text-primary-foreground font-medium hover:opacity-90 disabled:opacity-40 transition-all flex items-center gap-2"
                >
                    <Plus size={18} />
                    <span className="hidden sm:inline">Add</span>
                </button>
            </motion.form>

            {/* Active Goals */}
            <div className="mb-8">
                <h2 className="text-xs font-bold tracking-widest uppercase text-muted-foreground mb-4 flex items-center gap-2">
                    <Sparkles size={12} />
                    Active Goals ({activeGoals.length})
                </h2>
                <AnimatePresence>
                    {activeGoals.length === 0 && !loading && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-center py-12 text-muted-foreground"
                        >
                            <Shuffle size={48} className="mx-auto mb-4 opacity-30" />
                            <p className="text-sm">No random goals yet. Add your first aspiration above!</p>
                        </motion.div>
                    )}
                    {activeGoals.map((goal, index) => (
                        <motion.div
                            key={goal._id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 10 }}
                            transition={{ delay: index * 0.05 }}
                            className="group flex items-center gap-3 p-3.5 mb-2 rounded-xl bg-card border border-border hover:border-primary/30 hover:shadow-sm transition-all"
                        >
                            <button
                                onClick={() => toggleGoal(goal)}
                                className="text-muted-foreground hover:text-primary transition-colors"
                            >
                                <Circle size={20} />
                            </button>
                            <span className="flex-1 text-sm text-foreground">{goal.title}</span>
                            <button
                                onClick={() => deleteGoal(goal._id)}
                                className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all"
                            >
                                <Trash2 size={16} />
                            </button>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {/* Completed Goals */}
            {completedGoals.length > 0 && (
                <div>
                    <h2 className="text-xs font-bold tracking-widest uppercase text-muted-foreground mb-4 flex items-center gap-2">
                        <CheckCircle size={12} />
                        Completed ({completedGoals.length})
                    </h2>
                    {completedGoals.map((goal, index) => (
                        <motion.div
                            key={goal._id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: index * 0.03 }}
                            className="group flex items-center gap-3 p-3.5 mb-2 rounded-xl bg-muted/30 border border-transparent"
                        >
                            <button
                                onClick={() => toggleGoal(goal)}
                                className="text-primary transition-colors"
                            >
                                <CheckCircle size={20} />
                            </button>
                            <span className="flex-1 text-sm text-muted-foreground line-through">{goal.title}</span>
                            <button
                                onClick={() => deleteGoal(goal._id)}
                                className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all"
                            >
                                <Trash2 size={16} />
                            </button>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default RandomGoals;
