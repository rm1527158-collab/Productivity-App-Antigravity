const express = require('express');
const router = express.Router();
const quotes = require('../data/quotes');

/**
 * GET /quotes/daily
 * Returns a deterministic daily quote based on today's date.
 * Same quote all day, different quote each day.
 */
router.get('/daily', (req, res) => {
  try {
    const today = new Date();
    // Create a simple date-based hash: YYYYMMDD → number
    const dateKey = today.getFullYear() * 10000 + 
                    (today.getMonth() + 1) * 100 + 
                    today.getDate();
    
    const index = dateKey % quotes.length;
    const quote = quotes[index];

    res.json({
      text: quote.text,
      author: quote.author,
      date: today.toISOString().split('T')[0]
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * GET /quotes/random
 * Returns a random quote (for refresh/inspiration button)
 */
router.get('/random', (req, res) => {
  try {
    const index = Math.floor(Math.random() * quotes.length);
    const quote = quotes[index];
    res.json({ text: quote.text, author: quote.author });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
