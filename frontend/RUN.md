# How to run the app

## Option 1: From project root (Brickbanq_Dev)
```bash
npm run dev
```
Then open **http://localhost:5173/** in your browser.

## Option 2: From frontend folder
```bash
cd frontend
npm run dev
```
Then open **http://localhost:5173/**.

## Important
- Always use **http://localhost:5173/** (or the URL Vite prints). Do not open `index.html` directly (file://) or the panels will not work.
- **Home:** http://localhost:5173/
- **Borrower:** http://localhost:5173/borrower
- **Lawyer:** http://localhost:5173/lawyer

## Production build
```bash
cd frontend
npm run build
npm run serve
```
Then open **http://localhost:3000/**.
