import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaSignOutAlt } from 'react-icons/fa'; // Import the logout icon
import './Sidebar.css'; // Import the CSS file for Sidebar

const Sidebar = ({ isOpen }) => {
  const location = useLocation();

  return (
    <div className={`sidebar ${isOpen ? 'open' : ''}`}>
      <nav>
        <ul>
          <li className="sidebar-greeting1">Welcome User,</li>
          <li className="sidebar-greeting">Leads</li>
          <li className={`sidebar-link ${location.pathname === '/leads' ? 'active' : ''}`}>
            <Link to="/leads">All Leads</Link>
          </li>
          <li className={`sidebar-link ${location.pathname === '/leads/fresh-leads' ? 'active' : ''}`}>
            <Link to="/leads/fresh-leads">Fresh Lead</Link>
          </li>
          <li className={`sidebar-link ${location.pathname === '/leads/detail-shared' ? 'active' : ''}`}>
            <Link to="/leads/detail-shared">Detail Shared</Link>
          </li>
          <li className={`sidebar-link ${location.pathname === '/leads/demo-scheduled' ? 'active' : ''}`}>
            <Link to="/leads/demo-scheduled">Demo Scheduled</Link>
          </li>
          <li className={`sidebar-link ${location.pathname === '/leads/demo-done' ? 'active' : ''}`}>
            <Link to="/leads/demo-done">Demo Done</Link>
          </li>
          <li className={`sidebar-link ${location.pathname === '/leads/lead-won' ? 'active' : ''}`}>
            <Link to="/leads/lead-won">Lead Won</Link>
          </li>
          <li className={`sidebar-link ${location.pathname === '/leads/lead-lost' ? 'active' : ''}`}>
            <Link to="/leads/lead-lost">Lead Lost</Link>
          </li>
          <li className="sidebar-greeting">Clients</li>
          <li className={`sidebar-link ${location.pathname === '/branches' ? 'active' : ''}`}>
            <Link to="/branches">Show All</Link>
          </li>
          <li className={`sidebar-link ${location.pathname === '/branches/active' ? 'active' : ''}`}>
            <Link to="/branches/active">Ongoing Subscriptions</Link>
          </li>
          <li className={`sidebar-link ${location.pathname === '/branches/deactive' ? 'active' : ''}`}>
            <Link to="/branches/deactive">Expired</Link>
          </li>
          <li className={`sidebar-link ${location.pathname === '/branches/expiring-soon' ? 'active' : ''}`}>
            <Link to="/branches/expiring-soon">Expiring Soon</Link>
          </li>
          {/* Logout Button */}
          <li className={`sidebar-link ${location.pathname === '/logout' ? 'active' : ''}`}>
            <Link to="/logout" style={{ display: 'flex', alignItems: 'center' }}>
              <FaSignOutAlt style={{ fontSize: '15px', color: '#757575', marginRight: '10px' }} /> Logout
            </Link>
          </li>
        </ul>
      </nav>
    </div>
  );
};

export default Sidebar;
