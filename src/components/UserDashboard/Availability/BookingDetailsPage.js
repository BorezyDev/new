import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, updateDoc, doc,arrayUnion } from 'firebase/firestore';
import { db } from '../../../firebaseConfig';
import './BookingDetailsPage.css';
import { useUser } from '../../Auth/UserContext';


const formatTimestamp = (timestamp) => {
  if (!timestamp) return 'N/A'; // Handle empty timestamp

  let date;
  if (timestamp.seconds) {
    // Firestore Timestamp format
    date = new Date(timestamp.seconds * 1000);
  } else {
    // Assume ISO string
    date = new Date(timestamp);
  }

  if (isNaN(date)) return 'Invalid Date'; // Fallback for invalid inputs
  return `${date.toLocaleDateString('en-US')} ${date.toLocaleTimeString('en-US')}`;
};


const BookingDetailsPage = () => {
  const { receiptNumber } = useParams();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate(); // Initialize navigate
  const { userData } = useUser(); // Access userData from the context

  // State for editing specific fields
  const [isEditingSecondPayment, setIsEditingSecondPayment] = useState(false);
  const [secondPaymentMode, setSecondPaymentMode] = useState('');
  const [secondPaymentDetails, setSecondPaymentDetails] = useState('');
  const[specialNote,setSpecialNote]= useState('');
  const[stage,setStage]= useState('');
  useEffect(() => {
    const fetchBookingAndProductDetails = async () => {
      try {
        const productsCollection = collection(db, 'products');
        const productsSnapshot = await getDocs(productsCollection);

        let allBookings = [];

        for (const productDoc of productsSnapshot.docs) {
          const bookingsCollection = collection(db, 'products', productDoc.id, 'bookings');
          const q = query(bookingsCollection, where('receiptNumber', '==', receiptNumber));
          const querySnapshot = await getDocs(q);

          querySnapshot.docs.forEach((bookingDoc) => {
            const bookingData = bookingDoc.data();
            allBookings.push({ 
              ...bookingData, 
              id: bookingDoc.id, 
              productId: productDoc.id,
              product: productDoc.data()
            });
          });
        }

        if (allBookings.length > 0) {
          const { userDetails } = allBookings[0]; // Assuming all bookings share the same user details
          setSecondPaymentMode(userDetails?.secondpaymentmode || '');
          setSecondPaymentDetails(userDetails?.secondpaymentdetails || '');
          setSpecialNote(userDetails?.specialnote|| '');
          setStage(userDetails?.stage||'');
        }

        setBookings(allBookings);
      } catch (error) {
        console.error('Error fetching booking or product details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBookingAndProductDetails();
  }, [receiptNumber]);

  const handleSaveSecondPayment = async () => {
    if (bookings.length === 0) return;
  
    const bookingId = bookings[0].id;
    const productId = bookings[0].productId;
    const bookingRef = doc(db, 'products', productId, 'bookings', bookingId);
  
    try {
      const currentDetails = bookings[0].userDetails || {};
      const changes = [];
  
      // Check for updates and log changes
      if (currentDetails.secondpaymentmode !== secondPaymentMode) {
        changes.push({
          field: 'Second Payment Mode',
          previous: currentDetails.secondpaymentmode || 'N/A',
          updated: secondPaymentMode,
          updatedby:userData.name,
        });
      }
  
      if (currentDetails.secondpaymentdetails !== secondPaymentDetails) {
        changes.push({
          field: 'Second Payment Details',
          previous: currentDetails.secondpaymentdetails || 'N/A',
          updated: secondPaymentDetails,
          updatedby:userData.name,
        });
      }
  
      if (currentDetails.specialnote !== specialNote) {
        changes.push({
          field: 'Special Note',
          previous: currentDetails.specialnote || 'N/A',
          updated: specialNote,
          updatedby:userData.name,
        });
      }
  
      if (currentDetails.stage !== stage) {
        changes.push({
          field: 'Stage',
          previous: currentDetails.stage || 'N/A',
          updated: stage,
          updatedby:userData.name,
        });
      }
  
      // Skip update if no changes
      if (changes.length === 0) {
        alert('No changes detected.');
        return;
      }
  
      // Create a detailed log entry
      const updateDetails = changes
  .map(
    (change) =>
      `${change.field} \n  updated from "${change.previous}" \n  to "${change.updated}" \n  by "${change.updatedby}"\n`
  )
  .join('\n\n'); // Add extra spacing between changes for readability

const newLogEntry = {
  action: `Updated:\n${updateDetails}`,
  timestamp: new Date().toISOString(),
  updates: changes,
};

  
      // Update Firestore document
      await updateDoc(bookingRef, {
        'userDetails.secondpaymentmode': secondPaymentMode,
        'userDetails.secondpaymentdetails': secondPaymentDetails,
        'userDetails.specialnote': specialNote,
        'userDetails.stage': stage,
        activityLog: arrayUnion(newLogEntry),
      });
  
      alert('Details Updated Successfully');
      setIsEditingSecondPayment(false);
    } catch (error) {
      console.error('Error updating second payment details:', error);
    }
  };
  
  if (loading) {
    return <p>Loading...</p>;
  }

  if (bookings.length === 0) {
    return <p>No booking data found for receipt number: {receiptNumber}</p>;
  }

  // Get user details from the first booking
  const userDetails = bookings[0].userDetails || {};  
  return (
    <>
      <div className="booking-details-container">
        {/* Activity Log Section at the Top Right */}
        <div className="activity-log-container">
    <h3>Activity Log</h3>
    {bookings.map((booking, index) => (
  <div key={index} className="activity-log">
    {booking.activityLog && booking.activityLog.length > 0 ? (
      <ul>
        {booking.activityLog.map((log, logIndex) => (
          <li key={logIndex}>
            <pre className="log-entry">
              {formatTimestamp(log.timestamp)}: {log.action}
            </pre>
          </li>
        ))}
      </ul>
    ) : (
      <p>No activity log available for this booking.</p>
    )}
  </div>
))}

  </div>

        {/* Main Content Section */}
        <div className="main-content">
        <button onClick={() => navigate('/usersidebar/clients')} type="button" className='can'>Back</button>

          <h2>Booking Details for Receipt Number: {receiptNumber}</h2>
          <div className="personal-info">
            <h2>Personal Details</h2>
            <div className="info-row">
              <p><strong>Name:</strong> {userDetails.name || 'N/A'}</p>
              <p><strong>Email:</strong> {userDetails.email || 'N/A'}</p>
            </div>
            <div className="info-row">
              <p><strong>Contact No:</strong> {userDetails.contact || 'N/A'}</p>
              <p><strong>Alternate Contact No:</strong> {userDetails.alternativecontactno || 'N/A'}</p>
            </div>
            <div className="info-row">
              <p><strong>Identity Proof:</strong> {userDetails.identityproof || 'N/A'}</p>
              <p><strong>Identity Number:</strong> {userDetails.identitynumber || 'N/A'}</p>
            </div>
            <div className="info-row">
              <p><strong>Source:</strong> {userDetails.source || 'N/A'}</p>
              <p><strong>Customer By:</strong> {userDetails.customerby || 'N/A'}</p>
            </div>
            <div className="info-row">
              <p><strong>Receipt By:</strong> {userDetails.receiptby || 'N/A'}</p>
            </div>
          </div>

          <div className="product-details-container">
            <h3>Product Details</h3>
            <table className="product-details-table">
              <thead>
                <tr>
                  <th>Sr. No.</th>
                  <th>Product Code</th>
                  <th>Product Name</th>
                  <th>Product Image</th>
                  <th>Quantity</th>
                  <th>Deposit</th>
                  <th>Rent</th>
                  <th>Total Deposit</th>
                  <th>Total Rent</th>
                  <th>Pickup Date</th>
                  <th>Return Date</th>
                  <th>Alteration</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((booking, index) => (
                  <tr key={index}>
                    <td>{index + 1}</td>
                    <td>{booking.product.productCode || 'N/A'}</td>
                    <td>{booking.product.productName || 'N/A'}</td>
                    <td>
                      {booking.product.imageUrls ? (
                        <img src={booking.product.imageUrls} alt="Product" style={{ width: '100px', height: 'auto' }} />
                      ) : 'N/A'}
                    </td>
                    <td>{booking.quantity || 'N/A'}</td>
                    <td>₹{booking.deposit || 'N/A'}</td>
                    <td>₹{booking.extraRent || 'N/A'}</td>
                    <td>₹{booking.deposit || 'N/A'}</td>
                    <td>₹{booking.price || 'N/A'}</td>
                    <td>{formatTimestamp(booking.pickupDate)}</td>
                    <td>{formatTimestamp(booking.returnDate)}</td>
                    <td>{userDetails.alterations || 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          

          <div className="payment-info">
            <h4>Payment Details</h4>
            <div className="info-row">
              <p><strong>Grand Total Rent:</strong> ₹{userDetails.grandTotalRent || 'N/A'}</p>
              <p><strong>Discount on Rent:</strong> ₹{userDetails.discountOnRent || 'N/A'}</p>
            </div>
            <div className="info-row">
              <p><strong>Final Rent:</strong> ₹{userDetails.finalrent || 'N/A'}</p>
              <p><strong>Grand Total Deposit:</strong> ₹{userDetails.grandTotalDeposit || 'N/A'}</p>
            </div>
            <div className="info-row">
              <p><strong>Discount on Deposit:</strong> ₹{userDetails.discountOnDeposit || 'N/A'}</p>
              <p><strong>Final Deposit:</strong> ₹{userDetails.finaldeposite || 'N/A'}</p>
            </div>
            <div className="info-row">
              <p><strong>Amount to be Paid:</strong> ₹{userDetails.totalamounttobepaid || 'N/A'}</p>
              <p><strong>Amount Paid:</strong> ₹{userDetails.amountpaid || 'N/A'}</p>
            </div>
            <div className="info-row">
              <p><strong>Balance:</strong> ₹{userDetails.balance || 'N/A'}</p>
              <p><strong>Payment Status:</strong> {userDetails.paymentstatus || 'N/A'}</p>
            </div>
            <div className="info-row">
              <p><strong>First Payment Details:</strong> ₹{userDetails.firstpaymentdtails || 'N/A'}</p>
              <p><strong>First Payment Mode:</strong> {userDetails.firstpaymentmode || 'N/A'}</p>
            </div>
            
          </div>

          <div className="client-type-container">
          <h5>Client Type</h5>
          {isEditingSecondPayment ? (
          <div>
            <div className="info-row">
              <label>
                <strong>Second Payment Mode:</strong>
                <input
                  type="text"
                  value={secondPaymentMode}
                  onChange={(e) => setSecondPaymentMode(e.target.value)}
                />
              </label>
            </div>
            <div className="info-row">
              <label>
                <strong>Second Payment Details:</strong>
                <input
                  type="text"
                  value={secondPaymentDetails}
                  onChange={(e) => setSecondPaymentDetails(e.target.value)}
                />
              </label>
            </div>
            <div className="info-row">
              <label>
                <strong>Special Note:</strong>
                <input
                  type="text"
                  value={specialNote}
                  onChange={(e) => setSpecialNote(e.target.value)}
                />
              </label>
            </div>
            <div className="info-row">
              <label>
                <strong>Stage:</strong>
                <select
                  type="text"
                  value={stage}
                  onChange={(e) => setStage(e.target.value)}
                >
                          <option value="Booking">Booking</option>
                          <option value="pickupPending">Pickup Pending</option>
                          <option value="pickup">Picked Up</option>
                          <option value="returnPending">Return Pending</option>
                          <option value="return">Returned</option>
                          <option value="successful">Successful</option>

                          <option value="cancelled">Cancelled</option>
                          <option value="postponed">Postponed</option>
                </select>
              </label>
            </div>
            <button className='button' onClick={handleSaveSecondPayment}>Save</button>
            <button className='button1' onClick={() => setIsEditingSecondPayment(false)}>Cancel</button>
          </div>
        ) : (
          <div>
            <div className="info-row">
              <p><strong>Second Payment Mode:</strong> {secondPaymentMode || 'N/A'}</p>
            </div>
            <div className="info-row">
              <p><strong>Second Payment Details:</strong> {secondPaymentDetails || 'N/A'}</p>
            </div>
            <div className="info-row">
              <p><strong>Special Note:</strong> {specialNote || 'N/A'}</p>
            </div>
            <div className="info-row">
              <p><strong>Stage</strong> {stage || 'N/A'}</p>
            </div>
            <button onClick={() => setIsEditingSecondPayment(true)}>Update</button>
          </div>
        )}
            


            
            
          </div>
        </div>
      </div>
    </>
  );
};

export default BookingDetailsPage