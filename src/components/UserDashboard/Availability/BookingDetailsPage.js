import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, updateDoc, doc, arrayUnion, } from 'firebase/firestore';
import backIcon from '../../../assets/arrowiosback_111116.png';
import { db } from '../../../firebaseConfig';
import './BookingDetailsPage.css';
import { useUser } from '../../Auth/UserContext';
import { toast, ToastContainer } from 'react-toastify'; // Import react-toastify
import 'react-toastify/dist/ReactToastify.css'; // Import CSS for react-toastify
import { FaWhatsapp } from 'react-icons/fa';


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
  const [isEditingPersonalInfo, setIsEditingPersonalInfo] = useState(false);
  const [isEditingPayment, setIsEditingPayment] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [selectedContactNo, setSelectedContactNo] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);

  const [isEditingSecondPayment, setIsEditingSecondPayment] = useState(false);
  const [secondPaymentMode, setSecondPaymentMode] = useState('');
  const [secondPaymentDetails, setSecondPaymentDetails] = useState('');
  const [specialNote, setSpecialNote] = useState('');
  const [stage, setStage] = useState('');
  // Personal Info State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [contact, setContact] = useState('');
  const [alternativeContact, setAlternativeContact] = useState('');
  const [identityProof, setIdentityProof] = useState('');
  const [identityNumber, setIdentityNumber] = useState('');
  const [source, setSource] = useState('');
  const [customerBy, setCustomerBy] = useState('');
  const [receiptBy, setReceiptBy] = useState('');

  // Payment Details State
  const [grandTotalRent, setGrandTotalRent] = useState('');
  const [discountOnRent, setDiscountOnRent] = useState('');
  const [finalRent, setFinalRent] = useState('');
  const [grandTotalDeposit, setGrandTotalDeposit] = useState('');
  const [discountOnDeposit, setDiscountOnDeposit] = useState('');
  const [finalDeposit, setFinalDeposit] = useState('');
  const [amountToBePaid, setAmountToBePaid] = useState('');
  const [amountPaid, setAmountPaid] = useState('');
  const [balance, setBalance] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('');
  const [firstPaymentDetails, setFirstPaymentDetails] = useState('');
  const [firstPaymentMode, setFirstPaymentMode] = useState('');
  useEffect(() => {
    const fetchBookingAndProductDetails = async () => {
      setLoading(true);
      try {
        // Reference to the products collection within the user's branch
        const productsCollection = collection(db, `products/${userData.branchCode}/products`);
        const productsSnapshot = await getDocs(productsCollection);

        // Prepare batched queries for all bookings for each product in the branch
        const bookingPromises = productsSnapshot.docs.map((productDoc) => {
          const bookingsCollection = collection(
            db,
            `products/${userData.branchCode}/products/${productDoc.id}/bookings`
          );
          const q = query(bookingsCollection, where('receiptNumber', '==', receiptNumber));
          return getDocs(q).then((querySnapshot) => ({
            productId: productDoc.id,
            product: productDoc.data(),
            bookings: querySnapshot.docs.map((bookingDoc) => ({
              ...bookingDoc.data(),
              id: bookingDoc.id,
            })),
          }));
        });

        // Execute all booking queries in parallel
        const results = await Promise.all(bookingPromises);

        // Process bookings into a flat array
        const allBookings = results.flatMap((result) =>
          result.bookings.map((booking) => ({
            ...booking,
            productId: result.productId,
            product: result.product,
          }))
        );

        // Update states with fetched data from userDetails
        if (allBookings.length > 0) {
          const details = allBookings[0].userDetails || {}; // Assuming all bookings share the same user details
          setSecondPaymentMode(details.secondpaymentmode || '');
          setSecondPaymentDetails(details.secondpaymentdetails || '');
          setSpecialNote(details.specialnote || '');
          setStage(details.stage || '');
          setName(details.name || '');
          setEmail(details.email || '');
          setContact(details.contact || '');
          setAlternativeContact(details.alternativecontactno || '');
          setIdentityProof(details.identityproof || '');
          setIdentityNumber(details.identitynumber || '');
          setSource(details.source || '');
          setCustomerBy(details.customerby || '');
          setReceiptBy(details.receiptby || '');

          setGrandTotalRent(details.grandTotalRent || '');
          setDiscountOnRent(details.discountOnRent || '');
          setFinalRent(details.finalrent || '');
          setGrandTotalDeposit(details.grandTotalDeposit || '');
          setDiscountOnDeposit(details.discountOnDeposit || '');
          setFinalDeposit(details.finaldeposite || '');
          setAmountToBePaid(details.totalamounttobepaid || '');
          setAmountPaid(details.amountpaid || '');
          setBalance(details.balance || '');
          setPaymentStatus(details.paymentstatus || '');
          setFirstPaymentDetails(details.firstpaymentdtails || '');
          setFirstPaymentMode(details.firstpaymentmode || '');
        }

        setBookings(allBookings);
      } catch (error) {
        toast.error('Error fetching booking or product details:', error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchBookingAndProductDetails();
  }, [receiptNumber, userData.branchCode]); // Include userData.branchCode as a dependency


  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        if (!userData?.branchCode) return;

        const templatesCol = collection(db, `products/${userData.branchCode}/templates`);
        const templatesSnapshot = await getDocs(templatesCol);

        const templatesList = templatesSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setTemplates(templatesList);
      } catch (error) {
        console.error("Error fetching templates:", error);
        toast.error("Error fetching templates");
      }
    };

    fetchTemplates();
  }, [userData?.branchCode]);


  // Prevent background scrolling when modal is open
  useEffect(() => {
    document.body.style.overflow = isModalOpen ? "hidden" : "auto";
  }, [isModalOpen]);

  const handleSaveSecondPayment = async () => {
    if (bookings.length === 0) return;

    const bookingId = bookings[0].id;
    const productId = bookings[0].productId;
    const bookingRef = doc(db, `products/${userData.branchCode}/products/${productId}/bookings`, bookingId);

    try {
      const currentDetails = bookings[0].userDetails || {};
      const changes = [];

      // Check for updates and log changes
      if (currentDetails.secondpaymentmode !== secondPaymentMode) {
        changes.push({
          field: 'Second Payment Mode',
          previous: currentDetails.secondpaymentmode || 'N/A',
          updated: secondPaymentMode,
          updatedby: userData.name,
        });
      }

      if (currentDetails.secondpaymentdetails !== secondPaymentDetails) {
        changes.push({
          field: 'Second Payment Details',
          previous: currentDetails.secondpaymentdetails || 'N/A',
          updated: secondPaymentDetails,
          updatedby: userData.name,
        });
      }

      if (currentDetails.specialnote !== specialNote) {
        changes.push({
          field: 'Special Note',
          previous: currentDetails.specialnote || 'N/A',
          updated: specialNote,
          updatedby: userData.name,
        });
      }

      if (currentDetails.stage !== stage) {
        changes.push({
          field: 'Stage',
          previous: currentDetails.stage || 'N/A',
          updated: stage,
          updatedby: userData.name,
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
            `${change.field}   updated from "${change.previous}"   to "${change.updated}"   by "${change.updatedby}"\n`
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

      toast.success('Details Updated Successfully');
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

  const handleSavePersonalInfo = async () => {
    if (bookings.length === 0) return;

    const bookingId = bookings[0].id;
    const productId = bookings[0].productId;
    const bookingRef = doc(db, `products/${userData.branchCode}/products/${productId}/bookings`, bookingId);

    try {
      await updateDoc(bookingRef, {
        'userDetails.name': name,
        'userDetails.email': email,
        'userDetails.contact': contact,
        'userDetails.alternativecontactno': alternativeContact,
        'userDetails.identityproof': identityProof,
        'userDetails.identitynumber': identityNumber,
        'userDetails.source': source,
        'userDetails.customerby': customerBy,
        'userDetails.receiptby': receiptBy,
      });

      toast.success('Personal Info Updated Successfully');
      setIsEditingPersonalInfo(false);
    } catch (error) {
      toast.error('Error updating personal info:', error);
    }
  };

  const handleSavePaymentDetails = async () => {
    if (bookings.length === 0) return;

    const bookingId = bookings[0].id;
    const productId = bookings[0].productId;
    const bookingRef = doc(db, `products/${userData.branchCode}/products/${productId}/bookings`, bookingId);

    try {
      await updateDoc(bookingRef, {
        'userDetails.grandTotalRent': grandTotalRent,
        'userDetails.discountOnRent': discountOnRent,
        'userDetails.finalrent': finalRent,
        'userDetails.grandTotalDeposit': grandTotalDeposit,
        'userDetails.discountOnDeposit': discountOnDeposit,
        'userDetails.finaldeposite': finalDeposit,
        'userDetails.totalamounttobepaid': amountToBePaid,
        'userDetails.amountpaid': amountPaid,
        'userDetails.balance': balance,
        'userDetails.paymentstatus': paymentStatus,
        'userDetails.firstpaymentdtails': firstPaymentDetails,
        'userDetails.firstpaymentmode': firstPaymentMode,
      });

      toast.success('Payment Details Updated Successfully');
      setIsEditingPayment(false);
    } catch (error) {
      toast.error('Error updating payment details:', error);
    }
  };
  const handleContactNumberClick = () => {
    const contactNo = userDetails?.contact || '';
    setSelectedContactNo(contactNo);
    setIsModalOpen(true);
  };


  // Function to send WhatsApp message
  const sendWhatsAppMessage = (contactNo, message) => {
    if (!contactNo) {
      toast.error("No contact number provided!");
      return;
    }

    // Check if the contact number starts with +91 or not
    const formattedContactNo = contactNo.startsWith("+91")
      ? contactNo
      : `+91${contactNo}`;

    const whatsappURL = `https://api.whatsapp.com/send?phone=${formattedContactNo}&text=${encodeURIComponent(message)}`;
    window.open(whatsappURL, "_blank");
  };

  const formatDate = (date) => {
    return new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',

    }).format(date);
  };



  // Handle template click and send WhatsApp message
  const handleTemplateClick = (template) => {
    if (!bookings.length) return;

    const booking = bookings[0];
    const contactNo = booking?.userDetails?.contact || '';
    const createdAt = booking?.createdAt;
    const pickupDate = booking?.pickupDate;
    const returnDate = booking?.returnDate;

    const productsList = bookings.map((b) => ({
      productCode: b.product?.productCode || '',
      productName: b.product?.productName || '',
      quantity: b.quantity || '',
    }));

    const productsString = productsList
      .map((p) => `${p.productCode} : ${p.quantity}`)
      .join(', ');

    const productsString1 = productsList
      .map((p) => `${p.productName}`)
      .join(', ');

    const templateBody = template.body;

    const message = templateBody
      .replace('{clientName}', name || '')
      .replace('{clientEmail}', email || '')
      .replace('{CustomerBy}', customerBy || '')
      .replace('{ReceiptBy}', receiptBy || '')
      .replace('{Alterations}', '') // optional, you can add this to state if needed
      .replace('{SpecialNote}', specialNote || '')
      .replace('{GrandTotalRent}', grandTotalRent || '')
      .replace('{DiscountOnRent}', discountOnRent || '')
      .replace('{FinalRent}', finalRent || '')
      .replace('{GrandTotalDeposit}', grandTotalDeposit || '')
      .replace('{DiscountOnDeposit}', discountOnDeposit || '')
      .replace('{FinalDeposit}', finalDeposit || '')
      .replace('{AmountToBePaid}', amountToBePaid || '')
      .replace('{AmountPaid}', amountPaid || '')
      .replace('{Balance}', balance || '')
      .replace('{PaymentStatus}', paymentStatus || '')
      .replace('{FirstPaymentDetails}', firstPaymentDetails || '')
      .replace('{FirstPaymentMode}', firstPaymentMode || '')
      .replace('{SecondPaymentMode}', secondPaymentMode || '')
      .replace('{SecondPaymentDetails}', secondPaymentDetails || '')
      .replace('{Products}', productsString || '')
      .replace('{Products1}', productsString1 || '')
      .replace('{createdAt}', createdAt ? formatDate(createdAt.toDate()) : '')
      .replace('{pickupDate}', pickupDate ? formatDate(pickupDate.toDate()) : '')
      .replace('{returnDate}', returnDate ? formatDate(returnDate.toDate()) : '')
      .replace('{receiptNumber}', receiptNumber || '')
      .replace('{stage}', stage || '')
      .replace('{ContactNo}', contactNo || '')
      .replace('{IdentityProof}', identityProof || '')
      .replace('{IdentityNumber}', identityNumber || '');

    sendWhatsAppMessage(contactNo, message);
    setIsModalOpen(false);
  };


  // Handle contact number selection


  return (
    <>
      <div className="booking-details-container">
        {/* Activity Log Section at the Top Right */}
        <div className='vaisak' >
          <img
            src={backIcon}
            alt="button10"
            onClick={() => navigate("/usersidebar/clients")} // Navigate to the profile page
          />
        </div>

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
          <div
            style={{
              display: 'flex',
              alignItems: 'center',        // vertical alignment
              justifyContent: 'center',    // horizontal centering
              gap: '8px',                  // space between buttons
              // optional: full height to center vertically in viewport
            }}
          >
            <button onClick={() => window.print()} className="print-button">
              Print
            </button>
            <button
              onClick={(event) => {
                event.stopPropagation();
                handleContactNumberClick(); 
              }}
            >
              <FaWhatsapp />
            </button>
          </div>


          {/* Modal rendering */}
          {isModalOpen && (
            <>
              {/* Modal Background Overlay */}
              <div
                className="modal-overlay"
                onClick={() => setIsModalOpen(false)} // Close the modal when clicking on the overlay
              ></div>

              {/* Modal Popup */}
              <div
                className="modal-popup"
                onClick={(e) => e.stopPropagation()} // Prevent modal from closing on click inside the modal
              >
                <h3>Select a Template</h3>
                <ul className="template-list">
                  {templates.map((template) => (
                    <li
                      key={template.id}
                      onClick={() => handleTemplateClick(template)}
                      className="template-item"
                    >
                      {template.name}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => setIsModalOpen(false)}

                >
                  Close
                </button>
              </div>
            </>
          )}


          <h2>Booking Details for Receipt Number: {receiptNumber}</h2>
          <div className="personal-info">
            <h2>Personal Details</h2>
            {isEditingPersonalInfo ? (
              <>
                <div className="info-row">
                  <label><strong>Name:</strong></label>
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" />
                  <label><strong>Email:</strong></label>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
                </div>

                <div className="info-row">
                  <label><strong>Contact No:</strong></label>
                  <input type="text" value={contact} onChange={(e) => setContact(e.target.value)} placeholder="Contact No" />
                  <label><strong>Alternate Contact No:</strong></label>
                  <input type="text" value={alternativeContact} onChange={(e) => setAlternativeContact(e.target.value)} placeholder="Alternate Contact No" />
                </div>

                <div className="info-row">
                  <label><strong>Identity Proof:</strong></label>
                  <input type="text" value={identityProof} onChange={(e) => setIdentityProof(e.target.value)} placeholder="Identity Proof" />
                  <label><strong>Identity Number:</strong></label>
                  <input type="text" value={identityNumber} onChange={(e) => setIdentityNumber(e.target.value)} placeholder="Identity Number" />
                </div>

                <div className="info-row">
                  <label><strong>Source:</strong></label>
                  <input type="text" value={source} onChange={(e) => setSource(e.target.value)} placeholder="Source" />
                  <label><strong>Customer By:</strong></label>
                  <input type="text" value={customerBy} onChange={(e) => setCustomerBy(e.target.value)} placeholder="Customer By" />
                </div>

                <div className="info-row">
                  <label><strong>Receipt By:</strong></label>
                  <input type="text" value={receiptBy} onChange={(e) => setReceiptBy(e.target.value)} placeholder="Receipt By" />
                </div>

                {userData?.role !== 'Subuser' && (

                  <button onClick={handleSavePersonalInfo} className="save-button">Save</button>
                )}
                <button onClick={() => setIsEditingPersonalInfo(false)} >Cancel</button>


              </>
            ) : (
              <>
                <div className="info-row">
                  <p><strong>Name:</strong> {name || 'N/A'}</p>
                  <p><strong>Email:</strong> {email}</p>
                </div>
                <div className="info-row">
                  <p><strong>Contact No:</strong> {contact || 'N/A'}</p>
                  <p><strong>Alternate Contact No:</strong> {alternativeContact || 'N/A'}</p>
                </div>
                <div className="info-row">
                  <p><strong>Identity Proof:</strong> {identityProof || 'N/A'}</p>
                  <p><strong>Identity Number:</strong> {identityNumber || 'N/A'}</p>
                </div>
                <div className="info-row">
                  <p><strong>Source:</strong> {source || 'N/A'}</p>
                  <p><strong>Customer By:</strong> {customerBy || 'N/A'}</p>
                </div>
                <div className="info-row">
                  <p><strong>Receipt By:</strong> {receiptBy || 'N/A'}</p>
                </div>
                {userData?.role !== 'Subuser' && (

                  <button onClick={() => setIsEditingPersonalInfo(true)} className="edit-button">Edit</button>
                )}

              </>
            )}

          </div>

          <div className="product-details-container">
            <h2>Product Details</h2>
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
                  <th> Extra Rent</th>
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
                    <td>₹{booking.price || 'N/A'}</td>
                    <td>₹{booking.extraRent || 'N/A'}</td>
                    <td>{formatTimestamp(booking.pickupDate)}</td>
                    <td>{formatTimestamp(booking.returnDate)}</td>
                    <td>{userDetails.alterations || 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>


          <div className="payment-info">
            <h2>Payment Details</h2>
            {isEditingPayment ? (
              <>
                <div className="info-row">
                  <label><strong>Grand Total Rent:</strong></label>
                  <input type="text" value={grandTotalRent} onChange={(e) => setGrandTotalRent(e.target.value)} placeholder="Grand Total Rent" />
                  <label><strong>Discount on Rent:</strong></label>
                  <input type="text" value={discountOnRent} onChange={(e) => setDiscountOnRent(e.target.value)} placeholder="Discount on Rent" />
                </div>

                <div className="info-row">
                  <label><strong>Final Rent:</strong></label>
                  <input type="text" value={finalRent} onChange={(e) => setFinalRent(e.target.value)} placeholder="Final Rent" />
                  <label><strong>Grand Total Deposit:</strong></label>
                  <input type="text" value={grandTotalDeposit} onChange={(e) => setGrandTotalDeposit(e.target.value)} placeholder="Grand Total Deposit" />
                </div>

                <div className="info-row">
                  <label><strong>Discount on Deposit:</strong></label>
                  <input type="text" value={discountOnDeposit} onChange={(e) => setDiscountOnDeposit(e.target.value)} placeholder="Discount on Deposit" />
                  <label><strong>Final Deposit:</strong></label>
                  <input type="text" value={finalDeposit} onChange={(e) => setFinalDeposit(e.target.value)} placeholder="Final Deposit" />
                </div>

                <div className="info-row">
                  <label><strong>Amount to be Paid:</strong></label>
                  <input type="text" value={amountToBePaid} onChange={(e) => setAmountToBePaid(e.target.value)} placeholder="Amount to be Paid" />
                  <label><strong>Amount Paid:</strong></label>
                  <input type="text" value={amountPaid} onChange={(e) => setAmountPaid(e.target.value)} placeholder="Amount Paid" />
                </div>

                <div className="info-row">
                  <label><strong>Balance:</strong></label>
                  <input type="text" value={balance} onChange={(e) => setBalance(e.target.value)} placeholder="Balance" />
                  <label><strong>Payment Status:</strong></label>
                  <input type="text" value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value)} placeholder="Payment Status" />
                </div>

                <div className="info-row">
                  <label><strong>First Payment Details:</strong></label>
                  <input type="text" value={firstPaymentDetails} onChange={(e) => setFirstPaymentDetails(e.target.value)} placeholder="First Payment Details" />
                  <label><strong>First Payment Mode:</strong></label>
                  <input type="text" value={firstPaymentMode} onChange={(e) => setFirstPaymentMode(e.target.value)} placeholder="First Payment Mode" />
                </div>
                <button onClick={handleSavePaymentDetails} className="save-button">Save </button>
                <button onClick={() => setIsEditingPayment(false)}>Cancel</button>
              </>
            ) : (
              <>
                <div className="info-row">
                  <p><strong>Grand Total Rent:</strong> ₹{userDetails.grandTotalRent || 'N/A'}</p>
                  <p><strong>Discount on Rent:</strong> ₹{userDetails.discountOnRent || 'N/A'}</p>
                </div>
                <div className="info-row">
                  <p><strong>Final Rent:</strong> ₹{userDetails.finalrent || 'N/A'}</p>
                  <p><strong>Grand Total Deposit:</strong> ₹{userDetails.grandTotalDeposit || 'N/A'}</p>

                </div>
                 <div className="info-row">
                  <p><strong>Credit Amount:</strong> ₹{userDetails.creditNoteAmountAppliedToRent || 'N/A'}</p>

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
                {userData?.role !== 'Subuser' && (

                  <button onClick={() => setIsEditingPayment(true)}>Edit</button>
                )}

              </>
            )}

          </div>

          <div className="client-type-container">
            <h2>Client Type</h2>
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
      <ToastContainer />
    </>
  );
};

export default BookingDetailsPage