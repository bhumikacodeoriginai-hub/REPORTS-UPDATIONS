import { type ChangeEvent, type FormEvent, type ReactNode, useEffect, useMemo, useRef, useState } from 'react'
import {
  AlertCircle,
  ArrowRight,
  BriefcaseBusiness,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  CircleHelp,
  Clock3,
  Cloud,
  FileSpreadsheet,
  Filter,
  LockKeyhole,
  LogOut,
  Menu,
  Pencil,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  Upload,
  UserRound,
  UsersRound,
  X,
} from 'lucide-react'
import {
  ATTENDANCE_KEY,
  AttendanceRecord,
  AttendanceStatus,
  createEmptyRecords,
  DEPARTMENTS,
  EMPLOYEES,
  Employee,
  formatUpdatedTime,
  getDateLabel,
  getInitials,
  getStoragePhotos,
  getStorageRecords,
  getTodayInIndia,
  HR_EMAIL,
  HR_NAME,
  PHOTOS_KEY,
  STATUS_OPTIONS,
} from './data'

type Role = 'hr' | 'visitor'
type Toast = { message: string; type: 'success' | 'info' | 'error' } | null

const statusClass: Record<AttendanceStatus, string> = {
  Present: 'status-present',
  Absent: 'status-absent',
  'Work From Home': 'status-wfh',
  'First-Half Present': 'status-first-half',
  'Second-Half Present': 'status-second-half',
  'Not Updated': 'status-not-updated',
}

const statusShortLabel: Record<AttendanceStatus, string> = {
  Present: 'Present',
  Absent: 'Absent',
  'Work From Home': 'WFH',
  'First-Half Present': '1st Half',
  'Second-Half Present': '2nd Half',
  'Not Updated': 'Not updated',
}

function BrandLockup({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`brand-lockup ${compact ? 'brand-lockup-compact' : ''}`}>
      <span className="brand-symbol" aria-hidden="true">
        <span className="symbol-orbit orbit-one" />
        <span className="symbol-orbit orbit-two" />
        <span className="symbol-core">C</span>
      </span>
      <span className="brand-copy">
        <strong>Code Origin<span>.ai</span></strong>
        {!compact && <small>PRIVATE LIMITED</small>}
      </span>
    </div>
  )
}

