import { NavLink } from 'react-router-dom';
import './Sidebar.css';

const navItems = [
  { section: 'Overview' },
  { to: '/',          label: 'Dashboard',  icon: 'ti-layout-dashboard' },
  { section: 'Catalog' },
  { to: '/products',  label: 'Products',   icon: 'ti-package' },
  { to: '/categories',label: 'Categories', icon: 'ti-category' },
  { section: 'Sales' },
  { to: '/orders',    label: 'Orders',     icon: 'ti-shopping-cart' },
  { section: 'Reports' },
  { to: '/analytics', label: 'Analytics',  icon: 'ti-chart-bar' },
  { to: '/low-stock', label: 'Low Stock',  icon: 'ti-alert-triangle' },
];

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <span className="brand-name">StockTrack</span>
        <p className="brand-sub">Inventory System</p>
      </div>
      <nav className="sidebar-nav">
        {navItems.map((item, i) =>
          item.section ? (
            <span key={i} className="nav-section">{item.section}</span>
          ) : (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
            >
              <i className={`ti ${item.icon}`} aria-hidden="true" />
              {item.label}
            </NavLink>
          )
        )}
      </nav>
    </aside>
  );
}