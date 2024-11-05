import React, { useState, useEffect } from 'react';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { useNavigate, useLocation } from 'react-router-dom';
import Papa from 'papaparse';
import './Leads.css';

import Header from './Header';
import Sidebar from './Sidebar';
import RightSidebar from './RightSidebar';
import search from '../../assets/Search.png';

import { FaPlus, FaUpload , FaDownload, FaEdit, FaCopy} from 'react-icons/fa';

const Leads = () => {
  const [leads, setLeads] = useState([]);
  const [filteredLeads, setFilteredLeads] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchField, setSearchField] = useState('emailId');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [rightSidebarOpen, setRightSidebarOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [importedData, setImportedData] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  const handleBusinessNameClick = (lead) => {
    setSelectedLead(lead);
    setRightSidebarOpen(true);
  };

  const closeRightSidebar = () => {
    setRightSidebarOpen(false);
  };

  useEffect(() => {
    const fetchLeads = async () => {
      const leadsCollection = collection(db, 'leads');
      const leadSnapshot = await getDocs(leadsCollection);
      const leadList = leadSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setLeads(leadList);
    };

    fetchLeads();
  }, []);

  useEffect(() => {
    const path = location.pathname;
    const status = path.split('/').pop();

    const applyFilter = () => {
      let filtered = leads;

      if (status === 'demo-scheduled') {
        filtered = filtered.filter(lead => lead.status.toLowerCase() === 'demo scheduled');
      } else if (status === 'detail-shared') {
        filtered = filtered.filter(lead => lead.status.toLowerCase() === 'details shared');
      } else if (status === 'fresh-leads') {
        const currentDate = new Date();
        filtered = filtered.filter(lead => {
          const followupDate = new Date(lead.nextFollowup);
          return lead.status.toLowerCase() === 'fresh leads' && followupDate > currentDate;
        });
      } else if (status === 'demo-done') {
        filtered = filtered.filter(lead => lead.status.toLowerCase() === 'demo done');
      } else if (status === 'lead-won') {
        filtered = filtered.filter(lead => lead.status.toLowerCase() === 'lead won');
      } else if (status === 'lead-lost') {
        filtered = filtered.filter(lead => lead.status.toLowerCase() === 'lead lost');
      }

      filtered = filtered.filter(lead => {
        const lowerCaseQuery = searchQuery.toLowerCase();
        if (searchField === 'nextFollowup') {
          const queryDate = new Date(lowerCaseQuery).toDateString();
          const followupDate = new Date(lead.nextFollowup).toDateString();
          return queryDate === followupDate;
        } else {
          return lead[searchField]?.toLowerCase().includes(lowerCaseQuery);
        }
      });

      setFilteredLeads(filtered);
    };

    applyFilter();
  }, [leads, location, searchQuery, searchField]);

  const handleDelete = async (id) => {
    try {
      await deleteDoc(doc(db, 'leads', id));
      setLeads(leads.filter(lead => lead.id !== id));
    } catch (error) {
      console.error('Error deleting lead:', error);
    }
  };

  const handleEdit = (id) => {
    navigate(`/edit-lead/${id}`);
  };

  const handleSidebarToggle = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric', 
      hour: 'numeric', 
      minute: 'numeric' 
    });
  };

  const filterTitleMap = {
    'all': 'All Leads',
    'fresh-leads': 'Fresh Leads',
    'detail-shared': 'Detail Shared',
    'demo-scheduled': 'Demo Scheduled',
    'demo-done': 'Demo Done',
    'lead-won': 'Lead Won',
    'lead-lost': 'Lead Lost',
  };

  const exportToCSV = () => {
    const csv = Papa.unparse(filteredLeads);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', 'leads.csv');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleImport = (event) => {
    const file = event.target.files[0];
    if (file) {
      Papa.parse(file, {
        header: true,
        complete: (result) => {
          const importedLeads = result.data.map((row) => ({
            ...row,
            nextFollowup: new Date(row.nextFollowup).toISOString(),
          }));
          setImportedData(importedLeads);
          console.log(importedLeads);
        },
      });
    }
  };

  const handlecopy = (leads) => {
    // Destructure product details from the product object
    const {  businessName, contactNumber, emailId, location, source, status, nextFollowup } = leads;
      // Format the text for copying
      const formattedText = `
      Business Name: ${businessName || '-'}
      Mobile No: ${contactNumber || '-'}
      Email: ${emailId || '-'}
      Location: ${location || '-'}
      Source: ${source || '-'}
      Status: ${status || '-'}
      Follow up Date: ${nextFollowup || '-'}
      
    `;
  
    // Copy to clipboard
    navigator.clipboard.writeText(formattedText.trim());
  
    // Display a confirmation alert
    alert("Lead details copied to clipboard:\n" );
  };
  return (
    <div className={`dashboard-container ${sidebarOpen ? 'sidebar-open' : ''}`}>
      <Sidebar isOpen={sidebarOpen} onToggle={handleSidebarToggle} />
      <div className="dashboard-content">
        <Header onMenuClick={handleSidebarToggle} isSidebarOpen={sidebarOpen} />
        <h2 style={{ marginLeft: '10px', marginTop: '80px' }}>
          {filterTitleMap[location.pathname.split('/').pop()] || 'Total Leads'} ({filteredLeads.length})
        </h2>
        <div className="toolbar-container">
          <div className="search-bar-container7">
            <img src={search} alt="search icon" className="search-icon7" />
            <select
            
              value={searchField}
              onChange={(e) => setSearchField(e.target.value)}
              className="search-dropdown7"
            >
              
              <option value="businessName">Business Name</option>
              <option value="contactNumber">Contact Number</option>
              <option value="emailId">Email ID</option>
              <option value="location">Location</option>
              <option value="assignedTo">Assigned To</option>
              <option value="source">Source</option>
              <option value="status">Status</option>
              <option value="nextFollowup">Next Followup Date</option>
            </select>
            <input
              type="text"
              placeholder={`Search by ${searchField.replace(/([A-Z])/g, ' $1')}`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="action-buttons">
          <label className="export-button" onClick={exportToCSV}>
          <FaDownload />
              Export
              
            </label>
            <label htmlFor="import" className="import-button">
            <FaUpload />
              Import
              <input
                type="file"
                id="import"
                accept=".csv"
                onChange={handleImport}
                style={{ display: 'none' }}
              />
            </label>  
            <label className="add-product-button" onClick={() => navigate('/create-lead')}>
          <FaPlus />
              Add lead
            </label>
            </div>
        </div>

        <div className="table-container">
          <table className="table1">
            <thead>
              <tr>
                <th>Sr. No.</th>
                <th>Business Name</th>
                <th>Business Type</th>
                <th>Contact Number</th>
                <th>Email ID</th>
                <th>Location</th>
                <th>Assigned To</th>
                <th>Source</th>
                <th>Status</th>
                <th>Next Followup</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredLeads.map((lead, index) => (
                <tr key={lead.id}>
                  <td>{index + 1}</td>
                  <td className="business-name" onClick={() => handleBusinessNameClick(lead)} style={{ cursor: 'pointer' }}>{lead.businessName}</td>
                  <td>{lead.businessType}</td>
                  <td>{lead.contactNumber}</td>
                  <td>{lead.emailId}</td>
                  <td>{lead.location}</td>
                  <td>{lead.assignedTo}</td>
                  <td>{lead.source}</td>
                  <td>{lead.status}</td>
                  <td>{formatDate(lead.nextFollowup)}</td>
                  <td>
                  <div className="action-buttons">
                  <label onClick={() => handleEdit(lead.id)}><FaEdit style={{ color: '#757575', cursor: 'pointer' }}/></label>
                  <label onClick={() => handlecopy(lead)}><FaCopy style={{ color: '#757575', cursor: 'pointer' }} /> </label>  
                  </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <RightSidebar isOpen={rightSidebarOpen} onClose={closeRightSidebar} selectedLead={selectedLead} />
    </div>
  );
};

export default Leads;