function App() {
  const [role, setRole] = useState<Role | null>(() => (sessionStorage.getItem('coa-role') as Role) || null)
  const [date, setDate] = useState(getTodayInIndia())
  const [records, setRecords] = useState<Record<string, AttendanceRecord>>(() => getStorageRecords(getTodayInIndia()))
  const [photos, setPhotos] = useState<Record<string, string>>(getStoragePhotos)
  const [isEditing, setIsEditing] = useState(() => !Object.values(getStorageRecords(getTodayInIndia())).some((record) => record.status !== 'Not Updated'))
  const [isDirty, setIsDirty] = useState(false)
  const [search, setSearch] = useState('')
  const [department, setDepartment] = useState('All departments')
  const [statusFilter, setStatusFilter] = useState('All statuses')
  const [selected, setSelected] = useState<string[]>([])
  const [toast, setToast] = useState<Toast>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [showLogin, setShowLogin] = useState(false)

  const isHR = role === 'hr'
  const displayDate = getDateLabel(date)

  useEffect(() => {
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!isDirty || !isHR) return
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [isDirty, isHR])

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(null), 3600)
    return () => window.clearTimeout(timer)
  }, [toast])

  const filteredEmployees = useMemo(() => {
    const query = search.trim().toLowerCase()
    return EMPLOYEES.filter((employee) => {
      const matchesSearch = !query || [employee.name, employee.designation, employee.department].some((value) => value.toLowerCase().includes(query))
      const matchesDepartment = department === 'All departments' || employee.department === department
      const matchesStatus = statusFilter === 'All statuses' || records[employee.id]?.status === statusFilter
      return matchesSearch && matchesDepartment && matchesStatus
    })
  }, [department, records, search, statusFilter])

  const counts = useMemo(() => {
    const values = Object.values(records)
    return {
      total: EMPLOYEES.length,
      present: values.filter(({ status }) => status === 'Present').length,
      absent: values.filter(({ status }) => status === 'Absent').length,
      wfh: values.filter(({ status }) => status === 'Work From Home').length,
      halfDay: values.filter(({ status }) => status === 'First-Half Present' || status === 'Second-Half Present').length,
    }
  }, [records])

  const selectDate = (nextDate: string) => {
    if (isDirty && !window.confirm('You have unsaved changes. Switch dates without saving?')) return
    setDate(nextDate)
    setRecords(getStorageRecords(nextDate))
    setIsEditing(!Object.values(getStorageRecords(nextDate)).some((record) => record.status !== 'Not Updated'))
    setIsDirty(false)
    setSelected([])
  }

  const updateRecord = (employeeId: string, patch: Partial<AttendanceRecord>) => {
    if (!isHR || !isEditing) return
    setRecords((current) => ({
      ...current,
      [employeeId]: { ...current[employeeId], ...patch },
    }))
    setIsDirty(true)
  }

  const markEmployeesPresent = (ids: string[]) => {
    if (!isHR || !isEditing || ids.length === 0) return
    setRecords((current) => {
      const next = { ...current }
      ids.forEach((id) => { next[id] = { ...next[id], status: 'Present' } })
      return next
    })
    setIsDirty(true)
    setSelected([])
  }

  const markAllPresent = () => {
    if (!window.confirm(`Mark all ${EMPLOYEES.length} employees as Present for ${displayDate}?`)) return
    markEmployeesPresent(EMPLOYEES.map(({ id }) => id))
  }

  const saveAttendance = async () => {
    if (!isHR) return
    const now = new Date().toISOString()
    const nextRecords = Object.fromEntries(
      EMPLOYEES.map((employee) => {
        const record = records[employee.id]
        return [employee.id, { ...record, updatedAt: record.status === 'Not Updated' ? record.updatedAt : now, updatedBy: record.status === 'Not Updated' ? record.updatedBy : HR_NAME }]
      }),
    ) as Record<string, AttendanceRecord>
    localStorage.setItem(`${ATTENDANCE_KEY}:${date}`, JSON.stringify(nextRecords))
    setRecords(nextRecords)
    setIsDirty(false)
    setIsEditing(false)
    setToast({ message: 'Attendance saved successfully.', type: 'success' })

    try {
      await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date, updatedBy: HR_NAME, records: nextRecords }),
      })
    } catch {
      // Local persistence is the primary offline-ready data source until Sheets is configured.
    }
  }

  const startEditing = () => {
    if (!isHR) {
      setShowLogin(true)
      return
    }
    setIsEditing(true)
    setToast({ message: 'Editing enabled for this attendance date.', type: 'info' })
  }

  const uploadPhoto = (employeeId: string, event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !isHR) return
    if (!file.type.startsWith('image/')) {
      setToast({ message: 'Please choose an image file.', type: 'error' })
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      setToast({ message: 'Please choose an image under 2 MB.', type: 'error' })
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      const nextPhotos = { ...photos, [employeeId]: String(reader.result) }
      setPhotos(nextPhotos)
      localStorage.setItem(PHOTOS_KEY, JSON.stringify(nextPhotos))
      setToast({ message: 'Employee photograph updated.', type: 'success' })
    }
    reader.readAsDataURL(file)
  }

  const removePhoto = (employeeId: string) => {
    if (!isHR) return
    const nextPhotos = { ...photos }
    delete nextPhotos[employeeId]
    setPhotos(nextPhotos)
    localStorage.setItem(PHOTOS_KEY, JSON.stringify(nextPhotos))
    setToast({ message: 'Employee photograph removed.', type: 'success' })
  }

  const handleLogout = () => {
    if (isDirty && !window.confirm('You have unsaved changes. Log out without saving?')) return
    sessionStorage.removeItem('coa-role')
    setRole(null)
    setIsDirty(false)
  }

  const login = async (password: string) => {
    let authenticated = false
    try {
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: HR_EMAIL, password }),
      })
      authenticated = response.ok
    } catch {
      // The static preview keeps a clearly documented demo fallback until an auth API is deployed.
      authenticated = password === 'Origin@2026!'
    }
    if (!authenticated) return false
    sessionStorage.setItem('coa-role', 'hr')
    setRole('hr')
    setShowLogin(false)
    setToast({ message: 'Welcome back, Gagana.', type: 'success' })
    return true
  }

  if (!role && !showLogin) return <Welcome onLogin={() => setShowLogin(true)} onVisitor={() => { sessionStorage.setItem('coa-role', 'visitor'); setRole('visitor') }} />
  if (!role && showLogin) return <Login onBack={() => setShowLogin(false)} onLogin={login} />

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="topbar-inner">
          <button className="mobile-menu-button" aria-label="Toggle menu" onClick={() => setMobileMenuOpen((open) => !open)}><Menu size={20} /></button>
          <BrandLockup />
          <div className="topbar-divider" />
          <div className="page-context"><span className="eyebrow">People operations</span><strong>Employee attendance</strong></div>
          <div className="topbar-actions">
            <div className="header-date"><CalendarDays size={17} /><span>{displayDate}</span></div>
            <div className="header-user"><span className="header-avatar">GP</span><span><strong>{isHR ? HR_NAME : 'Visitor view'}</strong><small>{isHR ? 'HR administrator' : 'Read-only access'}</small></span></div>
            <button className="icon-button" aria-label="Log out" onClick={handleLogout}><LogOut size={18} /></button>
          </div>
        </div>
      </header>

      {mobileMenuOpen && <div className="mobile-drawer"><button onClick={() => { setDepartment('All departments'); setMobileMenuOpen(false) }}><UsersRound size={17} /> All employees</button><button onClick={() => { setStatusFilter('Not Updated'); setMobileMenuOpen(false) }}><Clock3 size={17} /> Needs update</button><button onClick={handleLogout}><LogOut size={17} /> Log out</button></div>}

      <main className="main-content">
        <section className="hero-row">
          <div><div className="section-kicker"><span className="live-dot" /> Attendance workspace</div><h1>Good morning, <em>{isHR ? 'Gagana' : 'team'}</em>.</h1><p>Keep today’s team presence accurate, visible and in sync.</p></div>
          <div className="hero-actions"><div className="timezone-chip"><Cloud size={15} /> Asia/Kolkata <span>·</span> {date === getTodayInIndia() ? 'Today' : 'Selected date'}</div>{isHR ? <button className="button button-primary" onClick={saveAttendance} disabled={!isDirty}><CheckCircle2 size={17} /> {isDirty ? 'Save attendance' : 'All changes saved'}</button> : <button className="button button-secondary" onClick={() => setShowLogin(true)}><LockKeyhole size={16} /> HR sign in</button>}</div>
        </section>

        <section className="summary-grid" aria-label="Attendance summary">
          <SummaryCard label="Total employees" value={counts.total} detail="Across 5 teams" icon={<UsersRound />} tone="gold" />
          <SummaryCard label="Present" value={counts.present} detail={counts.total ? `${Math.round((counts.present / counts.total) * 100)}% of team` : '0% of team'} icon={<Check />} tone="green" />
          <SummaryCard label="Absent" value={counts.absent} detail="Needs attention" icon={<X />} tone="red" />
          <SummaryCard label="Work from home" value={counts.wfh} detail="Remote today" icon={<Cloud />} tone="blue" />
          <SummaryCard label="Half day" value={counts.halfDay} detail="First or second half" icon={<Clock3 />} tone="purple" />
        </section>

        <section className="toolbar-card">
          <div className="toolbar-top"><div><h2>Daily roster</h2><p>{EMPLOYEES.length} people <span>·</span> {displayDate}</p></div><div className="toolbar-right"><div className="date-control"><CalendarDays size={16} /><label htmlFor="attendance-date">Date</label><input id="attendance-date" type="date" value={date} onChange={(event) => selectDate(event.target.value)} disabled={!isHR} /></div>{isHR && (isEditing ? <button className="button button-ghost button-edit" onClick={() => setIsEditing(false)}><Pencil size={15} /> Stop editing</button> : <button className="button button-ghost button-edit" onClick={startEditing}><Pencil size={15} /> Edit attendance</button>)}</div></div>
          <div className="filter-row"><div className="search-control"><Search size={17} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by name, role or team" aria-label="Search employees" /></div><div className="select-control"><Filter size={16} /><select value={department} onChange={(event) => setDepartment(event.target.value)} aria-label="Filter by department"><option>All departments</option>{DEPARTMENTS.map((item) => <option key={item}>{item}</option>)}</select><ChevronDown size={15} /></div><div className="select-control"><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} aria-label="Filter by status"><option>All statuses</option>{STATUS_OPTIONS.map((item) => <option key={item}>{item}</option>)}</select><ChevronDown size={15} /></div></div>
          {isHR && isEditing && <div className="bulk-row"><span>{selected.length ? `${selected.length} selected` : 'Quick actions'}</span><div><button className="text-button" disabled={!selected.length} onClick={() => markEmployeesPresent(selected)}><Check size={15} /> Mark selected present</button><button className="text-button text-button-gold" onClick={markAllPresent}><Sparkles size={15} /> Mark all present</button></div></div>}
        </section>

        <div className="legend-row"><div className="legend-note"><CircleHelp size={15} /><span><strong>Half day:</strong> First-Half Present means first half only. Second-Half Present means second half only.</span></div><span className="access-note"><ShieldCheck size={15} /> {isHR ? 'HR editing enabled' : 'Read-only visitor view'}</span></div>

        <section className="roster-section">{DEPARTMENTS.map((team) => { const teamEmployees = filteredEmployees.filter((employee) => employee.department === team); if (!teamEmployees.length) return null; return <DepartmentGroup key={team} department={team} employees={teamEmployees} records={records} photos={photos} isHR={isHR} isEditing={isEditing} selected={selected} onSelect={(id) => setSelected((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id])} onStatusChange={(id, status) => updateRecord(id, { status })} onRemarkChange={(id, remark) => updateRecord(id, { remark })} onUpload={(id, event) => uploadPhoto(id, event)} onRemovePhoto={removePhoto} /> })}</section>
        {!filteredEmployees.length && <div className="empty-state"><Search size={25} /><h3>No employees found</h3><p>Try a different name, department or status filter.</p><button className="button button-secondary" onClick={() => { setSearch(''); setDepartment('All departments'); setStatusFilter('All statuses') }}>Clear filters</button></div>}
      </main>
      {isHR && isEditing && <div className="mobile-save-bar"><div><strong>{isDirty ? 'Unsaved changes' : 'Ready to edit'}</strong><small>{isDirty ? 'Save before leaving this page' : 'Attendance is up to date'}</small></div><button className="button button-primary" onClick={saveAttendance} disabled={!isDirty}><CheckCircle2 size={17} /> Save</button></div>}
      {toast && <div className={`toast toast-${toast.type}`}><span className="toast-icon">{toast.type === 'success' ? <CheckCircle2 size={18} /> : toast.type === 'error' ? <AlertCircle size={18} /> : <CircleHelp size={18} />}</span>{toast.message}<button onClick={() => setToast(null)} aria-label="Dismiss"><X size={15} /></button></div>}
    </div>
  )
}

