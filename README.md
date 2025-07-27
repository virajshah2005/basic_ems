# Employee Management System

A fullstack web application for managing employees, tasks, attendance, and payroll. Built with Node.js (Express, MySQL) for the backend and React (Vite, TypeScript, MUI) for the frontend.

---

## Features

- Employee CRUD management
- Task assignment and tracking
- Attendance tracking
- Payroll management
- Admin authentication and authorization
- Analytics dashboard

---

## Project Structure

```
employee-management-system/
├── backend/   # Express + MySQL REST API
├── frontend/  # React + Vite + TypeScript client
```

---

## Backend Setup (Express + MySQL)

1. **Install dependencies:**
   ```bash
   cd backend
   npm install
   ```
2. **Configure environment:**
   - Copy `config.env` and set your MySQL credentials and JWT secret.
3. **Start the server:**
   ```bash
   npm run dev
   ```
   The backend runs on `http://localhost:5000` by default.

---

## Frontend Setup (React + Vite)

1. **Install dependencies:**
   ```bash
   cd frontend
   npm install
   ```
2. **Start the development server:**
   ```bash
   npm run dev
   ```
   The frontend runs on `http://localhost:5173` by default.

---

## Usage

- Login as admin (`admin`/`admin123` by default)
- Manage employees, assign tasks, track attendance, and process payroll
- View analytics and statistics on the dashboard

---

## Scripts

- **Backend:** `npm run dev` (nodemon), `npm start` (production)
- **Frontend:** `npm run dev`, `npm run build`, `npm run preview`

---

## Contributing

Pull requests are welcome! For major changes, please open an issue first to discuss what you would like to change.

---

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.

---

## Author

[virajshah2005](https://github.com/virajshah2005)
