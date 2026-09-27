import os
from contextlib import asynccontextmanager
from datetime import datetime, timedelta
from typing import Optional

import aiosqlite
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from database import init_db, DB_PATH
from models import (
    PatientCreate, PatientUpdate,
    AppointmentCreate, AppointmentStatusUpdate,
    EmergencyCaseCreate, EmergencyCaseStatusUpdate,
    AmbulanceRequest, AmbulanceStatusUpdate,
    BloodRequestCreate, BloodRequestStatusUpdate,
    FacilityContactRequest, FacilityStatusUpdate,
    CaseEventCreate,
)


# ─── App Lifecycle ─────────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield


app = FastAPI(title="CareLink API", version="1.0.0", lifespan=lifespan)

# ─── CORS ─────────────────────────────────────────────────────────────────────

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── Helper ───────────────────────────────────────────────────────────────────

async def get_db():
    if not os.path.exists(DB_PATH):
        await init_db()
    db = await aiosqlite.connect(DB_PATH)
    db.row_factory = aiosqlite.Row
    await db.execute("PRAGMA foreign_keys = ON")
    return db


def row_to_dict(row):
    return dict(row) if row else None


def rows_to_list(rows):
    return [dict(r) for r in rows]


def now_iso():
    return datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%S")


async def add_case_event(db, case_id: int, event_type: str, description: str, actor: str = "System"):
    await db.execute(
        "INSERT INTO case_events (case_id, event_type, description, actor, created_at) VALUES (?,?,?,?,?)",
        (case_id, event_type, description, actor, now_iso())
    )


# ─── Dashboard ────────────────────────────────────────────────────────────────

@app.get("/api/dashboard")
async def get_dashboard():
    db = await get_db()
    try:
        today = datetime.utcnow().strftime("%Y-%m-%d")

        c = await db.execute("SELECT COUNT(*) FROM patients")
        total_patients = (await c.fetchone())[0]

        c = await db.execute("SELECT COUNT(*) FROM appointments WHERE date = ?", (today,))
        today_appointments = (await c.fetchone())[0]

        c = await db.execute("SELECT COUNT(*) FROM emergency_cases WHERE status NOT IN ('CLOSED','RECEIVED')")
        active_emergencies = (await c.fetchone())[0]

        c = await db.execute("SELECT COUNT(*) FROM ambulance_requests WHERE status NOT IN ('TRANSFERRED','CANCELLED')")
        ambulance_requests = (await c.fetchone())[0]

        c = await db.execute("SELECT COUNT(*) FROM blood_requests WHERE status NOT IN ('FULFILLED','CANCELLED')")
        blood_requests_count = (await c.fetchone())[0]

        # Active emergencies with patient details
        c = await db.execute("""
            SELECT ec.*, p.full_name, p.blood_group,
                   ar.status as amb_status, ar.provider as amb_provider,
                   br.status as blood_status, br.blood_group as blood_grp
            FROM emergency_cases ec
            JOIN patients p ON p.id = ec.patient_id
            LEFT JOIN ambulance_requests ar ON ar.case_id = ec.id AND ar.id = (
                SELECT id FROM ambulance_requests WHERE case_id = ec.id ORDER BY id DESC LIMIT 1
            )
            LEFT JOIN blood_requests br ON br.case_id = ec.id AND br.id = (
                SELECT id FROM blood_requests WHERE case_id = ec.id ORDER BY id DESC LIMIT 1
            )
            WHERE ec.status NOT IN ('CLOSED','RECEIVED')
            ORDER BY 
                CASE ec.priority WHEN 'EMERGENCY' THEN 1 WHEN 'URGENT' THEN 2 ELSE 3 END,
                ec.created_at DESC
        """)
        active_cases = rows_to_list(await c.fetchall())

        # Appointments by status
        c = await db.execute("SELECT status, COUNT(*) as count FROM appointments GROUP BY status")
        appt_by_status = rows_to_list(await c.fetchall())

        return {
            "total_patients": total_patients,
            "today_appointments": today_appointments,
            "active_emergencies": active_emergencies,
            "ambulance_requests": ambulance_requests,
            "blood_requests": blood_requests_count,
            "active_cases": active_cases,
            "appointments_by_status": appt_by_status,
        }
    finally:
        await db.close()


