life-os/
├── app/
│   ├── globals.css         <-- Your css/style.css content goes here
│   ├── layout.js           <-- Global HTML structure (fonts, metadata)
│   ├── page.js             <-- Login Screen (replaces index.html login div)
│   └── (authenticated)/    <-- Route group for logged-in users
│       ├── layout.js       <-- Sidebar & Header (Visible on all inner pages)
│       ├── dashboard/      <-- Replaces "view-dashboard"
│       │   └── page.js
│       ├── projects/       <-- Replaces "view-projects"
│       │   └── page.js
│       └── finance/        <-- Replaces "view-finance"
│           └── page.js
├── components/             <-- Reusable UI parts
│   ├── Sidebar.js
│   ├── Timer.js            <-- Refactored from utils.js
│   └── TodoList.js
├── lib/
│   ├── firebase.js         <-- Your js/firebase-config.js
│   └── db.js               <-- Your js/db.js (cleaned up)
└── context/
    └── AuthContext.js      <-- Manages user login state globally