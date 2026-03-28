const fs = require('fs');
let c = fs.readFileSync('src/pages/lender/LenderSubmitNewCase.jsx', 'utf8');

let parts = c.split('</select>');
for (let i = 0; i < parts.length - 1; i++) {
   let idx = parts[i].lastIndexOf('<input required ');
   if (idx !== -1) {
       // but only if there isn't another <select or something
       parts[i] = parts[i].substring(0, idx) + '<select required ' + parts[i].substring(idx + 16);
   }
}
c = parts.join('</select>');

parts = c.split('</textarea>');
for (let i = 0; i < parts.length - 1; i++) {
   let idx = parts[i].lastIndexOf('<input required ');
   if (idx !== -1) {
       parts[i] = parts[i].substring(0, idx) + '<textarea required ' + parts[i].substring(idx + 16);
   }
}
c = parts.join('</textarea>');

fs.writeFileSync('src/pages/lender/LenderSubmitNewCase.jsx', c);
