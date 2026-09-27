import aiosqlite
import os
from datetime import datetime, timedelta
import random

DB_PATH = os.environ.get("DB_PATH", "./carelink.db")


async def get_db():
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        yield db


async def init_db():
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        await db.execute("PRAGMA foreign_keys = ON")

        # Patients
        await db.execute("""
            CREATE TABLE IF NOT EXISTS patients (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                full_name TEXT NOT NULL,
                age INTEGER,
                gender TEXT,
                blood_group TEXT,
                phone TEXT,
                emergency_contact TEXT,
                address TEXT,
                created_at TEXT DEFAULT (datetime('now')),
                updated_at TEXT DEFAULT (datetime('now'))
            )
        """)

        # Appointments
        await db.execute("""
            CREATE TABLE IF NOT EXISTS appointments (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                patient_id INTEGER NOT NULL REFERENCES patients(id),
                doctor TEXT,
                department TEXT,
                date TEXT,
                time TEXT,
                reason TEXT,
                status TEXT DEFAULT 'BOOKED',
                notes TEXT,
                created_at TEXT DEFAULT (datetime('now')),
                updated_at TEXT DEFAULT (datetime('now'))
            )
        """)

        # Emergency Cases
        await db.execute("""
            CREATE TABLE IF NOT EXISTS emergency_cases (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                case_ref TEXT UNIQUE,
                patient_id INTEGER NOT NULL REFERENCES patients(id),
                priority TEXT DEFAULT 'URGENT',
                status TEXT DEFAULT 'CREATED',
                pickup_location TEXT,
                destination TEXT,
                blood_required INTEGER DEFAULT 0,
                blood_group TEXT,
                blood_component TEXT,
                blood_units INTEGER DEFAULT 0,
                notes TEXT,
                created_at TEXT DEFAULT (datetime('now')),
                updated_at TEXT DEFAULT (datetime('now')),
                closed_at TEXT
            )
        """)

        # Ambulance Requests
        await db.execute("""
            CREATE TABLE IF NOT EXISTS ambulance_requests (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                case_id INTEGER NOT NULL REFERENCES emergency_cases(id),
                provider TEXT,
                ambulance_type TEXT,
                vehicle_number TEXT,
                driver_name TEXT,
                driver_phone TEXT,
                location TEXT,
                distance_km REAL,
                status TEXT DEFAULT 'REQUESTED',
                requested_at TEXT DEFAULT (datetime('now')),
                assigned_at TEXT,
                arrived_at TEXT,
                updated_at TEXT DEFAULT (datetime('now'))
            )
        """)

        # Blood Requests
        await db.execute("""
            CREATE TABLE IF NOT EXISTS blood_requests (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                case_id INTEGER NOT NULL REFERENCES emergency_cases(id),
                blood_group TEXT,
                component TEXT,
                units_required INTEGER,
                source_id INTEGER REFERENCES blood_sources(id),
                status TEXT DEFAULT 'REQUESTED',
                notes TEXT,
                created_at TEXT DEFAULT (datetime('now')),
                updated_at TEXT DEFAULT (datetime('now'))
            )
        """)

        # Blood Sources (mock data)
        await db.execute("""
            CREATE TABLE IF NOT EXISTS blood_sources (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT,
                type TEXT,
                location TEXT,
                blood_group TEXT,
                component TEXT,
                units_available INTEGER,
                distance_km REAL,
                contact TEXT,
                last_updated TEXT DEFAULT (datetime('now')),
                is_active INTEGER DEFAULT 1
            )
        """)

        # Facilities
        await db.execute("""
            CREATE TABLE IF NOT EXISTS facilities (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT,
                type TEXT,
                location TEXT,
                distance_km REAL,
                emergency_available INTEGER DEFAULT 1,
                icu_beds INTEGER DEFAULT 0,
                contact TEXT,
                last_verified TEXT DEFAULT (datetime('now')),
                is_active INTEGER DEFAULT 1
            )
        """)

        # Case Events (timeline)
        await db.execute("""
            CREATE TABLE IF NOT EXISTS case_events (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                case_id INTEGER NOT NULL REFERENCES emergency_cases(id),
                event_type TEXT,
                description TEXT,
                actor TEXT DEFAULT 'System',
                metadata TEXT,
                created_at TEXT DEFAULT (datetime('now'))
            )
        """)

        await db.commit()

        # Seed data if empty
        cursor = await db.execute("SELECT COUNT(*) as cnt FROM patients")
        row = await cursor.fetchone()
        if row["cnt"] == 0:
            await seed_data(db)


