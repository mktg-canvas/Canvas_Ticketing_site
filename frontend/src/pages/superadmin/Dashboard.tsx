import SuperAdminNav from '../../components/shared/SuperAdminNav'
import KanbanBoard from '../../components/shared/KanbanBoard'

export default function SuperAdminDashboard() {
  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg0)' }}>
      <SuperAdminNav />
      <KanbanBoard linkPrefix="/superadmin/tickets" />
    </div>
  )
}
