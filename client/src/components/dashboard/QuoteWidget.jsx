import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkle, RefreshCw } from 'lucide-react';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL || '/api';

const QuoteWidget = () => {
    const [quote, setQuote] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshKey, setRefreshKey] = useState(0);

    const fetchQuote = async (random = false) => {
        try {
            setLoading(true);
            const endpoint = random ? '/quotes/random' : '/quotes/daily';
            const { data } = await axios.get(`${API}${endpoint}`);
            setQuote(data);
        } catch (err) {
            // Fallback quote
            setQuote({
                text: "The impediment to action advances action. What stands in the way becomes the way.",
                author: "Marcus Aurelius"
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchQuote();
    }, []);

    const handleRefresh = () => {
        setRefreshKey(prev => prev + 1);
        fetchQuote(true);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="relative overflow-hidden rounded-xl bg-gradient-to-br from-forest-800 to-forest-950 p-5 text-cream-50 shadow-lg"
        >
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-32 h-32 opacity-10">
                <svg viewBox="0 0 100 100" className="w-full h-full">
                    <circle cx="80" cy="20" r="40" fill="currentColor" />
                    <circle cx="90" cy="50" r="25" fill="currentColor" />
                </svg>
            </div>

            <div className="relative z-10">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <Sparkle size={14} className="text-sage-300" />
                        <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-sage-300">
                            Daily Wisdom
                        </span>
                    </div>
                    <button
                        onClick={handleRefresh}
                        className="p-1 rounded-md hover:bg-white/10 transition-colors"
                        title="Get a new quote"
                    >
                        <RefreshCw size={12} className="text-sage-300" />
                    </button>
                </div>

                <AnimatePresence mode="wait">
                    {quote && (
                        <motion.div
                            key={refreshKey}
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -5 }}
                            transition={{ duration: 0.3 }}
                        >
                            <p className="text-sm leading-relaxed font-serif italic mb-3 text-cream-100">
                                "{quote.text}"
                            </p>
                            <p className="text-[11px] font-display tracking-wide text-sage-300">
                                — {quote.author}
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
};

export default QuoteWidget;