# ─── Patients ─────────────────────────────────────────────────────────────────

@app.get("/api/patients")
async def list_patients(search: Optional[str] = Query(None)):
    db = await get_db()
    try:
        if search:
            c = await db.execute(
                "SELECT * FROM patients WHERE full_name LIKE ? OR phone LIKE ? OR blood_group LIKE ? ORDER BY full_name",
                (f"%{search}%", f"%{search}%", f"%{search}%")
            )
        else:
            c = await db.execute("SELECT * FROM patients ORDER BY full_name")
        return rows_to_list(await c.fetchall())
    finally:
        await db.close()


@app.get("/api/patients/{patient_id}")
async def get_patient(patient_id: int):
    db = await get_db()
    try:
        c = await db.execute("SELECT * FROM patients WHERE id = ?", (patient_id,))
        patient = row_to_dict(await c.fetchone())
        if not patient:
            raise HTTPException(404, "Patient not found")

        # Appointments
        c = await db.execute(
            "SELECT * FROM appointments WHERE patient_id = ? ORDER BY date DESC, time DESC",
            (patient_id,)
        )
        appointments = rows_to_list(await c.fetchall())

        # Emergency cases
        c = await db.execute(
            "SELECT * FROM emergency_cases WHERE patient_id = ? ORDER BY created_at DESC",
            (patient_id,)
        )
        cases = rows_to_list(await c.fetchall())

        return {**patient, "appointments": appointments, "emergency_cases": cases}
    finally:
        await db.close()


@app.post("/api/patients", status_code=201)
async def create_patient(body: PatientCreate):
    db = await get_db()
    try:
        c = await db.execute(
            """INSERT INTO patients (full_name, age, gender, blood_group, phone, emergency_contact, address, created_at, updated_at)
               VALUES (?,?,?,?,?,?,?,?,?)""",
            (body.full_name, body.age, body.gender, body.blood_group,
             body.phone, body.emergency_contact, body.address, now_iso(), now_iso())
        )
        await db.commit()
        pid = c.lastrowid
        c = await db.execute("SELECT * FROM patients WHERE id = ?", (pid,))
        return row_to_dict(await c.fetchone())
    finally:
        await db.close()


@app.put("/api/patients/{patient_id}")
async def update_patient(patient_id: int, body: PatientUpdate):
    db = await get_db()
    try:
        c = await db.execute("SELECT * FROM patients WHERE id = ?", (patient_id,))
        if not await c.fetchone():
            raise HTTPException(404, "Patient not found")
        fields = {k: v for k, v in body.model_dump().items() if v is not None}
        if not fields:
            raise HTTPException(400, "No fields to update")
        fields["updated_at"] = now_iso()
        set_clause = ", ".join(f"{k} = ?" for k in fields)
        await db.execute(
            f"UPDATE patients SET {set_clause} WHERE id = ?",
            list(fields.values()) + [patient_id]
        )
        await db.commit()
        c = await db.execute("SELECT * FROM patients WHERE id = ?", (patient_id,))
        return row_to_dict(await c.fetchone())
    finally:
        await db.close()


# ─── Appointments ─────────────────────────────────────────────────────────────

@app.get("/api/appointments")
async def list_appointments(
    search: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    date: Optional[str] = Query(None),
):
    db = await get_db()
    try:
        where = []
        params = []
        if search:
            where.append("(p.full_name LIKE ? OR a.doctor LIKE ? OR a.department LIKE ?)")
            params += [f"%{search}%", f"%{search}%", f"%{search}%"]
        if status:
            where.append("a.status = ?")
            params.append(status)
        if date:
            where.append("a.date = ?")
            params.append(date)

        where_clause = ("WHERE " + " AND ".join(where)) if where else ""
        c = await db.execute(
            f"""SELECT a.*, p.full_name, p.blood_group, p.phone
                FROM appointments a
                JOIN patients p ON p.id = a.patient_id
                {where_clause}
                ORDER BY a.date DESC, a.time DESC""",
            params
        )
        return rows_to_list(await c.fetchall())
    finally:
        await db.close()