async def seed_data(db):
    now = datetime.utcnow()

    # ---- Patients ----
    patients = [
        ("Arjun Mehta", 34, "Male", "A+", "+91-9876543210", "Priya Mehta: +91-9876543211", "12 MG Road, Bengaluru"),
        ("Sunita Rao", 52, "Female", "B-", "+91-9012345678", "Ramesh Rao: +91-9012345679", "45 Koramangala, Bengaluru"),
        ("Vikram Singh", 28, "Male", "O+", "+91-8765432109", "Anita Singh: +91-8765432110", "78 Indiranagar, Bengaluru"),
        ("Lakshmi Nair", 61, "Female", "AB+", "+91-7654321098", "Mohan Nair: +91-7654321099", "3 Jayanagar, Bengaluru"),
        ("Rohan Kapoor", 19, "Male", "A-", "+91-6543210987", "Sunita Kapoor: +91-6543210988", "22 HSR Layout, Bengaluru"),
        ("Meena Krishnan", 45, "Female", "O-", "+91-9988776655", "Suresh Krishnan: +91-9988776656", "9 Whitefield, Bengaluru"),
        ("Aditya Sharma", 37, "Male", "B+", "+91-8877665544", "Kavita Sharma: +91-8877665545", "56 BTM Layout, Bengaluru"),
        ("Pooja Iyer", 29, "Female", "A+", "+91-7766554433", "Rajan Iyer: +91-7766554434", "14 JP Nagar, Bengaluru"),
        ("Suresh Patel", 55, "Male", "AB-", "+91-6655443322", "Geeta Patel: +91-6655443323", "88 Hebbal, Bengaluru"),
        ("Divya Menon", 42, "Female", "B+", "+91-9123456789", "Ajay Menon: +91-9123456780", "31 Yelahanka, Bengaluru"),
    ]

    patient_ids = []
    for p in patients:
        cursor = await db.execute(
            "INSERT INTO patients (full_name, age, gender, blood_group, phone, emergency_contact, address) VALUES (?,?,?,?,?,?,?)",
            p
        )
        patient_ids.append(cursor.lastrowid)

    # ---- Appointments ----
    departments = ["Cardiology", "Orthopedics", "General Medicine", "Neurology", "Emergency", "Radiology", "Pediatrics"]
    doctors = ["Dr. Anand Kumar", "Dr. Preethi Shetty", "Dr. Rajesh Nair", "Dr. Kavitha Menon", "Dr. Suresh Babu"]
    statuses = ["BOOKED", "BOOKED", "CHECKED-IN", "WAITING", "IN-CONSULTATION", "COMPLETED", "COMPLETED", "CANCELLED"]

    for i in range(18):
        pid = random.choice(patient_ids)
        days_offset = random.randint(-5, 5)
        appt_date = (now + timedelta(days=days_offset)).strftime("%Y-%m-%d")
        appt_time = f"{random.randint(8, 17):02d}:{random.choice(['00', '15', '30', '45'])}"
        status = "COMPLETED" if days_offset < 0 else random.choice(statuses[:5])
        if days_offset < -1:
            status = "COMPLETED"
        elif days_offset == 0:
            status = random.choice(["CHECKED-IN", "WAITING", "IN-CONSULTATION", "BOOKED"])
        await db.execute(
            "INSERT INTO appointments (patient_id, doctor, department, date, time, reason, status) VALUES (?,?,?,?,?,?,?)",
            (pid, random.choice(doctors), random.choice(departments),
             appt_date, appt_time,
             random.choice(["Routine checkup", "Follow-up", "Chest pain", "Fever & fatigue", "Blood pressure review", "Post-surgery follow-up"]),
             status)
        )

    # ---- Blood Sources ----
    blood_sources = [
        ("City Blood Bank", "Blood Bank", "MG Road, Bengaluru", "A+", "Whole Blood", 12, 2.1, "+91-8000012345"),
        ("Apollo Blood Center", "Hospital", "Bannerghatta Rd, Bengaluru", "O+", "Whole Blood", 8, 4.5, "+91-8000023456"),
        ("Red Cross Bengaluru", "NGO", "Residency Rd, Bengaluru", "B-", "Packed RBC", 5, 3.2, "+91-8000034567"),
        ("Narayana Blood Bank", "Hospital", "Hosur Rd, Bengaluru", "AB+", "Platelets", 20, 6.8, "+91-8000045678"),
        ("Manipal Blood Services", "Hospital", "Old Airport Rd, Bengaluru", "A-", "Packed RBC", 7, 5.1, "+91-8000056789"),
        ("Kidwai Blood Bank", "Government", "Kidwai Memorial, Bengaluru", "O-", "Whole Blood", 3, 7.4, "+91-8000067890"),
        ("Fortis Blood Center", "Hospital", "Bannerghatta, Bengaluru", "B+", "Platelets", 15, 8.2, "+91-8000078901"),
        ("LifeCare Blood Bank", "Blood Bank", "Rajajinagar, Bengaluru", "A+", "Platelets", 10, 3.9, "+91-8000089012"),
        ("NIMHANS Blood Unit", "Hospital", "Hosur Rd, Bengaluru", "AB-", "Packed RBC", 4, 5.7, "+91-8000090123"),
        ("Sparsh Blood Services", "Hospital", "Yeshwantpur, Bengaluru", "O+", "Packed RBC", 9, 9.3, "+91-8000001234"),
    ]

    blood_source_ids = []
    for i, bs in enumerate(blood_sources):
        days_ago = random.randint(0, 3)
        last_updated = (now - timedelta(days=days_ago, hours=random.randint(0, 12))).strftime("%Y-%m-%dT%H:%M:%S")
        cursor = await db.execute(
            "INSERT INTO blood_sources (name, type, location, blood_group, component, units_available, distance_km, contact, last_updated) VALUES (?,?,?,?,?,?,?,?,?)",
            bs + (last_updated,)
        )
        blood_source_ids.append(cursor.lastrowid)

    # ---- Facilities ----
    facilities = [
        ("Bengaluru City Hospital", "Multi-Specialty", "MG Road, Bengaluru", 1.5, 1, 12, "+91-9000012345"),
        ("Apollo Hospitals", "Super-Specialty", "Bannerghatta Rd, Bengaluru", 4.2, 1, 24, "+91-9000023456"),
        ("Narayana Health City", "Cardiac Care", "Hosur Rd, Bengaluru", 7.8, 1, 8, "+91-9000034567"),
        ("Manipal Hospital", "Multi-Specialty", "Old Airport Rd, Bengaluru", 5.1, 1, 16, "+91-9000045678"),
        ("St. John's Medical", "Teaching Hospital", "Koramangala, Bengaluru", 3.4, 0, 4, "+91-9000056789"),
        ("Fortis Hospital", "Super-Specialty", "Bannerghatta, Bengaluru", 8.9, 1, 20, "+91-9000067890"),
        ("Victoria Hospital", "Government", "City Market, Bengaluru", 2.7, 1, 30, "+91-9000078901"),
        ("BGS Global Hospital", "Multi-Specialty", "Kengeri, Bengaluru", 11.2, 1, 10, "+91-9000089012"),
    ]

    facility_ids = []
    for f in facilities:
        last_verified = (now - timedelta(hours=random.randint(1, 48))).strftime("%Y-%m-%dT%H:%M:%S")
        cursor = await db.execute(
            "INSERT INTO facilities (name, type, location, distance_km, emergency_available, icu_beds, contact, last_verified) VALUES (?,?,?,?,?,?,?,?)",
            f + (last_verified,)
        )
        facility_ids.append(cursor.lastrowid)

    # ---- Emergency Cases ----
    priorities = ["EMERGENCY", "EMERGENCY", "URGENT", "URGENT", "ROUTINE"]
    statuses_ec = ["AMBULANCE_ASSIGNED", "EN_ROUTE", "ARRIVED", "TRANSFERRED", "CREATED", "ACKNOWLEDGED"]
    
    case_ids = []
    for i in range(5):
        pid = patient_ids[i]
        priority = priorities[i % len(priorities)]
        status = statuses_ec[i % len(statuses_ec)]
        created_mins_ago = random.randint(15, 180)
        created_at = (now - timedelta(minutes=created_mins_ago)).strftime("%Y-%m-%dT%H:%M:%S")
        case_ref = f"CL-{now.strftime('%Y%m%d')}-{1001 + i}"
        cursor = await db.execute(
            """INSERT INTO emergency_cases 
               (case_ref, patient_id, priority, status, pickup_location, destination, 
                blood_required, blood_group, blood_component, blood_units, notes, created_at, updated_at)
               VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)""",
            (case_ref, pid, priority, status,
             f"{random.choice(['MG Road', 'Koramangala', 'Indiranagar', 'Jayanagar', 'HSR Layout'])}, Bengaluru",
             random.choice(["Apollo Hospitals", "Narayana Health", "Bengaluru City Hospital"]),
             random.randint(0, 1), random.choice(["A+", "O+", "B-", "AB+"]),
             random.choice(["Whole Blood", "Packed RBC", "Platelets"]),
             random.randint(1, 3),
             "Demo emergency case — coordination data only",
             created_at, created_at)
        )
        case_ids.append(cursor.lastrowid)

        # Create initial timeline events
        await db.execute(
            "INSERT INTO case_events (case_id, event_type, description, actor, created_at) VALUES (?,?,?,?,?)",
            (case_ids[-1], "CASE_CREATED", f"Emergency case {case_ref} created. Priority: {priority}.", "Coordinator", created_at)
        )
        if status not in ["CREATED"]:
            ack_at = (now - timedelta(minutes=created_mins_ago - 2)).strftime("%Y-%m-%dT%H:%M:%S")
            await db.execute(
                "INSERT INTO case_events (case_id, event_type, description, actor, created_at) VALUES (?,?,?,?,?)",
                (case_ids[-1], "ACKNOWLEDGED", "Case acknowledged by coordination center.", "Dispatch", ack_at)
            )
        if status in ["AMBULANCE_ASSIGNED", "EN_ROUTE", "ARRIVED", "TRANSFERRED"]:
            req_at = (now - timedelta(minutes=created_mins_ago - 5)).strftime("%Y-%m-%dT%H:%M:%S")
            await db.execute(
                "INSERT INTO case_events (case_id, event_type, description, actor, created_at) VALUES (?,?,?,?,?)",
                (case_ids[-1], "AMBULANCE_REQUESTED", "Ambulance coordination initiated.", "Coordinator", req_at)
            )
        if status in ["EN_ROUTE", "ARRIVED", "TRANSFERRED"]:
            assign_at = (now - timedelta(minutes=created_mins_ago - 10)).strftime("%Y-%m-%dT%H:%M:%S")
            await db.execute(
                "INSERT INTO case_events (case_id, event_type, description, actor, created_at) VALUES (?,?,?,?,?)",
                (case_ids[-1], "AMBULANCE_ASSIGNED", "Ambulance unit assigned and confirmed.", "Dispatch", assign_at)
            )
        if status in ["ARRIVED", "TRANSFERRED"]:
            enroute_at = (now - timedelta(minutes=created_mins_ago - 20)).strftime("%Y-%m-%dT%H:%M:%S")
            await db.execute(
                "INSERT INTO case_events (case_id, event_type, description, actor, created_at) VALUES (?,?,?,?,?)",
                (case_ids[-1], "EN_ROUTE", "Ambulance en route to pickup location.", "Driver", enroute_at)
            )

    # ---- Ambulance Requests for seeded cases ----
    providers = ["MedAlert Ambulance", "LifeLine EMS", "City Emergency Services", "RapidCare Ambulance"]
    amb_types = ["Advanced Life Support", "Basic Life Support", "Critical Care Transport"]
    
    for i, cid in enumerate(case_ids[:4]):
        created_mins_ago = random.randint(10, 60)
        amb_status = ["ASSIGNED", "EN_ROUTE", "ARRIVED", "ASSIGNED"][i % 4]
        assigned_at = (now - timedelta(minutes=created_mins_ago)).strftime("%Y-%m-%dT%H:%M:%S")
        await db.execute(
            """INSERT INTO ambulance_requests 
               (case_id, provider, ambulance_type, vehicle_number, driver_name, driver_phone, 
                location, distance_km, status, requested_at, assigned_at, updated_at)
               VALUES (?,?,?,?,?,?,?,?,?,?,?,?)""",
            (cid, random.choice(providers), random.choice(amb_types),
             f"KA-{random.randint(10,99)}-EMS-{random.randint(1000,9999)}",
             random.choice(["Raju Kumar", "Mohan Das", "Suresh G", "Prakash T"]),
             f"+91-{random.randint(7000000000, 9999999999)}",
             f"{random.choice(['MG Road', 'Whitefield', 'Hebbal'])}, Bengaluru",
             round(random.uniform(1.5, 8.0), 1),
             amb_status, assigned_at, assigned_at, assigned_at)
        )

    # ---- Blood Requests for seeded cases ----
    for i, cid in enumerate(case_ids[:3]):
        b_status = ["CONFIRMED", "MATCH_FOUND", "SEARCHING"][i % 3]
        await db.execute(
            """INSERT INTO blood_requests (case_id, blood_group, component, units_required, source_id, status)
               VALUES (?,?,?,?,?,?)""",
            (cid, random.choice(["A+", "O+", "B-"]),
             random.choice(["Whole Blood", "Packed RBC"]),
             random.randint(1, 3),
             random.choice(blood_source_ids),
             b_status)
        )

    await db.commit()
