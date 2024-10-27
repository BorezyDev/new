import React from 'react';
import { Link, useLocation , useNavigate } from 'react-router-dom';
import './UseSidebar.css';
import { FaCalendarCheck, FaUsers, FaUser, FaPlusSquare, FaBoxOpen, FaRegFileAlt, FaMicrosoft, FaGift ,FaSignOutAlt  } from 'react-icons/fa';

 import { useUser } from '../Auth/UserContext'; // Import the context

const UserSidebar = ({ isOpen }) => {
  const location = useLocation();

  const navigate = useNavigate();
  const { userData } = useUser(); // Access userData from the context

  const handleLogout = () => {
    // Clear local storage and session storage
    localStorage.clear();
    sessionStorage.clear();

    // Redirect to login page
    navigate('/');
  };

  return (
    <div className={`sidebar ${isOpen ? 'open' : ''}`}>
      <nav>
        <ul>
          <li className="sidebar-greeting1">Welcome,</li>
          <li className="sidebar-greeting">{userData.name}</li>

          <li className={`sidebar-link ${location.pathname === '/usersidebar/billing' ? 'active' : ''}`}>
            <Link to="/usersidebar/billing" style={{ display: 'flex', alignItems: 'center' }}>
              <FaPlusSquare style={{ fontSize: '15px', color: '#757575', marginRight: '20px'}} />  Billing
            </Link>
          </li>

          <li className={`sidebar-link ${location.pathname === '/usersidebar/dashboard' ? 'active' : ''}`}>
            <Link to="/usersidebar/dashboard" style={{ display: 'flex', alignItems: 'center' }}>
              <FaMicrosoft style={{ fontSize: '15px', color: '#757575', marginRight: '20px' }} />  Dashboard
            </Link>
          </li>
          
          <li className={`sidebar-link ${location.pathname === '/usersidebar/availability' ? 'active' : ''}`}>
            <Link to="/usersidebar/availability" style={{ display: 'flex', alignItems: 'center' }}>
              <FaCalendarCheck style={{ fontSize: '15px', color: '#757575', marginRight: '20px' }} />  Availability
            </Link>
          </li>
          
          <li className={`sidebar-link ${location.pathname === '/usersidebar/leads' ? 'active' : ''}`}>
            <Link to="/usersidebar/leads"style={{ display: 'flex', alignItems: 'center' }}>
              <FaUsers style={{ fontSize: '15px', color: '#757575', marginRight: '20px'  }} /> Leads
            </Link>
          </li>
          
          <li className={`sidebar-link ${location.pathname === '/usersidebar/clients' ? 'active' : ''}`}>
            <Link to="/usersidebar/clients"style={{ display: 'flex', alignItems: 'center' }}>
              <FaUser style={{ fontSize: '15px', color: '#757575', marginRight: '20px' }} /> Clients
            </Link>
          </li>
          
          <li className={`sidebar-link ${location.pathname === '/addproduct' ? 'active' : ''}`}>
            <Link to="/productdashboard" style={{ display: 'flex', alignItems: 'center' }}>
              <FaGift style={{ fontSize: '15px', color: '#757575', marginRight: '20px' }} /> Product
            </Link>
          </li>
          
          <li className={`sidebar-link ${location.pathname === '/report' ? 'active' : ''}`}>
            <Link to="/report" style={{ display: 'flex', alignItems: 'center' }}>
              <FaRegFileAlt style={{ fontSize: '15px', color: '#757575', marginRight: '20px' }} /> Report
            </Link>
          </li>
          <li className="sidebar-link logout-button">
            < button Click={handleLogout} style={{ display: 'flex', alignItems: 'center' }}>
            <FaSignOutAlt style={{ fontSize: '15px', color: '#757575', marginRight: '20px' }} /> Logout
            </button>
          </li>

        </ul>
      </nav>
    </div>
  );
};

export default UserSidebar;