@app.post("/api/appointments", status_code=201)
async def create_appointment(body: AppointmentCreate):
    db = await get_db()
    try:
        c = await db.execute("SELECT id FROM patients WHERE id = ?", (body.patient_id,))
        if not await c.fetchone():
            raise HTTPException(404, "Patient not found")
        c = await db.execute(
            """INSERT INTO appointments (patient_id, doctor, department, date, time, reason, status, notes, created_at, updated_at)
               VALUES (?,?,?,?,?,?,?,?,?,?)""",
            (body.patient_id, body.doctor, body.department, body.date, body.time,
             body.reason, body.status or "BOOKED", body.notes, now_iso(), now_iso())
        )
        await db.commit()
        aid = c.lastrowid
        c = await db.execute(
            "SELECT a.*, p.full_name FROM appointments a JOIN patients p ON p.id = a.patient_id WHERE a.id = ?",
            (aid,)
        )
        return row_to_dict(await c.fetchone())
    finally:
        await db.close()


@app.patch("/api/appointments/{appt_id}/status")
async def update_appointment_status(appt_id: int, body: AppointmentStatusUpdate):
    db = await get_db()
    try:
        c = await db.execute("SELECT id FROM appointments WHERE id = ?", (appt_id,))
        if not await c.fetchone():
            raise HTTPException(404, "Appointment not found")
        await db.execute(
            "UPDATE appointments SET status = ?, updated_at = ? WHERE id = ?",
            (body.status, now_iso(), appt_id)
        )
        await db.commit()
        c = await db.execute(
            "SELECT a.*, p.full_name FROM appointments a JOIN patients p ON p.id = a.patient_id WHERE a.id = ?",
            (appt_id,)
        )
        return row_to_dict(await c.fetchone())
    finally:
        await db.close()


# ─── Emergency Cases ───────────────────────────────────────────────────────────

@app.get("/api/emergency-cases")
async def list_emergency_cases(status: Optional[str] = Query(None)):
    db = await get_db()
    try:
        where = ""
        params = []
        if status:
            where = "WHERE ec.status = ?"
            params = [status]
        c = await db.execute(
            f"""SELECT ec.*, p.full_name, p.blood_group, p.phone,
                       ar.status as amb_status, ar.provider as amb_provider,
                       ar.vehicle_number, ar.driver_name,
                       br.status as blood_status, br.blood_group as blood_grp
                FROM emergency_cases ec
                JOIN patients p ON p.id = ec.patient_id
                LEFT JOIN ambulance_requests ar ON ar.case_id = ec.id AND ar.id = (
                    SELECT id FROM ambulance_requests WHERE case_id = ec.id ORDER BY id DESC LIMIT 1
                )
                LEFT JOIN blood_requests br ON br.case_id = ec.id AND br.id = (
                    SELECT id FROM blood_requests WHERE case_id = ec.id ORDER BY id DESC LIMIT 1
                )
                {where}
                ORDER BY
                    CASE ec.priority WHEN 'EMERGENCY' THEN 1 WHEN 'URGENT' THEN 2 ELSE 3 END,
                    ec.created_at DESC""",
            params
        )
        return rows_to_list(await c.fetchall())
    finally:
        await db.close()


