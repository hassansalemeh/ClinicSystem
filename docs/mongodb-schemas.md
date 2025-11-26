MongoDB Schemas — Clinic Appointment System

This document outlines the suggested MongoDB collections and example documents.

1) users
- Stores patients, doctors and admin users.
- Indexes: unique index on `email`, role-based index if needed.

Example document:
{
  _id: ObjectId("64b6f4a3b8f2d9b1a2c3d4e5"),
  name: "Hassan Salemeh",
  email: "hassan@example.com",
  passwordHash: "$2a$12$...", // bcrypt
  role: "DOCTOR", // ADMIN | DOCTOR | PATIENT
  profile: {
    phone: "+96170123456",
    address: "Beirut, Lebanon",
    avatarUrl: "https://..."
  },
  createdAt: ISODate("2025-11-26T08:00:00Z")
}

2) doctors
- Option A: Use `users` collection with role=DOCTOR and store doctor-specific fields inside `profile` or `doctor` subdocument.
- Option B: Separate `doctors` collection referencing `userId`.

Example (embedded in users.profile.doctor):
{
  userId: ObjectId("..."),
  specialty: "General Practitioner",
  bio: "10 years experience",
  availability: [
    { dayOfWeek: "MONDAY", startTime: "09:00", endTime: "12:00" },
    { dayOfWeek: "WEDNESDAY", startTime: "14:00", endTime: "18:00" }
  ],
  createdAt: ISODate(...)
}

3) appointments
- Stores appointment records. Important fields: doctorId, patientId, startTime, endTime, status.
- Indexes: compound index on (doctorId, startTime) to help check overlaps; unique constraint could be used on doctorId+startTime+endTime if slot-size fixed.

Example document:
{
  _id: ObjectId("64b7a1b2c3d4e5f67890abcd"),
  doctorId: ObjectId("64b6f4a3b8f2d9b1a2c3d4e5"),
  patientId: ObjectId("64b8a2c3d4e5f67890ab1cde"),
  startTime: ISODate("2025-11-26T09:00:00Z"),
  endTime: ISODate("2025-11-26T09:20:00Z"),
  status: "PENDING", // PENDING | CONFIRMED | CANCELLED | COMPLETED
  reason: "Follow-up",
  createdAt: ISODate(...),
  updatedAt: ISODate(...)
}

4) availability (optional)
- If doctor schedules are complex, keep a separate collection for recurring availability or exceptions.

Example document:
{
  _id: ObjectId(...),
  doctorId: ObjectId(...),
  type: "RECURRING", // or "EXCEPTION"
  dayOfWeek: "MONDAY",
  startTime: "09:00",
  endTime: "12:00"
}

5) audit_logs (optional)
- Track important actions: user creation, appointment changes, login attempts.

Indexes and Concurrency
- Create compound index on `{ doctorId: 1, startTime: 1 }` for quick conflict checks.
- To prevent double-booking consider:
  - Using a short transaction (MongoDB multi-document transactions) for booking flow.
  - Or enforce a unique index on a normalized slot key if slots are standardized (e.g., doctorId + slotStart).

Seed Data
- Provide a seed script (JS or JSON) with sample doctors, patients, and appointments for frontend dev.

Notes
- Keep PII encryption/handling in mind for production.
- Use TTL indexes for temporary tokens or audit records if needed.
