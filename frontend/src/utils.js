// Priority badge
export function priorityBadge(priority) {
  const map = {
    EMERGENCY: 'badge badge-red',
    URGENT: 'badge badge-amber',
    ROUTINE: 'badge badge-gray',
  };
  return map[priority] || 'badge badge-gray';
}

// Case status badge
export function caseStatusBadge(status) {
  const map = {
    CREATED: 'badge badge-gray',
    ACKNOWLEDGED: 'badge badge-blue',
    AMBULANCE_REQUESTED: 'badge badge-amber',
    AMBULANCE_ASSIGNED: 'badge badge-blue',
    EN_ROUTE: 'badge badge-amber',
    ARRIVED: 'badge badge-blue',
    TRANSFERRED: 'badge badge-purple',
    RECEIVED: 'badge badge-purple',
    CLOSED: 'badge badge-green',
  };
  return map[status] || 'badge badge-gray';
}

// Appointment status badge
export function apptStatusBadge(status) {
  const map = {
    BOOKED: 'badge badge-blue',
    'CHECKED-IN': 'badge badge-blue',
    WAITING: 'badge badge-amber',
    'IN-CONSULTATION': 'badge badge-purple',
    COMPLETED: 'badge badge-green',
    CANCELLED: 'badge badge-gray',
  };
  return map[status] || 'badge badge-gray';
}

// Ambulance status badge
export function ambStatusBadge(status) {
  const map = {
    REQUESTED: 'badge badge-amber',
    ASSIGNED: 'badge badge-blue',
    EN_ROUTE: 'badge badge-amber',
    ARRIVED: 'badge badge-blue',
    TRANSFERRED: 'badge badge-green',
    CANCELLED: 'badge badge-gray',
  };
  return map[status] || 'badge badge-gray';
}

// Blood status badge
export function bloodStatusBadge(status) {
  const map = {
    REQUESTED: 'badge badge-amber',
    SEARCHING: 'badge badge-blue',
    MATCH_FOUND: 'badge badge-blue',
    CONTACTED: 'badge badge-amber',
    CONFIRMED: 'badge badge-purple',
    FULFILLED: 'badge badge-green',
    CANCELLED: 'badge badge-gray',
  };
  return map[status] || 'badge badge-gray';
}

// Format duration
export function formatDuration(isoString) {
  if (!isoString) return '—';
  const diff = Date.now() - new Date(isoString + (isoString.includes('Z') ? '' : 'Z')).getTime();
  const mins = Math.max(0, Math.floor(diff / 60000));
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  const rem = mins % 60;
  return `${hrs}h ${rem}m`;
}

// Format timestamp
export function formatTime(iso) {
  if (!iso) return '—';
  const d = new Date(iso + (iso.includes('Z') ? '' : 'Z'));
  return d.toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true,
  });
}

// Format short time
export function formatShortTime(iso) {
  if (!iso) return '—';
  const d = new Date(iso + (iso.includes('Z') ? '' : 'Z'));
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
}

// Format date
export function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

// Truncate
export function truncate(str, n = 40) {
  if (!str) return '—';
  return str.length > n ? str.slice(0, n) + '…' : str;
}

// Case status label
export function caseStatusLabel(status) {
  const map = {
    CREATED: 'Created',
    ACKNOWLEDGED: 'Acknowledged',
    AMBULANCE_REQUESTED: 'Ambulance Requested',
    AMBULANCE_ASSIGNED: 'Ambulance Assigned',
    EN_ROUTE: 'En Route',
    ARRIVED: 'Arrived',
    TRANSFERRED: 'Transferred',
    RECEIVED: 'Received',
    CLOSED: 'Closed',
  };
  return map[status] || status;
}

// Next allowed statuses for a case
export function nextCaseStatuses(current) {
  const flow = {
    CREATED: ['ACKNOWLEDGED'],
    ACKNOWLEDGED: ['AMBULANCE_REQUESTED'],
    AMBULANCE_REQUESTED: ['AMBULANCE_ASSIGNED'],
    AMBULANCE_ASSIGNED: ['EN_ROUTE'],
    EN_ROUTE: ['ARRIVED'],
    ARRIVED: ['TRANSFERRED'],
    TRANSFERRED: ['RECEIVED'],
    RECEIVED: ['CLOSED'],
    CLOSED: [],
  };
  return flow[current] || [];
}

export function bloodFreshnessClass(freshness) {
  if (freshness === 'FRESH') return 'freshness-fresh';
  if (freshness === 'AGING') return 'freshness-aging';
  return 'freshness-stale';
}