function SummaryCard({ label, value, detail, icon, tone }: { label: string; value: number; detail: string; icon: ReactNode; tone: string }) { return <article className="summary-card"><div className={`summary-icon tone-${tone}`}>{icon}</div><div><span>{label}</span><strong>{value}</strong><small>{detail}</small></div></article> }

function DepartmentGroup({ department, employees, records, photos, isHR, isEditing, selected, onSelect, onStatusChange, onRemarkChange, onUpload, onRemovePhoto }: { department: string; employees: Employee[]; records: Record<string, AttendanceRecord>; photos: Record<string, string>; isHR: boolean; isEditing: boolean; selected: string[]; onSelect: (id: string) => void; onStatusChange: (id: string, status: AttendanceStatus) => void; onRemarkChange: (id: string, remark: string) => void; onUpload: (id: string, event: ChangeEvent<HTMLInputElement>) => void; onRemovePhoto: (id: string) => void }) {
  return <section className="department-group"><div className="department-heading"><div className="department-icon"><BriefcaseBusiness size={17} /></div><div><h2>{department}</h2><span>{employees.length} {employees.length === 1 ? 'member' : 'members'}</span></div><div className="department-line" /></div><div className="employee-table"><div className="table-header"><span>Employee</span><span>Attendance status</span><span>Remark</span><span>Last updated</span></div>{employees.map((employee) => <EmployeeRow key={employee.id} employee={employee} record={records[employee.id]} photo={photos[employee.id]} isHR={isHR} isEditing={isEditing} checked={selected.includes(employee.id)} onSelect={() => onSelect(employee.id)} onStatusChange={(status) => onStatusChange(employee.id, status)} onRemarkChange={(remark) => onRemarkChange(employee.id, remark)} onUpload={(event) => onUpload(employee.id, event)} onRemovePhoto={() => onRemovePhoto(employee.id)} />)}</div></section>
}