@app.get("/api/emergency-cases/{case_id}")
async def get_emergency_case(case_id: int):
    db = await get_db()
    try:
        c = await db.execute(
            """SELECT ec.*, p.full_name, p.blood_group, p.phone, p.age, p.gender,
                      ar.status as amb_status, ar.provider as amb_provider,
                      ar.vehicle_number, ar.driver_name, ar.driver_phone,
                      ar.ambulance_type, ar.id as amb_request_id,
                      br.id as blood_request_id, br.status as blood_status,
                      br.blood_group as blood_grp, br.component as blood_component,
                      br.units_required,
                      bs.name as blood_source_name, bs.location as blood_source_loc,
                      f.id as facility_id, f.name as facility_name
               FROM emergency_cases ec
               JOIN patients p ON p.id = ec.patient_id
               LEFT JOIN ambulance_requests ar ON ar.case_id = ec.id AND ar.id = (
                   SELECT id FROM ambulance_requests WHERE case_id = ec.id ORDER BY id DESC LIMIT 1
               )
               LEFT JOIN blood_requests br ON br.case_id = ec.id AND br.id = (
                   SELECT id FROM blood_requests WHERE case_id = ec.id ORDER BY id DESC LIMIT 1
               )
               LEFT JOIN blood_sources bs ON bs.id = br.source_id
               LEFT JOIN facilities f ON f.name = ec.destination
               WHERE ec.id = ?""",
            (case_id,)
        )
        case = row_to_dict(await c.fetchone())
        if not case:
            raise HTTPException(404, "Case not found")

        # Timeline
        c = await db.execute(
            "SELECT * FROM case_events WHERE case_id = ? ORDER BY created_at ASC",
            (case_id,)
        )
        case["timeline"] = rows_to_list(await c.fetchall())

        return case
    finally:
        await db.close()


@app.post("/api/emergency-cases", status_code=201)
async def create_emergency_case(body: EmergencyCaseCreate):
    db = await get_db()
    try:
        c = await db.execute("SELECT id FROM patients WHERE id = ?", (body.patient_id,))
        if not await c.fetchone():
            raise HTTPException(404, "Patient not found")

        today = datetime.utcnow().strftime("%Y%m%d")
        c = await db.execute("SELECT COUNT(*) FROM emergency_cases WHERE created_at LIKE ?", (f"{datetime.utcnow().strftime('%Y-%m-%d')}%",))
        count = (await c.fetchone())[0]
        case_ref = f"CL-{today}-{1001 + count}"

        created_at = now_iso()
        c = await db.execute(
            """INSERT INTO emergency_cases
               (case_ref, patient_id, priority, status, pickup_location, destination,
                blood_required, blood_group, blood_component, blood_units, notes, created_at, updated_at)
               VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)""",
            (case_ref, body.patient_id, body.priority, "CREATED",
             body.pickup_location, body.destination,
             1 if body.blood_required else 0,
             body.blood_group, body.blood_component, body.blood_units,
             body.notes, created_at, created_at)
        )
        await db.commit()
        case_id = c.lastrowid

        await add_case_event(db, case_id, "CASE_CREATED",
                             f"Emergency case {case_ref} created. Priority: {body.priority}.", "Coordinator")
        await db.commit()

        c = await db.execute("SELECT * FROM emergency_cases WHERE id = ?", (case_id,))
        return row_to_dict(await c.fetchone())
    finally:
        await db.close()


@app.patch("/api/emergency-cases/{case_id}/status")
async def update_case_status(case_id: int, body: EmergencyCaseStatusUpdate):
    db = await get_db()
    try:
        c = await db.execute("SELECT * FROM emergency_cases WHERE id = ?", (case_id,))
        existing = row_to_dict(await c.fetchone())
        if not existing:
            raise HTTPException(404, "Case not found")

        update_fields = {"status": body.status, "updated_at": now_iso()}
        if body.status in ("CLOSED", "RECEIVED"):
            update_fields["closed_at"] = now_iso()

        set_clause = ", ".join(f"{k} = ?" for k in update_fields)
        await db.execute(
            f"UPDATE emergency_cases SET {set_clause} WHERE id = ?",
            list(update_fields.values()) + [case_id]
        )

        event_descriptions = {
            "ACKNOWLEDGED": "Case acknowledged by coordination center.",
            "AMBULANCE_REQUESTED": "Ambulance coordination initiated.",
            "AMBULANCE_ASSIGNED": "Ambulance unit assigned and confirmed.",
            "EN_ROUTE": "Ambulance en route to pickup location.",
            "ARRIVED": "Ambulance arrived at pickup location.",
            "TRANSFERRED": "Patient transferred to ambulance.",
            "RECEIVED": "Patient received at destination facility.",
            "CLOSED": "Case closed and archived.",
        }
        desc = body.notes or event_descriptions.get(body.status, f"Status updated to {body.status}.")
        await add_case_event(db, case_id, body.status, desc, body.actor)
        await db.commit()

        c = await db.execute("SELECT * FROM emergency_cases WHERE id = ?", (case_id,))
        return row_to_dict(await c.fetchone())
    finally:
        await db.close()


