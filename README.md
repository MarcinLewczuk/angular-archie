# Angular Login Signup

A full-stack authentication application built with Angular (frontend) and Node.js/Express (backend) with MySQL database.

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 21.0.2.

---

## 🚀 Getting Started

**New to this project?** See [SETUP.md](SETUP.md) for complete setup instructions.

---

## Prerequisites

Ensure you have the following installed:

- **Node.js** (v18 or higher)
- **npm** (v11.2.0 or higher)
- **Docker Desktop** (for local MySQL database)

---

## Dependencies

This project uses:

### Frontend
- **Angular 21** - Modern web framework
- **Tailwind CSS** - Utility-first CSS framework
- **Angular Material** - UI components (Snackbar for notifications)
- **RxJS** - Reactive programming

### Backend
- **Express 5** - Web server framework
- **MySQL2** - Database driver
- **bcrypt** - Password hashing
- **dotenv** - Environment configuration
- **CORS** - Cross-origin resource sharing

### Development
- **TypeScript** - Type-safe JavaScript
- **nodemon** - Auto-restart for backend development
- **Jasmine/Karma** - Testing framework

---

## Troubleshooting

### Database Connection Issues
- **Docker not running?** Start Docker Desktop
- **Container not found?** Run: `docker ps` to verify
- **Wrong credentials?** Check `backend/private/.env` matches default (user/password)
- **Schema not imported?** Re-run the import command from [SETUP.md](SETUP.md)
- **View logs:** `docker logs angular_login_signup_mysql`

### Port Already in Use

#### Port 3000 or 4200 (Application)
- Find process: `netstat -ano | findstr :3000` (Windows) or `lsof -i :3000` (Mac/Linux)
- Kill process or change port in configuration

#### Port 3306 (Database)
- Another MySQL instance may be running
- Solution: Change Docker port to 3307 (see [SETUP.md](SETUP.md#-port-3306-already-in-use)) or stop any other running docker containers.

### Docker Issues
- **Container won't start:** Check Docker Desktop is running
- **Database won't connect:** Wait 10-15 seconds after `docker compose up -d`
- **Restart container:** `docker compose restart`
- **Fresh start (⚠️ deletes data):** `docker compose down -v`

### Frontend Issues

#### Tailwind CSS not working
- Ensure `@tailwindcss/postcss` is installed: `npm install`
- Check `styles.css` has `@import "tailwindcss";`

#### Angular Material issues
- Missing animations? Check `app.config.ts` has `provideAnimationsAsync()`
- Snackbar not showing? Verify `@angular/material` is installed

### Backend Issues

#### "Cannot find module" errors
- Run: `npm install` to install missing dependencies
- Check `backend/src/` files use correct import paths

#### Login returns 500 error
- **Check database:** Is container running? Schema imported?
- **Check .env:** Are credentials correct?
- **View backend logs:** Look for error details in the nodemon terminal

#### "bcrypt" errors on Windows
- May need Visual Studio Build Tools
- Or install: `npm install --global windows-build-tools` (run as admin)

### Dependencies Issues
- **Delete and reinstall:**
  ```bash
  rm -rf node_modules package-lock.json
  npm install
  ```
- **Legacy peer deps:** Some packages may need `npm install --legacy-peer-deps`

---

## Development Commands

### Code Scaffolding
```bash
ng generate component component-name
ng generate service service-name
ng generate --help  # See all options
```

### Building
```bash
ng build  # Production build
```

### Testing
```bash
ng test  # Run unit tests
```

---

## Project Structure

```
Angular-Login-Signup/
├── backend/              # Node.js/Express backend
│   ├── src/
│   │   ├── app.ts       # Main server
│   │   ├── queries.ts   # Database queries
│   │   └── security/    # Password hashing
│   └── private/
│       └── .env         # Environment config (not in git)
├── db/
│   └── schema.sql       # Database schema
├── src/                 # Angular frontend
│   ├── app/
│   │   ├── pages/       # Login, Signup, Home
│   │   ├── services/    # AuthService, SnackbarService
│   │   └── validators/  # Form validation
│   └── styles.css       # Global styles + Tailwind
├── docker-compose.yml   # MySQL container config
├── SETUP.md            # Setup instructions
└── package.json        # Dependencies & scripts
```

---

## Additional Resources

- [Angular Documentation](https://angular.dev)
- [Angular CLI Reference](https://angular.dev/tools/cli)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [Express.js Guide](https://expressjs.com/)
- [Docker Documentation](https://docs.docker.com/)
