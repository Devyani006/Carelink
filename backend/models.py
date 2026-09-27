from pydantic import BaseModel
from typing import Optional
from datetime import datetime


# ─── Patients ──────────────────────────────────────────────────────────────────

class PatientCreate(BaseModel):
    full_name: str
    age: Optional[int] = None
    gender: Optional[str] = None
    blood_group: Optional[str] = None
    phone: Optional[str] = None
    emergency_contact: Optional[str] = None
    address: Optional[str] = None


class PatientUpdate(BaseModel):
    full_name: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    blood_group: Optional[str] = None
    phone: Optional[str] = None
    emergency_contact: Optional[str] = None
    address: Optional[str] = None


# ─── Appointments ──────────────────────────────────────────────────────────────

class AppointmentCreate(BaseModel):
    patient_id: int
    doctor: Optional[str] = None
    department: Optional[str] = None
    date: str
    time: str
    reason: Optional[str] = None
    notes: Optional[str] = None
    status: Optional[str] = "BOOKED"


class AppointmentStatusUpdate(BaseModel):
    status: str


# ─── Emergency Cases ───────────────────────────────────────────────────────────

class EmergencyCaseCreate(BaseModel):
    patient_id: int
    priority: Optional[str] = "URGENT"
    pickup_location: Optional[str] = None
    destination: Optional[str] = None
    blood_required: Optional[bool] = False
    blood_group: Optional[str] = None
    blood_component: Optional[str] = None
    blood_units: Optional[int] = 0
    notes: Optional[str] = None


class EmergencyCaseStatusUpdate(BaseModel):
    status: str
    notes: Optional[str] = None
    actor: Optional[str] = "Coordinator"


# ─── Ambulance ─────────────────────────────────────────────────────────────────

class AmbulanceRequest(BaseModel):
    case_id: int
    provider: Optional[str] = None
    ambulance_type: Optional[str] = None
    vehicle_number: Optional[str] = None
    driver_name: Optional[str] = None
    driver_phone: Optional[str] = None
    location: Optional[str] = None
    distance_km: Optional[float] = None


class AmbulanceStatusUpdate(BaseModel):
    status: str
    actor: Optional[str] = "Coordinator"


# ─── Blood ─────────────────────────────────────────────────────────────────────

class BloodRequestCreate(BaseModel):
    case_id: int
    blood_group: str
    component: str
    units_required: int
    notes: Optional[str] = None


class BloodRequestStatusUpdate(BaseModel):
    status: str
    source_id: Optional[int] = None
    actor: Optional[str] = "Coordinator"


# ─── Facilities ────────────────────────────────────────────────────────────────

class FacilityContactRequest(BaseModel):
    case_id: int
    facility_id: int
    actor: Optional[str] = "Coordinator"


class FacilityStatusUpdate(BaseModel):
    case_id: int
    status: str
    actor: Optional[str] = "Coordinator"


# ─── Case Events ───────────────────────────────────────────────────────────────

class CaseEventCreate(BaseModel):
    case_id: int
    event_type: str
    description: str
    actor: Optional[str] = "Coordinator"
    metadata: Optional[str] = None
