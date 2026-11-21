import DashboardIcon from '../../components/ui/DashboardIcon';
import { ADMIN_NAVIGATION } from './adminNavigation';

export default function AdminPageHeader({ module, title, description }) {
  const icon = ADMIN_NAVIGATION.find(([to]) => to === `/admin/${module}`)?.[2] || 'shield';
  return <header className="workspace-banner admin-page-header">
    <div className="admin-page-header__copy">
      <p className="member-kicker">ARDNET ADMINISTRATION</p>
      <h1>{title}</h1>
      <p>{description}</p>
    </div>
    <span className="admin-page-header__icon" aria-hidden="true"><DashboardIcon name={icon} size={30} /></span>
  </header>;
}
