# 🏢 Company Website – Node.js + Express + MongoDB

This is the official company website built using **Node.js, Express.js, MongoDB, EJS** and several other tools like Nodemailer, Google Sheets API, Multer and Cloudinary. This project is deployed on a VPS and is publicly visible on GitHub.

---

## 🚀 How to Run This Project Locally

### 🛠 Prerequisites

* Node.js (Recommended: LTS version)
* MongoDB connection string (MongoDB Atlas)
* `.env` file containing required credentials (e.g. DB URI, email credentials)

### 📦 Install dependencies

```bash
npm ci
```

> 🔐 Use `npm ci` instead of `npm install` to ensure all dependencies are installed **exactly** as locked in `package-lock.json`.


🛠️ Setting Up a Cloned Repository

bash
git clone <repository-url>
cd <project-folder>
npm ci

### ▶️ Start the app locally

```bash
nodemon server.js
# or
node server.js
```

Visit your site at: [http://localhost:3000](http://localhost:3000)

---

## 🖥️ Local Development - Pushing to GitHub
When adding new packages (always use exact versions):

bash

npm install <package_name> --save-exact 

git add .
git commit -m "chore: added <package_name>@<version>" 
git push origin main

## 📱 VPS Deployment Guide (e.g., Hostinger VPS)

On the server:

```bash
cd ~/company-website
git pull origin main
npm ci (If any new npm package has been installed & locked)
pm2 restart company-website
```

> ✅ `npm ci` avoids pulling unwanted new versions of dependencies. It uses the **exact versions** stored in `package-lock.json`.

---

## 📦 Adding New Packages (IMPORTANT)

> Always use the following command to add new packages:

```bash
npm install <package-name> --save-exact
```

This ensures `package.json` saves:

```json
"axios": "1.6.0"   // instead of "^1.6.0"
```

This prevents automatic updates from breaking your site.

---

## 👥 Future Developers: Please Follow These Rules

| Task                                | Command / Rule                                        |
| ----------------------------------- | ----------------------------------------------------- |
| Install dependencies (local or VPS) | `npm ci`                                              |
| Add a new package                   | `npm install <package-name> --save-exact`             |
| Never use on VPS                    | `npm install` (can fetch risky newer versions)        |
| Deploy on VPS                       | `git pull` → `npm ci` → `pm2 restart company-website` |

---

## ⚠️ Warning About `^` in Versions

If `package.json` has:

```json
"express": "^5.1.0"  ❌ risky
```

It can download newer versions like 5.1.2 or 5.2.0

To prevent this:

* Manually change to:

```json
"express": "5.1.0"  ✅ safe
```

* Then run:

```bash
rm package-lock.json
npm install
```

Now your lock file is updated with safe versions.

---

## 📄 License

This project is proprietary and maintained by the company. Please do not copy or reuse without written permission.
