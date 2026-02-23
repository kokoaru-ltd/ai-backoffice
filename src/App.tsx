import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Login } from './pages/Login'
import { Dashboard } from './pages/Dashboard'
import { Accounting } from './pages/Accounting'
import { HR } from './pages/HR'
import { CRM } from './pages/CRM'
import { Documents } from './pages/Documents'
import { General } from './pages/General'
import { AuditLog } from './pages/AuditLog'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Dashboard />} />
        <Route path="/accounting" element={<Accounting />} />
        <Route path="/hr" element={<HR />} />
        <Route path="/crm" element={<CRM />} />
        <Route path="/documents" element={<Documents />} />
        <Route path="/general" element={<General />} />
        <Route path="/audit" element={<AuditLog />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