# ─── Ambulance ─────────────────────────────────────────────────────────────────

@app.get("/api/ambulances")
async def list_ambulances(case_id: Optional[int] = Query(None)):
    db = await get_db()
    try:
        if case_id:
            c = await db.execute(
                "SELECT ar.*, ec.case_ref FROM ambulance_requests ar JOIN emergency_cases ec ON ec.id = ar.case_id WHERE ar.case_id = ? ORDER BY ar.id DESC",
                (case_id,)
            )
        else:
            c = await db.execute(
                "SELECT ar.*, ec.case_ref FROM ambulance_requests ar JOIN emergency_cases ec ON ec.id = ar.case_id ORDER BY ar.id DESC LIMIT 50"
            )
        return rows_to_list(await c.fetchall())
    finally:
        await db.close()


@app.post("/api/ambulances/request", status_code=201)
async def request_ambulance(body: AmbulanceRequest):
    db = await get_db()
    try:
        c = await db.execute("SELECT * FROM emergency_cases WHERE id = ?", (body.case_id,))
        if not await c.fetchone():
            raise HTTPException(404, "Case not found")

        created_at = now_iso()
        c = await db.execute(
            """INSERT INTO ambulance_requests
               (case_id, provider, ambulance_type, vehicle_number, driver_name, driver_phone,
                location, distance_km, status, requested_at, updated_at)
               VALUES (?,?,?,?,?,?,?,?,?,?,?)""",
            (body.case_id, body.provider, body.ambulance_type, body.vehicle_number,
             body.driver_name, body.driver_phone, body.location, body.distance_km,
             "REQUESTED", created_at, created_at)
        )
        await db.commit()
        req_id = c.lastrowid

        # Update case status
        await db.execute(
            "UPDATE emergency_cases SET status = 'AMBULANCE_REQUESTED', updated_at = ? WHERE id = ?",
            (now_iso(), body.case_id)
        )
        await add_case_event(db, body.case_id, "AMBULANCE_REQUESTED",
                             f"Ambulance coordination requested from {body.provider or 'provider'}.", body.actor if hasattr(body, 'actor') else "Coordinator")
        await db.commit()

        c = await db.execute("SELECT * FROM ambulance_requests WHERE id = ?", (req_id,))
        return row_to_dict(await c.fetchone())
    finally:
        await db.close()


@app.patch("/api/ambulances/{req_id}/status")
async def update_ambulance_status(req_id: int, body: AmbulanceStatusUpdate):
    db = await get_db()
    try:
        c = await db.execute("SELECT * FROM ambulance_requests WHERE id = ?", (req_id,))
        amb = row_to_dict(await c.fetchone())
        if not amb:
            raise HTTPException(404, "Ambulance request not found")

        update_fields = {"status": body.status, "updated_at": now_iso()}
        if body.status == "ASSIGNED":
            update_fields["assigned_at"] = now_iso()
        elif body.status == "ARRIVED":
            update_fields["arrived_at"] = now_iso()

        set_clause = ", ".join(f"{k} = ?" for k in update_fields)
        await db.execute(
            f"UPDATE ambulance_requests SET {set_clause} WHERE id = ?",
            list(update_fields.values()) + [req_id]
        )

        # Mirror on case
        case_status_map = {
            "ASSIGNED": "AMBULANCE_ASSIGNED",
            "EN_ROUTE": "EN_ROUTE",
            "ARRIVED": "ARRIVED",
            "TRANSFERRED": "TRANSFERRED",
        }
        event_descs = {
            "ASSIGNED": "Ambulance unit assigned and confirmed. Driver dispatched.",
            "EN_ROUTE": "Ambulance en route to pickup location.",
            "ARRIVED": "Ambulance arrived at pickup location.",
            "TRANSFERRED": "Patient transferred to ambulance. En route to facility.",
        }
        if body.status in case_status_map:
            await db.execute(
                "UPDATE emergency_cases SET status = ?, updated_at = ? WHERE id = ?",
                (case_status_map[body.status], now_iso(), amb["case_id"])
            )
            await add_case_event(db, amb["case_id"],
                                 case_status_map[body.status],
                                 event_descs.get(body.status, f"Ambulance status: {body.status}"),
                                 body.actor)

        await db.commit()
        c = await db.execute("SELECT * FROM ambulance_requests WHERE id = ?", (req_id,))
        return row_to_dict(await c.fetchone())
    finally:
        await db.close()