function EmployeeRow({ employee, record, photo, isHR, isEditing, checked, onSelect, onStatusChange, onRemarkChange, onUpload, onRemovePhoto }: { employee: Employee; record: AttendanceRecord; photo?: string; isHR: boolean; isEditing: boolean; checked: boolean; onSelect: () => void; onStatusChange: (status: AttendanceStatus) => void; onRemarkChange: (remark: string) => void; onUpload: (event: ChangeEvent<HTMLInputElement>) => void; onRemovePhoto: () => void }) {
  const [photoMenuOpen, setPhotoMenuOpen] = useState(false)
  const uploadRef = useRef<HTMLInputElement>(null)
  return <article className={`employee-row ${checked ? 'employee-row-selected' : ''}`}>
    <div className="employee-identity">{isHR && isEditing && <input type="checkbox" className="employee-checkbox" checked={checked} onChange={onSelect} aria-label={`Select ${employee.name}`} />}<div className="avatar-wrap"><div className="employee-avatar">{photo ? <img src={photo} alt={`${employee.name}`} /> : <span>{getInitials(employee.name)}</span>}<i className={`avatar-status ${statusClass[record.status]}`} /></div>{isHR && <><button className="avatar-upload" onClick={() => setPhotoMenuOpen((open) => !open)} aria-label={`Upload photo for ${employee.name}`}><Plus size={11} /></button>{photoMenuOpen && <div className="photo-menu"><button onClick={() => uploadRef.current?.click()}><Upload size={14} /> {photo ? 'Replace photo' : 'Upload photo'}</button>{photo && <button onClick={() => { setPhotoMenuOpen(false); onRemovePhoto() }}>Remove photo</button>}</div>}<input ref={uploadRef} type="file" accept="image/*" hidden onChange={(event) => { setPhotoMenuOpen(false); onUpload(event) }} /></>}</div><div className="employee-details"><strong>{employee.name}</strong><span>{employee.designation}</span><small>{employee.department}</small></div></div>
    <div className="status-cell"><div className={`status-pill ${statusClass[record.status]}`}><span className="status-dot" />{record.status}</div>{isHR && isEditing && <select className="status-select" value={record.status} onChange={(event) => onStatusChange(event.target.value as AttendanceStatus)} aria-label={`Attendance for ${employee.name}`}>{STATUS_OPTIONS.map((status) => <option key={status} value={status}>{statusShortLabel[status]}</option>)}</select>}</div>
    <div className="remark-cell">{isHR && isEditing ? <input className="remark-input" value={record.remark} onChange={(event) => onRemarkChange(event.target.value)} placeholder="Add a short remark" maxLength={80} /> : <span className={record.remark ? '' : 'muted'}>{record.remark || '—'}</span>}</div>
    <div className="updated-cell"><Clock3 size={14} /><span>{formatUpdatedTime(record.updatedAt)}</span>{record.updatedBy && <small>by {record.updatedBy.split(' ')[0]}</small>}</div>
  </article>
}

