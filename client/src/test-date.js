import { startOfWeek, startOfMonth, startOfQuarter, startOfYear } from 'date-fns';

const now = new Date();
console.log("Now:", now.toString());
console.log("Now ISO:", now.toISOString());

const scope = 'monthly';
const start = startOfMonth(now);
console.log("Start of Month:", start.toString());
console.log("Start of Month ISO:", start.toISOString());

const startYear = startOfYear(now);
console.log("Start of Year:", startYear.toString());
console.log("Start of Year ISO:", startYear.toISOString());
