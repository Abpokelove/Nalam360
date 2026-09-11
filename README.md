# Nalam360

Nalam360 is an AngularJS + Express + MongoDB rural healthcare portal with one consistent green application shell.

## Run

1. Install Node.js.
2. Install dependencies with `npm install`.
3. Set the environment values in `.env`.
4. Start with `npm start`.
5. Open `http://localhost:3000`.

Required values:

```env
PORT=3000
MONGO_URI=mongodb+srv://your-user:your-password@your-cluster.mongodb.net/nalam360
TOKEN_SECRET=replace-with-a-long-random-secret
```

Optional private admin bootstrap:

```env
ADMIN_NAME=Nalam Administrator
ADMIN_MOBILE=9999999999
ADMIN_PASSWORD=use-a-private-password
ADMIN_VILLAGE=Central Office
```

Public registration always creates a patient. The admin account is created only from the private environment values above.

## Architecture

- `shell.html`: shared AngularJS application shell used by every page entry point.
- `app.js`: module, REST factory, authentication service, notification service, controllers, filter, directive, and `ngAnimate` integration.
- `index.css`: single responsive green healthcare design system.
- `server.js`: Express application, Mongoose models, authentication, authorization, and REST API.

## API

- `GET /api/health`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- Doctor CRUD at `/api/doctors`
- Patient-owned appointment CRUD at `/api/appointments`
- Patient-owned reminder CRUD at `/api/reminders`
- `GET /api/admin/summary` for admins

All application endpoints except health, registration, and login require a bearer token. Patients can access their own appointments and reminders. Admins can manage doctors and view platform summary data.

## AngularJS laboratory concepts

The real application demonstrates module setup, expressions, two-way binding, controllers, dependency injection, a `$http` factory, services, built-in directives, a custom `statusPill` directive, custom filters, validated forms, API CRUD, role-based navigation, and `ngAnimate` transitions.

## Security note

Do not commit real MongoDB credentials. Rotate any credential that has previously been exposed and use a local `.env` file ignored by Git.