function Welcome({ onLogin, onVisitor }: { onLogin: () => void; onVisitor: () => void }) { return <div className="auth-shell"><div className="auth-orb orb-left" /><div className="auth-orb orb-right" /><div className="auth-card welcome-card"><BrandLockup /><div className="auth-eyebrow"><Sparkles size={14} /> PEOPLE OPERATIONS</div><h1>Presence, <em>with purpose.</em></h1><p>One calm place to keep the Code Origin.ai team connected and accounted for.</p><div className="welcome-preview"><div className="mini-preview-head"><span>Today’s attendance</span><span className="mini-live"><i /> Live</span></div><div className="mini-bars"><i style={{ height: '86%' }} /><i style={{ height: '64%' }} /><i style={{ height: '73%' }} /><i style={{ height: '46%' }} /><i style={{ height: '91%' }} /><i style={{ height: '58%' }} /></div><div className="mini-preview-foot"><span><b /> Present</span><span><b className="blue" /> WFH</span><span><b className="gray" /> Pending</span></div></div><button className="button button-primary button-wide" onClick={onLogin}><LockKeyhole size={17} /> Sign in as HR <ArrowRight size={17} /></button><button className="button button-link" onClick={onVisitor}>Continue as read-only visitor <ArrowRight size={15} /></button><small className="secure-note"><ShieldCheck size={14} /> Secure workspace · Asia/Kolkata</small></div></div> }

