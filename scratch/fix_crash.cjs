const fs = require('fs');

let content = fs.readFileSync('src/App.jsx', 'utf8');

// Fix 1: val.replace to String(val).replace
const old1 = 'let cleanedVal = val.replace(/\\s+/g, " ").trim(); // Basic cleanup for options';
const new1 = 'let cleanedVal = String(val||"").replace(/\\s+/g, " ").trim(); // Basic cleanup for options';
if (content.includes(old1)) {
    content = content.replace(old1, new1);
    console.log("Fix 1 applied: String(val)");
} else {
    console.log("Fix 1 not found");
}

// Fix 2: normalizeQuizData should set `display` so the question text actually shows
const old2 = `        question: item.q || item.question,
        options: optionsObj,`;
const new2 = `        question: item.q || item.question,
        display: item.q || item.question,
        options: optionsObj,`;
if (content.includes(old2)) {
    content = content.replace(old2, new2);
    console.log("Fix 2 applied: display mapping in normalizeQuizData");
} else {
    console.log("Fix 2 not found");
}

fs.writeFileSync('src/App.jsx', content);
console.log("Done");
