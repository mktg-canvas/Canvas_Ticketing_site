import AdminNav from '../../components/shared/AdminNav'
import KanbanBoard from '../../components/shared/KanbanBoard'

export default function SuperAdminDashboard() {
  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg0)' }}>
      <AdminNav />
      <KanbanBoard linkPrefix="/admin/tickets" />
    </div>
  )
}
