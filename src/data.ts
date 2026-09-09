export type Department =
  | 'Human Resources'
  | 'Project Management'
  | 'Research and Development Team'
  | 'Software Testing Team'
  | 'Civil Engineering Team'

export type AttendanceStatus =
  | 'Present'
  | 'Absent'
  | 'Work From Home'
  | 'First-Half Present'
  | 'Second-Half Present'
  | 'Not Updated'

export type Employee = {
  id: string
  name: string
  designation: string
  department: Department
}

export type AttendanceRecord = {
  status: AttendanceStatus
  remark: string
  updatedAt: string
  updatedBy: string
}

export const DEPARTMENTS: Department[] = [
  'Human Resources',
  'Project Management',
  'Research and Development Team',
  'Software Testing Team',
  'Civil Engineering Team',
]

export const STATUS_OPTIONS: AttendanceStatus[] = [
  'Present',
  'Absent',
  'Work From Home',
  'First-Half Present',
  'Second-Half Present',
  'Not Updated',
]

export const EMPLOYEES: Employee[] = [
  { id: 'gagana-priya-n', name: 'Gagana Priya N', designation: 'HR', department: 'Human Resources' },
  { id: 'varshini-cm', name: 'Varshini C.M.', designation: 'Project Manager', department: 'Project Management' },
  { id: 'vrushank-s-k', name: 'Vrushank S K', designation: 'Front-End Team Lead', department: 'Research and Development Team' },
  { id: 'amogha-varshini', name: 'Amogha Varshini', designation: 'Project Team Lead', department: 'Research and Development Team' },
  { id: 'ayisha-siddiuq', name: 'Ayisha Siddiuq', designation: 'Project Team Lead', department: 'Research and Development Team' },
  { id: 'abhishek-g', name: 'Abhishek G', designation: 'UI Designer', department: 'Research and Development Team' },
  { id: 'nagarjuna-t', name: 'Nagarjuna T', designation: 'Junior Software Engineer', department: 'Research and Development Team' },
  { id: 'bhoomika-c', name: 'Bhoomika C', designation: 'Junior Software Engineer', department: 'Research and Development Team' },
  { id: 'bhaskar-vb', name: 'Bhaskar V B', designation: 'Junior Software Engineer', department: 'Research and Development Team' },
  { id: 'shreyas-b-acharya', name: 'Shreyas B Acharya', designation: 'Junior Software Engineer', department: 'Research and Development Team' },
  { id: 'pruthvi-raj-r', name: 'Pruthvi Raj R', designation: 'Junior Software Engineer', department: 'Research and Development Team' },
  { id: 'vinaya-s-n', name: 'Vinaya S N', designation: 'Junior Software Engineer', department: 'Research and Development Team' },
  { id: 'anjum-kouseer', name: 'Anjum Kouseer', designation: 'Junior Software Engineer', department: 'Research and Development Team' },
  { id: 'naveen-v', name: 'Naveen V', designation: 'Junior Software Engineer', department: 'Research and Development Team' },
  { id: 'sumanth-r-k', name: 'Sumanth R K', designation: 'Junior Software Engineer', department: 'Research and Development Team' },
  { id: 'vidhaya-shree-n', name: 'Vidhaya Shree N', designation: 'Junior Software Engineer', department: 'Research and Development Team' },
  { id: 'deepthi-gujjur-s', name: 'Deepthi Gujjur S', designation: 'Junior Software Engineer', department: 'Research and Development Team' },
  { id: 'nanditha-d-s', name: 'Nanditha D S', designation: 'Junior Software Engineer', department: 'Research and Development Team' },
  { id: 'sayish-b', name: 'Sayish B', designation: 'Junior Software Engineer', department: 'Research and Development Team' },
  { id: 'srivatsa-p-s', name: 'Srivatsa P S', designation: 'Junior Software Engineer', department: 'Research and Development Team' },
  { id: 'sukruth-j-r', name: 'Sukruth J R', designation: 'QA Team Lead', department: 'Software Testing Team' },
  { id: 'amulya-chandra', name: 'Amulya Chandra', designation: 'Junior QA Analyst', department: 'Software Testing Team' },
  { id: 'azeema-shariff', name: 'Azeema Shariff', designation: 'Junior QA Analyst', department: 'Software Testing Team' },
  { id: 'ahalya-s', name: 'Ahalya S', designation: 'Junior QA Analyst', department: 'Software Testing Team' },
  { id: 'harsha-vardhan-kp', name: 'Harsha Vardhan K P', designation: 'Junior QA Analyst', department: 'Software Testing Team' },
  { id: 'mohammed-sibghat-ulla', name: 'Mohammed Sibghat Ulla', designation: 'Civil Engineer', department: 'Civil Engineering Team' },
]

export const HR_NAME = 'Gagana Priya N'
export const HR_EMAIL = 'gagana@codeoriginai.com'
export const ATTENDANCE_KEY = 'code-origin-attendance-v1'
export const PHOTOS_KEY = 'code-origin-photos-v1'

export const getInitials = (name: string) =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()

export const getTodayInIndia = () =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())

export const getDateLabel = (date: string) =>
  new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(`${date}T00:00:00+05:30`))

export const createEmptyRecords = (): Record<string, AttendanceRecord> =>
  Object.fromEntries(
    EMPLOYEES.map((employee) => [
      employee.id,
      { status: 'Not Updated', remark: '', updatedAt: '', updatedBy: '' },
    ]),
  )

export const getStorageRecords = (date: string): Record<string, AttendanceRecord> => {
  try {
    const stored = localStorage.getItem(`${ATTENDANCE_KEY}:${date}`)
    if (!stored) return createEmptyRecords()
    return { ...createEmptyRecords(), ...JSON.parse(stored) }
  } catch {
    return createEmptyRecords()
  }
}

export const getStoragePhotos = (): Record<string, string> => {
  try {
    return JSON.parse(localStorage.getItem(PHOTOS_KEY) ?? '{}')
  } catch {
    return {}
  }
}

export const formatUpdatedTime = (value: string) => {
  if (!value) return 'Not updated'
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value))
}
