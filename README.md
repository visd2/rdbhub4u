📌 RDBHUB – Movies/Anime/WebSeries Website

Full-stack Node.js + Express project storing movie categories, details, and admin pages.

📁 Project Structure
RDBHUB/
│
├── Public/
│   ├── admin.html
│   ├── anime.html
│   ├── category.html
│   ├── detail.html
│   ├── index.html
│   ├── movies.html
│   ├── webseries.html
│   ├── script.js
│   └── style.css
│
├── server.js
├── seed.js
├── package.json
└── package-lock.json

🚀 How to Run Locally
npm install
node server.js


Server chalega:

http://localhost:3000

🌐 Deploying on Render

New Web Service → Connect GitHub repo

Set these values:

▶ Environment

Runtime → Node

Root Directory → .

Build Command → npm install

Start Command → node server.js

🔐 Environment Variables (if needed)

Render → Environment → Add:

MONGODB_URI=your_mongo_url
PORT=3000


(agar tum MongoDB use kar rahe ho)

🧹 Gitignore

Included in project:

node_modules/
.env
*.log
.DS_Store