# ─── Mock Ambulance Providers ──────────────────────────────────────────────────

@app.get("/api/ambulances/available")
async def get_available_ambulances():
    """Return mock list of available ambulance services for coordination."""
    return [
        {"id": 1, "provider": "MedAlert Ambulance", "type": "Advanced Life Support", "vehicle": "KA-01-EMS-1234", "location": "MG Road, Bengaluru", "distance_km": 2.1, "eta_min": 8, "contact": "+91-8100001111", "available": True},
        {"id": 2, "provider": "LifeLine EMS", "type": "Basic Life Support", "vehicle": "KA-05-EMS-5678", "location": "Koramangala, Bengaluru", "distance_km": 3.4, "eta_min": 12, "contact": "+91-8100002222", "available": True},
        {"id": 3, "provider": "City Emergency Services", "type": "Critical Care Transport", "vehicle": "KA-09-EMS-9012", "location": "Whitefield, Bengaluru", "distance_km": 5.8, "eta_min": 18, "contact": "+91-8100003333", "available": True},
        {"id": 4, "provider": "RapidCare Ambulance", "type": "Advanced Life Support", "vehicle": "KA-03-EMS-3456", "location": "Hebbal, Bengaluru", "distance_km": 4.2, "eta_min": 15, "contact": "+91-8100004444", "available": True},
        {"id": 5, "provider": "Sparsh EMS", "type": "Basic Life Support", "vehicle": "KA-07-EMS-7890", "location": "Indiranagar, Bengaluru", "distance_km": 1.9, "eta_min": 7, "contact": "+91-8100005555", "available": False},
    ]


# ─── Blood ─────────────────────────────────────────────────────────────────────

@app.get("/api/blood/sources")
async def search_blood_sources(
    blood_group: Optional[str] = Query(None),
    component: Optional[str] = Query(None),
    max_km: Optional[float] = Query(None),
):
    db = await get_db()
    try:
        where = ["is_active = 1"]
        params = []
        if blood_group:
            where.append("blood_group = ?")
            params.append(blood_group)
        if component:
            where.append("component = ?")
            params.append(component)
        if max_km:
            where.append("distance_km <= ?")
            params.append(max_km)
        c = await db.execute(
            f"SELECT * FROM blood_sources WHERE {' AND '.join(where)} ORDER BY distance_km ASC",
            params
        )
        rows = rows_to_list(await c.fetchall())
        now = datetime.utcnow()
        for r in rows:
            try:
                lu = datetime.fromisoformat(r["last_updated"])
                hrs = (now - lu).total_seconds() / 3600
                r["freshness"] = "FRESH" if hrs < 12 else ("AGING" if hrs < 36 else "STALE")
            except Exception:
                r["freshness"] = "UNKNOWN"
        return rows
    finally:
        await db.close()


@app.post("/api/blood/request", status_code=201)
async def create_blood_request(body: BloodRequestCreate):
    db = await get_db()
    try:
        c = await db.execute("SELECT * FROM emergency_cases WHERE id = ?", (body.case_id,))
        if not await c.fetchone():
            raise HTTPException(404, "Case not found")
        created_at = now_iso()
        c = await db.execute(
            """INSERT INTO blood_requests (case_id, blood_group, component, units_required, status, notes, created_at, updated_at)
               VALUES (?,?,?,?,?,?,?,?)""",
            (body.case_id, body.blood_group, body.component, body.units_required,
             "REQUESTED", body.notes, created_at, created_at)
        )
        await db.commit()
        req_id = c.lastrowid
        await add_case_event(db, body.case_id, "BLOOD_REQUESTED",
                             f"Blood coordination initiated. Requirement: {body.units_required}u {body.blood_group} {body.component}.", "Coordinator")
        await db.commit()
        c = await db.execute("SELECT * FROM blood_requests WHERE id = ?", (req_id,))
        return row_to_dict(await c.fetchone())
    finally:
        await db.close()


