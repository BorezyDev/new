import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../../firebaseConfig';
import { useUser } from '../../Auth/UserContext';
import { useNavigate } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import UserHeader from '../../UserDashboard/UserHeader';
import UserSidebar from '../../UserDashboard/UserSidebar';
import '../Availability/Availability.css';
import search from '../../../assets/Search.png';
import { FaSearch, FaFilter, FaDownload, FaUpload, FaPlus, FaEdit, FaTrash, FaCopy } from 'react-icons/fa';

const CreditNoteDashboard = () => {
  const [creditNotes, setCreditNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const { userData } = useUser();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchField, setSearchField] = useState('');
  const [filteredCreditNotes, setFilteredCreditNotes] = useState([]);
  const navigate = useNavigate();

 const fetchCreditNotes = async () => {
  setLoading(true);
  try {
    if (userData?.branchCode) {
      const creditNotesRef = collection(db, `products/${userData.branchCode}/creditNotes`);
      const q = query(creditNotesRef);
      const querySnapshot = await getDocs(q);
      const notesData = querySnapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || null,
          expiryDate: doc.data().expiryDate?.toDate() || null,
        }))
        .sort((a, b) => b.createdAt - a.createdAt); // Sort by date (newest first)

      setCreditNotes(notesData);
      setFilteredCreditNotes(notesData);
    }
  } catch (error) {
    console.error('Error fetching credit notes:', error);
    toast.error('Error fetching credit notes');
  } finally {
    setLoading(false);
  }
};


  useEffect(() => {
    fetchCreditNotes();
  }, [userData?.branchCode]);

  const handleSearch = () => {
    const lowerCaseQuery = searchQuery.toLowerCase();
    const filtered = creditNotes.filter(note => {
      const searchFieldValue = String(note[searchField] || '').toLowerCase();
      return searchFieldValue.includes(lowerCaseQuery);
    });
    setFilteredCreditNotes(filtered);
  };

  useEffect(() => {
    handleSearch();
  }, [searchQuery, searchField, creditNotes]);

  const handleAddCreditNote = () => {
    navigate('/add-credit-note');
  };

  const handleEdit = (noteId) => {
    navigate(`/edit-credit-note/${noteId}`);
  };

  const handleDelete = async (noteId) => {
    const confirmDelete = window.confirm('Are you sure you want to delete this credit note?');
    if (!confirmDelete) return;

    try {
      await deleteDoc(doc(db, `products/${userData.branchCode}/creditNotes`, noteId));
      setCreditNotes(prevNotes => prevNotes.filter(note => note.id !== noteId));
      setFilteredCreditNotes(prevNotes => prevNotes.filter(note => note.id !== noteId));
      toast.success('Credit note deleted successfully');
    } catch (error) {
      console.error('Error deleting credit note:', error);
      toast.error('Error deleting credit note');
    }
  };

  return (
    <div className={`dashboard-container ${sidebarOpen ? 'sidebar-open' : ''}`}>
      <UserSidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      <div className="dashboard-content">
        <UserHeader onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        <h2 style={{ marginLeft: '10px', marginTop: '120px' }}>Credit Note Management</h2>

        <div className="toolbar-container">
          <div className="search-bar-container7">
            <img src={search} alt="search icon" className="search-icon7" />
            <select
              value={searchField}
              onChange={(e) => setSearchField(e.target.value)}
              className="search-dropdown7"
            >
              <option value="">Search By</option>
              <option value="Name">Name</option>
              <option value="mobileNumber">Mobile Number</option>
              <option value="amount">Amount</option>
              <option value="CreditUsed">Credit Used</option>
              <option value="Balance">Balance</option>
              <option value="status">Status</option>
             <option value="usedReceipts">Receipt Number</option>

              
            </select>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search..."
            />
          </div>
          <div className="action-buttons">
            <label className="add-product-button" onClick={handleAddCreditNote}>
              <FaPlus />
              Add Credit Note
            </label>
          </div>
        </div>

        <div className="booking-list">
          <div className="booking-table-container">
            {loading ? (
              <p>Loading credit notes...</p>
            ) : (
              <table className="booking-table">
                <thead>
                  <tr>
                    <th>Created At</th>
                    <th>Name</th>
                    <th>Mobile Number</th>
                    <th>Credit Amount</th>
                    <th>Credit Used</th>
                    <th>Balance</th>
                    <th>Receipts</th>
                    <th>Comment</th>
                    <th>Status</th>
                    <th>Created By</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCreditNotes.map(note => (
                    <tr key={note.id}>
                      <td>{note.createdAt?.toLocaleString() || 'N/A'}</td>
                      <td>{note.Name}</td>
                      <td>{note.mobileNumber}</td>
                      <td>{note.amount}</td>
                      <td>{note.CreditUsed}</td>
                      <td>{note.Balance}</td>
                      <td>
                        {note.usedReceipts && note.usedReceipts.length > 0 ? (
                          note.usedReceipts.map((receipt) => (
                            <div
                              key={receipt}
                              style={{
                                
                                
                                textDecoration: 'underline',
                                marginBottom: '4px'
                              }}
                              onClick={() => navigate(`/booking-details/${receipt}`, { state: { receiptNumber: receipt } })}
                            >
                              {receipt}
                            </div>
                          ))
                        ) : (
                          '—'
                        )}
                      </td>
                      <td>{note.Comment}</td>
                      <td>{note.status}</td>
                      <td>{note.createdBy}</td>
                      
                      <td>
                         <div className="action-buttons">
                        <label
                          onClick={() => handleEdit(note.id)}  
                        >
                          <FaEdit style={{ color: '#757575' , cursor: 'pointer'}} />
                        </label>
                         {userData?.role !== 'Subuser' && (
                        <label
                          onClick={() => handleDelete(note.id)}

                        >
                          <FaTrash style={{ color: '#757575' , cursor: 'pointer'}} />
                         
                        </label>
                         )}


                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
        <ToastContainer />
      </div>
    </div>
  );
};

export default CreditNoteDashboard;
