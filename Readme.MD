# MediBase — Hospital Management Frontend

A static, dependency-free frontend for the FastAPI hospital backend (JWT auth, JSON REST).

## Files

```
index.html          Login / signup
dashboard.html       Overview + today's appointments
departments.html     Departments (list + add)
doctors.html         Doctors (full CRUD)
patients.html        Patients (full CRUD)
rooms.html            Rooms (add/edit — status is backend-managed)
appointments.html    Appointments (book/edit/cancel)
admissions.html       Admissions (admit/edit/discharge)
medicines.html        Medicine inventory (full CRUD)
prescriptions.html    Prescriptions with multi-medicine items (create + view)
bills.html             Billing (create/edit/mark paid)
css/style.css           Shared design system
js/api.js               Auth + fetch wrapper + shared sidebar shell
```

## Running it

1. Start your backend so it's serving at `http://127.0.0.1:8000`.
2. Serve this folder with any static server (recommended over `file://` to avoid CORS quirks):
   ```
   python -m http.server 5500
   ```
3. Visit `http://127.0.0.1:5500/index.html`, create an account, and you're in.

If your backend runs on a different host/port, change the single `API_URL` constant at the top of `js/api.js`.

## How auth works

- `/login` and `/signup` are the only calls made without a token.
- On success, the JWT is stored in `localStorage` and every other page calls `requireAuth()` on load to bounce back to `index.html` if it's missing.
- Every API call goes through `apiFetch()` in `js/api.js`, which attaches `Authorization: Bearer <token>` and clears the token + redirects to login on any `401`.
- "Sign out" just deletes the token client-side, matching the backend's stateless-JWT logout.

## Data entry order

Because of foreign keys, populate things in this order the first time: **Departments → Doctors → Patients → Rooms**, then Appointments / Medicines / Prescriptions / Admissions / Bills. Every dropdown in the app pulls live from the relevant list endpoint, so if a picker looks empty, go add that resource first.

## Notes on backend quirks this UI already handles

- Departments and Rooms have no delete endpoint — those pages only list/add/edit.
- Deleting an appointment doesn't remove it — it sets status to `Cancelled`; the UI labels that action "Cancel."
- Discharging an admission (`status: "Discharged"`) automatically frees the room, so there's a one-click **Discharge** button instead of a separate room update.
- Prescriptions are create/view only (no edit endpoint), and are created with all medicine items in a single request.