@app.patch("/api/blood/request/{req_id}/status")
async def update_blood_status(req_id: int, body: BloodRequestStatusUpdate):
    db = await get_db()
    try:
        c = await db.execute("SELECT * FROM blood_requests WHERE id = ?", (req_id,))
        req = row_to_dict(await c.fetchone())
        if not req:
            raise HTTPException(404, "Blood request not found")

        update_fields = {"status": body.status, "updated_at": now_iso()}
        if body.source_id:
            update_fields["source_id"] = body.source_id

        set_clause = ", ".join(f"{k} = ?" for k in update_fields)
        await db.execute(
            f"UPDATE blood_requests SET {set_clause} WHERE id = ?",
            list(update_fields.values()) + [req_id]
        )

        source_name = ""
        if body.source_id:
            c2 = await db.execute("SELECT name FROM blood_sources WHERE id = ?", (body.source_id,))
            src = await c2.fetchone()
            source_name = f" from {src['name']}" if src else ""

        event_descs = {
            "SEARCHING": "Blood search initiated across coordination network.",
            "MATCH_FOUND": f"Blood match identified{source_name}.",
            "CONTACTED": f"Blood source contacted{source_name}.",
            "CONFIRMED": f"Blood availability confirmed{source_name}.",
            "FULFILLED": "Blood requirement fulfilled. Units en route.",
        }
        desc = event_descs.get(body.status, f"Blood request status: {body.status}.")
        await add_case_event(db, req["case_id"], f"BLOOD_{body.status}", desc, body.actor)
        await db.commit()

        c = await db.execute("SELECT * FROM blood_requests WHERE id = ?", (req_id,))
        return row_to_dict(await c.fetchone())
    finally:
        await db.close()


# ─── Facilities ────────────────────────────────────────────────────────────────

@app.get("/api/facilities")
async def list_facilities():
    db = await get_db()
    try:
        c = await db.execute("SELECT * FROM facilities WHERE is_active = 1 ORDER BY distance_km ASC")
        return rows_to_list(await c.fetchall())
    finally:
        await db.close()


@app.post("/api/facilities/contact")
async def contact_facility(body: FacilityContactRequest):
    db = await get_db()
    try:
        c = await db.execute("SELECT * FROM facilities WHERE id = ?", (body.facility_id,))
        facility = row_to_dict(await c.fetchone())
        if not facility:
            raise HTTPException(404, "Facility not found")
        await add_case_event(db, body.case_id, "FACILITY_CONTACTED",
                             f"Facility contacted: {facility['name']} ({facility['location']}). Awaiting response.", body.actor)
        # Update destination on case
        await db.execute(
            "UPDATE emergency_cases SET destination = ?, updated_at = ? WHERE id = ?",
            (facility["name"], now_iso(), body.case_id)
        )
        await db.commit()
        return {"message": f"Contact initiated with {facility['name']}", "facility": facility}
    finally:
        await db.close()


@app.post("/api/facilities/update-status")
async def update_facility_case_status(body: FacilityStatusUpdate):
    db = await get_db()
    try:
        c = await db.execute("SELECT * FROM emergency_cases WHERE id = ?", (body.case_id,))
        if not await c.fetchone():
            raise HTTPException(404, "Case not found")

        event_descs = {
            "ACCEPTED": "Receiving facility accepted the case. Ready to receive patient.",
            "DECLINED": "Facility declined — coordination redirected.",
        }
        desc = event_descs.get(body.status, f"Facility status update: {body.status}.")
        await add_case_event(db, body.case_id, f"FACILITY_{body.status}", desc, body.actor)
        await db.commit()
        return {"message": "Facility status updated", "status": body.status}
    finally:
        await db.close()


# ─── Case Timeline ─────────────────────────────────────────────────────────────