function Login({ onBack, onLogin }: { onBack: () => void; onLogin: (password: string) => Promise<boolean> }) { const [password, setPassword] = useState(''); const [showPassword, setShowPassword] = useState(false); const [error, setError] = useState(''); const [isSubmitting, setIsSubmitting] = useState(false); const submit = async (event: FormEvent) => { event.preventDefault(); setIsSubmitting(true); const valid = await onLogin(password); setIsSubmitting(false); if (!valid) setError('That password does not match the HR workspace.'); }; return <div className="auth-shell"><div className="auth-orb orb-left" /><div className="auth-orb orb-right" /><div className="auth-card login-card"><button className="back-link" onClick={onBack}>← Back to workspace</button><BrandLockup /><div className="login-icon"><LockKeyhole size={21} /></div><div className="auth-eyebrow">HR ADMINISTRATOR</div><h1>Welcome back, <em>Gagana.</em></h1><p>Sign in to update today’s employee attendance.</p><form onSubmit={submit}><label>Email address<input value={HR_EMAIL} readOnly /></label><label>Password<div className="password-input"><input type={showPassword ? 'text' : 'password'} value={password} onChange={(event) => { setPassword(event.target.value); setError('') }} placeholder="Enter your password" autoFocus /><button type="button" onClick={() => setShowPassword((show) => !show)}>{showPassword ? 'Hide' : 'Show'}</button></div></label>{error && <div className="form-error"><AlertCircle size={15} /> {error}</div>}<button className="button button-primary button-wide" type="submit" disabled={isSubmitting}><ShieldCheck size={17} /> {isSubmitting ? 'Verifying…' : 'Sign in securely'}</button></form><div className="login-foot"><LockKeyhole size={14} /> HR access only <span>·</span> <button onClick={() => { setPassword('Origin@2026!'); setError('') }}>Use demo access</button></div></div></div> }

export default App
