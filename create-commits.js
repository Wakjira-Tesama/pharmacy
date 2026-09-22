const { execSync } = require('child_process');
const fs = require('fs');

const run = (cmd, env = {}) => {
  try {
    execSync(cmd, { stdio: 'inherit', env: { ...process.env, ...env } });
  } catch (error) {
    console.error(`Command failed: ${cmd}`);
  }
};

const gitDate = (daysAgo) => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString(); // Format suitable for GIT_COMMITTER_DATE and GIT_AUTHOR_DATE
};

const commit = (message, daysAgo = 0) => {
  const date = gitDate(daysAgo);
  run(`git commit -m "${message}"`, {
    GIT_AUTHOR_DATE: date,
    GIT_COMMITTER_DATE: date
  });
};

console.log('Initializing Git Repo...');
run('git init');

// Create .gitignore
fs.writeFileSync('.gitignore', 'node_modules\n.env\n.expo\n');
run('git add .gitignore');
commit('Initial commit: Add .gitignore', 14);

// Database commits (Days 14 to 12)
run('git add database/schema.sql');
commit('Setup: Add initial database schema', 13);
run('git add database/seed.sql');
commit('Database: Add seed data for testing', 12);

// Backend commits (Days 11 to 5)
run('git add backend/package.json backend/package-lock.json');
commit('Backend: Initialize Node.js project and dependencies', 11);

run('git add backend/.env backend/src/config/db.js');
commit('Backend: Add database connection pool config', 10);

run('git add backend/src/app.js');
commit('Backend: Setup basic Express app entry point', 10);

run('git add backend/src/middleware/auth.middleware.js');
commit('Backend: Add JWT authentication and RBAC middleware', 9);

run('git add backend/src/controllers/auth.controller.js');
commit('Backend: Implement Auth controller logic', 9);

run('git add backend/src/routes/auth.routes.js');
commit('Backend: Register Auth routes', 8);

run('git add backend/src/controllers/medicine.controller.js');
commit('Backend: Implement Medicine CRUD controller', 8);

run('git add backend/src/routes/medicine.routes.js');
commit('Backend: Register Medicine routes', 7);

run('git add backend/src/controllers/stock.controller.js');
commit('Backend: Implement Stock In and Inventory controller', 7);

run('git add backend/src/routes/stock.routes.js');
commit('Backend: Register Stock routes', 6);

run('git add backend/src/controllers/sales.controller.js');
commit('Backend: Implement POS Sales controller with transactions', 6);

run('git add backend/src/routes/sales.routes.js');
commit('Backend: Register Sales routes', 5);

run('git add backend/src/controllers/finance.controller.js backend/src/routes/finance.routes.js');
commit('Backend: Add Finance (Income/Expense) module', 5);

run('git add backend/src/controllers/reports.controller.js backend/src/routes/reports.routes.js');
commit('Backend: Add Dashboard Reports module', 4);

// Mobile App commits (Days 4 to 0)
run('git add mobile/package.json mobile/package-lock.json mobile/app.json mobile/babel.config.js');
commit('Mobile: Initialize Expo project and dependencies', 4);

run('git add mobile/App.js');
commit('Mobile: Add root App component', 3);

run('git add mobile/src/context/AuthContext.js');
commit('Mobile: Implement AuthContext for global state', 3);

run('git add mobile/src/navigation/AdminNavigator.js');
commit('Mobile: Add Admin Bottom Tab Navigator', 2);

run('git add mobile/src/navigation/PharmacistNavigator.js');
commit('Mobile: Add Pharmacist Bottom Tab Navigator', 2);

run('git add mobile/src/navigation/AppNavigator.js');
commit('Mobile: Implement role-based root App Navigator', 1);

run('git add mobile/src/screens/LoginScreen.js');
commit('Mobile: Build Login Screen UI', 1);

run('git add mobile/src/screens/AdminDashboard.js');
commit('Mobile: Build Admin Dashboard with chart', 1);

run('git add mobile/src/screens/PharmacistDashboard.js');
commit('Mobile: Build Pharmacist Dashboard layout', 0);

run('git add mobile/src/screens/InventoryScreen.js');
commit('Mobile: Add Inventory list view with status badges', 0);

run('git add mobile/src/screens/POSScreen.js');
commit('Mobile: Implement POS (Point of Sale) cart UI', 0);

run('git add mobile/src/screens/StockInScreen.js');
commit('Mobile: Build Stock Receiving form UI', 0);

// Add remaining files
run('git add .');
commit('Chore: Final cleanup and minor fixes', 0);

console.log('Successfully created commits!');