@app.get("/api/cases/{case_id}/timeline")
async def get_case_timeline(case_id: int):
    db = await get_db()
    try:
        c = await db.execute(
            "SELECT * FROM case_events WHERE case_id = ? ORDER BY created_at ASC",
            (case_id,)
        )
        return rows_to_list(await c.fetchall())
    finally:
        await db.close()


@app.post("/api/cases/{case_id}/events")
async def add_timeline_event(case_id: int, body: CaseEventCreate):
    db = await get_db()
    try:
        c = await db.execute("SELECT id FROM emergency_cases WHERE id = ?", (case_id,))
        if not await c.fetchone():
            raise HTTPException(404, "Case not found")
        created_at = now_iso()
        c = await db.execute(
            "INSERT INTO case_events (case_id, event_type, description, actor, metadata, created_at) VALUES (?,?,?,?,?,?)",
            (case_id, body.event_type, body.description, body.actor, body.metadata, created_at)
        )
        await db.commit()
        eid = c.lastrowid
        c = await db.execute("SELECT * FROM case_events WHERE id = ?", (eid,))
        return row_to_dict(await c.fetchone())
    finally:
        await db.close()


# ─── Analytics ─────────────────────────────────────────────────────────────────

@app.get("/api/analytics")
async def get_analytics():
    db = await get_db()
    try:
        c = await db.execute("SELECT status, COUNT(*) as count FROM appointments GROUP BY status")
        appt_by_status = rows_to_list(await c.fetchall())

        c = await db.execute("SELECT status, COUNT(*) as count FROM emergency_cases GROUP BY status")
        cases_by_status = rows_to_list(await c.fetchall())

        c = await db.execute("SELECT priority, COUNT(*) as count FROM emergency_cases GROUP BY priority")
        cases_by_priority = rows_to_list(await c.fetchall())

        c = await db.execute("SELECT COUNT(*) as count FROM ambulance_requests")
        total_amb = (await c.fetchone())[0]

        c = await db.execute("SELECT COUNT(*) as count FROM blood_requests")
        total_blood = (await c.fetchone())[0]

        c = await db.execute("""
            SELECT AVG((julianday(closed_at) - julianday(created_at)) * 24 * 60) as avg_min
            FROM emergency_cases WHERE closed_at IS NOT NULL
        """)
        avg_time_row = await c.fetchone()
        avg_coordination_min = round(avg_time_row[0] or 0, 1)

        # Last 7 days
        c = await db.execute("""
            SELECT date(created_at) as day, COUNT(*) as count
            FROM emergency_cases
            WHERE created_at >= date('now', '-7 days')
            GROUP BY date(created_at)
            ORDER BY day
        """)
        cases_last_7 = rows_to_list(await c.fetchall())

        c = await db.execute("""
            SELECT date(date) as day, COUNT(*) as count
            FROM appointments
            WHERE date >= date('now', '-7 days')
            GROUP BY date(date)
            ORDER BY day
        """)
        appts_last_7 = rows_to_list(await c.fetchall())

        return {
            "appointments_by_status": appt_by_status,
            "cases_by_status": cases_by_status,
            "cases_by_priority": cases_by_priority,
            "total_ambulance_requests": total_amb,
            "total_blood_requests": total_blood,
            "avg_coordination_minutes": avg_coordination_min,
            "cases_last_7_days": cases_last_7,
            "appointments_last_7_days": appts_last_7,
        }
    finally:
        await db.close()


# ─── Health Check ──────────────────────────────────────────────────────────────

@app.get("/api/health")
async def health():
    return {"status": "ok", "service": "CareLink API", "version": "1.0.0"}


# ─── Serve React build (for Cloud Run single-service deploy) ───────────────────

STATIC_DIR = os.environ.get("STATIC_DIR", "../frontend/dist")
if os.path.isdir(STATIC_DIR):
    from fastapi.responses import FileResponse

    app.mount("/assets", StaticFiles(directory=f"{STATIC_DIR}/assets"), name="assets")

    @app.get("/{full_path:path}")
    async def serve_react(full_path: str):
        index_path = os.path.join(STATIC_DIR, "index.html")
        return FileResponse(index_path)


# ─── Entry point ──────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=False)
