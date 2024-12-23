
import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where, orderBy, updateDoc, doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../../firebaseConfig';
import { useNavigate } from 'react-router-dom';
import UserHeader from '../../UserDashboard/UserHeader';
import UserSidebar from '../../UserDashboard/UserSidebar';
import { useUser } from '../../Auth/UserContext';
import search from '../../../assets/Search.png';
import { FaSearch, FaDownload, FaUpload, FaPlus, FaEdit, FaTrash, FaCopy, FaWhatsapp } from 'react-icons/fa';
import Papa from 'papaparse';
import './Availability.css'; // Create CSS for styling
import { format } from 'date-fns';
import { Label } from 'recharts';
import { toast, ToastContainer } from 'react-toastify'; // Import react-toastify
import 'react-toastify/dist/ReactToastify.css'; // Import CSS for react-toastify



const BookingDashboard = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReceiptNumber, setSelectedReceiptNumber] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBooking, setSelectedBooking] = useState(null);

  const [filteredBookings, setFilteredBookings] = useState(bookings);


  const [searchField, setSearchField] = useState('');
  const [importedData, setImportedData] = useState(null);

  const navigate = useNavigate();
  const [stageFilter, setStageFilter] = useState('all'); // New state for filtering by stage
  const { userData } = useUser();
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [selectedContactNo, setSelectedContactNo] = useState(null);

  const handleBookingClick = (booking) => {
    setSelectedReceiptNumber(booking.receiptNumber);
    navigate(`/booking-details/${booking.receiptNumber}`, { state: { booking } });
  };



  useEffect(() => {
    const fetchAllBookingsWithUserDetails = async () => {
      setLoading(true); // Start loading
      try {
        const todayDateStr = new Date().toDateString(); // Get today's date as a string
        const q = query(
          collection(db, 'products'),
          where('branchCode', '==', userData.branchCode)
        );
        const productsSnapshot = await getDocs(q);

        let allBookings = [];

        for (const productDoc of productsSnapshot.docs) {
          const productCode = productDoc.data().productCode;
          const bookingsRef = collection(productDoc.ref, 'bookings');
          const bookingsQuery = query(bookingsRef, orderBy('pickupDate', 'asc'));
          const bookingsSnapshot = await getDocs(bookingsQuery);

          for (const docSnapshot of bookingsSnapshot.docs) {
            const bookingData = docSnapshot.data();
            const {
              bookingId,
              receiptNumber,
              pickupDate,
              returnDate,
              quantity,
              userDetails,
              createdAt,
            } = bookingData;

            const pickupDateStr =
              pickupDate && typeof pickupDate.toDate === 'function'
                ? pickupDate.toDate().toDateString()
                : new Date(pickupDate).toDateString();
            const returnDateStr =
              returnDate && typeof returnDate.toDate === 'function'
                ? returnDate.toDate().toDateString()
                : new Date(returnDate).toDateString();

            // Check if pickupDate matches today's date and if stage needs to be updated
            if (pickupDateStr === todayDateStr && userDetails.stage === 'Booking') {
              await updateDoc(
                doc(db, `products/${productDoc.id}/bookings/${docSnapshot.id}`),
                {
                  'userDetails.stage': 'pickupPending',
                }
              );
              userDetails.stage = 'pickupPending'; // Update locally for immediate display
            }
            if (returnDateStr === todayDateStr && userDetails.stage === 'pickup') {
              await updateDoc(
                doc(db, `products/${productDoc.id}/bookings/${docSnapshot.id}`),
                {
                  'userDetails.stage': 'returnPending',
                }
              );
              userDetails.stage = 'returnPending'; // Update locally for immediate display
            }

            if (returnDateStr >= todayDateStr && userDetails.stage === 'return') {
              const today = new Date();
              await updateDoc(
                doc(db, `products/${productDoc.id}/bookings/${docSnapshot.id}`),
                {
                  returnDate: today, // Update return date to today
                }
              );
              bookingData.returnDate = today; // Update locally for immediate display
            }
            if (returnDateStr >= todayDateStr && userDetails.stage === 'cancelled') {
              const today = new Date();
              await updateDoc(
                doc(db, `products/${productDoc.id}/bookings/${docSnapshot.id}`),
                {
                  returnDate: today, // Update return date to today
                }
              );
              bookingData.returnDate = today; // Update locally for immediate display
            }

            allBookings.push({
              bookingId,
              receiptNumber,
              clientname: userDetails.name,
              contactNo: userDetails.contact,
              email: userDetails.email,
              pickupDate: pickupDate
                ? pickupDate.toDate
                  ? pickupDate.toDate()
                  : new Date(pickupDate)
                : null,
              returnDate: returnDate
                ? returnDate.toDate
                  ? returnDate.toDate()
                  : new Date(returnDate)
                : null,
              createdAt: createdAt || null,
              stage: userDetails.stage,
              products: [{ productCode, quantity: parseInt(quantity, 10) }],
              IdentityProof: userDetails.identityproof || 'N/A',
              IdentityNumber: userDetails.identitynumber || 'N/A',
              Source: userDetails.source || 'N/A',
              CustomerBy: userDetails.customerby || 'N/A',
              ReceiptBy: userDetails.receiptby || 'N/A',
              Alterations: userDetails.alterations || 'N/A',
              SpecialNote: userDetails.specialnote || 'N/A',
              GrandTotalRent: userDetails.grandTotalRent || 'N/A',
              DiscountOnRent: userDetails.discountOnRent || 'N/A',
              FinalRent: userDetails.finalrent || 'N/A',
              GrandTotalDeposit: userDetails.grandTotalDeposit || 'N/A',
              DiscountOnDeposit: userDetails.discountOnDeposit || 'N/A',
              FinalDeposit: userDetails.finaldeposite || 'N/A',
              AmountToBePaid: userDetails.totalamounttobepaid || 'N/A',
              AmountPaid: userDetails.amountpaid || 'N/A',
              Balance: userDetails.balance || 'N/A',
              PaymentStatus: userDetails.paymentstatus || 'N/A',
              FirstPaymentDetails: userDetails.firstpaymentdtails || 'N/A',
              FirstPaymentMode: userDetails.firstpaymentmode || 'N/A',
              SecondPaymentMode: userDetails.secondpaymentmode || 'N/A',
              SecondPaymentDetails: userDetails.secondpaymentdetails || 'N/A',
            });
          }
        }

        // Group bookings by receiptNumber
        const groupedBookings = allBookings.reduce((acc, booking) => {
          const { receiptNumber, products } = booking;
          if (!acc[receiptNumber]) {
            acc[receiptNumber] = { ...booking, products: [...products] };
          } else {
            acc[receiptNumber].products.push(...products);
          }
          return acc;
        }, {});

        // Convert grouped bookings object to array
        let bookingsArray = Object.values(groupedBookings);

        // Sort bookings by `createdAt` in descending order
        bookingsArray.sort((a, b) => {
          const dateA = a.createdAt
            ? new Date(a.createdAt.toDate ? a.createdAt.toDate() : a.createdAt)
            : new Date(0);
          const dateB = b.createdAt
            ? new Date(b.createdAt.toDate ? b.createdAt.toDate() : b.createdAt)
            : new Date(0);
          return dateB - dateA; // Latest first
        });

        setBookings(bookingsArray); // Update state with sorted bookings
      } catch (error) {
        toast.error('Error fetching bookings:', error);
      } finally {
        setLoading(false); // End loading
      }
    };

    fetchAllBookingsWithUserDetails();
  }, [userData.branchCode]);



  const handleDelete = async (id) => {
    if (window.toast.confirm("Are you sure you want to delete this booking?")) {
      try {
        // Add your delete logic here
      } catch (error) {
        toast.error('Error deleting booking:', error);
      }
    }
  };

  const handleAddBooking = () => {
    navigate('/usersidebar/availability'); // Navigate to an add booking page
  };








  const handleSearch = () => {
    const lowerCaseQuery = searchQuery.toLowerCase(); // Make search case-insensitive

    if (lowerCaseQuery === '') {
      setFilteredBookings(bookings); // Show all bookings if search query is empty
    } else {
      const filteredBookings = bookings.filter((booking) => {
        // Apply filtering based on the selected search field
        if (searchField === 'bookingId') {
          return booking.bookingId && String(booking.bookingId).toLowerCase().includes(lowerCaseQuery);
        } else if (searchField === 'receiptNumber') {
          return booking.receiptNumber && String(booking.receiptNumber).toLowerCase().includes(lowerCaseQuery);
        } else if (searchField === 'bookingcreation') {
          return (booking.createdAt && (booking.createdAt).toDate().toLocaleDateString().toLowerCase().includes(lowerCaseQuery));
        } else if (searchField === 'username') {
          return booking.username && booking.username.toLowerCase().includes(lowerCaseQuery);
        }
        else if (searchField === 'emailId') {
          return booking.email && booking.email.toLowerCase().includes(lowerCaseQuery);
        } else if (searchField === 'contactNo') {
          return booking.contactNo && String(booking.contactNo).toLowerCase().includes(lowerCaseQuery);
        } else if (searchField === 'pickupDate') {
          return (booking.pickupDate && new Date(booking.pickupDate).toLocaleDateString().toLowerCase().includes(lowerCaseQuery));
        } else if (searchField === 'returnDate') {
          return booking.returnDate && new Date(booking.returnDate).toLocaleDateString().toLowerCase().includes(lowerCaseQuery);
        } else if (searchField === 'productCode') {
          return booking.products && booking.products.some(product =>
            String(product.productCode).toLowerCase().includes(lowerCaseQuery)
          );
        } else {
          // If no specific search field is selected, perform search across all fields
          return (
            (booking.bookingId && String(booking.bookingId).toLowerCase().includes(lowerCaseQuery)) ||
            (booking.receiptNumber && String(booking.receiptNumber).toLowerCase().includes(lowerCaseQuery)) ||
            (booking.createdAt && (booking.createdAt).toDate().toLocaleDateString().toLowerCase().includes(lowerCaseQuery)) ||
            (booking.username && booking.username.toLowerCase().includes(lowerCaseQuery)) ||
            (booking.contactNo && String(booking.contactNo).toLowerCase().includes(lowerCaseQuery)) ||
            (booking.email && booking.email.toLowerCase().includes(lowerCaseQuery)) ||
            (booking.pickupDate && new Date(booking.pickupDate).toLocaleDateString().toLowerCase().includes(lowerCaseQuery)) ||
            (booking.returnDate && new Date(booking.returnDate).toLocaleDateString().toLowerCase().includes(lowerCaseQuery)) ||
            (booking.price && String(booking.price).toLowerCase().includes(lowerCaseQuery)) ||
            (booking.deposit && String(booking.deposit).toLowerCase().includes(lowerCaseQuery)) ||
            (booking.minimumRentalPeriod && String(booking.minimumRentalPeriod).toLowerCase().includes(lowerCaseQuery)) ||
            (booking.discountedGrandTotal && String(booking.discountedGrandTotal).toLowerCase().includes(lowerCaseQuery)) ||
            (booking.stage && booking.stage.toLowerCase().includes(lowerCaseQuery)) ||
            (booking.products && booking.products.some(product =>
              String(product.productCode).toLowerCase().includes(lowerCaseQuery) ||
              String(product.quantity).toLowerCase().includes(lowerCaseQuery)
            ))
          );
        }
      });

      setFilteredBookings(filteredBookings); // Update bookings with filtered results
    }
  };

  useEffect(() => {
    handleSearch();
  }, [searchQuery, searchField]);

  useEffect(() => {
    setFilteredBookings(bookings);
  }, [bookings]);


  const exportToCSV = () => {
    const processedBookings = bookings.map(booking => {
      const productsString = booking.products
        .map(product => `${product.productCode}:${product.quantity}`)
        .join(', ');

      // Check if `createdAt` exists and is a Timestamp
      const createdAtDate = booking.createdAt && booking.createdAt.toDate
        ? booking.createdAt.toDate().toLocaleString()
        : 'N/A'; // Use 'N/A' or another placeholder if `createdAt` is missing

      return {
        ...booking,
        products: productsString,
        createdAt: createdAtDate,
      };
    });

    const csv = Papa.unparse(processedBookings);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', 'bookings.csv');
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
        complete: async (result) => {
          const importedBookings = result.data.filter(row => row && Object.keys(row).length > 0);

          if (importedBookings.length === 0) {
            toast.warn('No bookings to import.');
            return;
          }

          await Promise.all(importedBookings.map(async (booking) => {
            try {
              if (!booking.bookingCode) {
                toast.error('Booking code is missing:', booking);
                return;
              }

              const bookingRef = doc(db, 'bookings', booking.bookingCode);
              await setDoc(bookingRef, booking);
              toast.log('Booking saved successfully:', booking);
            } catch (error) {
              toast.error('Error saving booking to Firestore:', error, booking);
            }
          }));

          setImportedData(importedBookings); // Store the imported bookings locally if needed
        },
        error: (error) => {
          toast.error('Error parsing CSV:', error);
        }
      });
    }
  };

  // Search function to filter bookings


  // Add a filter based on the stageFilter
  const finalFilteredBookings = filteredBookings.filter((booking) => {
    if (stageFilter === 'all') {
      return true; // Include all bookings if "all" is selected
    }
    return booking.stage === stageFilter; // Match booking stage
  });

  const handleStageChange = async (receiptNumber, newStage) => {
    try {
      // Find the booking to update based on receiptNumber from all bookings
      const bookingToUpdate = finalFilteredBookings.find(
        (booking) => booking.receiptNumber === receiptNumber
      );

      if (!bookingToUpdate) {
        toast.error('Booking not found');
        return;
      }

      // Extracting necessary information from the booking
      const bookingId = String(bookingToUpdate.bookingId);
      const products = bookingToUpdate.products;
      const pickUpDate = bookingToUpdate.pickupDate; // Ensure you are using the correct property name
      const currentStage = bookingToUpdate.stage;

      // Check if pickUpDate is today


      // Loop through all products
      for (const product of products) {
        const productCode = product.productCode;
        const bookingsRef = collection(db, `products/${productCode}/bookings`);
        const q = query(bookingsRef, where("receiptNumber", "==", receiptNumber));
        const querySnapshot = await getDocs(q);

        // Check if any documents were found
        if (querySnapshot.empty) {
          toast.error('No documents found for bookingId:', bookingId);
          // Create a new document if needed
          const bookingDocRef = doc(bookingsRef, bookingId);
          await setDoc(bookingDocRef, {
            userDetails: {
              stage: newStage,
              // Include other default values as necessary
            },
            // Include other relevant fields from bookingToUpdate if needed
          });

          toast.log('Document created successfully for product:', productCode, 'at path:', bookingDocRef.path);
        } else {
          // Reference to the specific booking document inside Firestore
          const bookingDocRef = querySnapshot.docs[0].ref;

          // Update the booking stage in Firestore
          await updateDoc(bookingDocRef, { 'userDetails.stage': newStage });
          toast.log('Stage updated successfully for product:', productCode);
        }
      }

      // Update the state to reflect the change in the UI
      setBookings((prevBookings) =>
        prevBookings.map((booking) =>
          booking.receiptNumber === receiptNumber
            ? { ...booking, stage: newStage }
            : booking
        )
      );
    } catch (error) {
      toast.error('Error updating booking stage:', error);
    }
  };

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const templatesCol = query(
          collection(db, "templates"),
          where('branchCode', '==', userData.branchCode)

        );

        const templatesSnapshot = await getDocs(templatesCol);
        const templatesList = templatesSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setTemplates(templatesList);
      } catch (error) {
        toast.error("Error fetching templates:", error);
      }
    };

    fetchTemplates();
  }, []);

  // Prevent background scrolling when modal is open
  useEffect(() => {
    document.body.style.overflow = isModalOpen ? "hidden" : "auto";
  }, [isModalOpen]);

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


  // Handle template click and send WhatsApp message
  const handleTemplateClick = (template) => {
    if (!selectedBooking) {
      toast.error("No booking selected!");
      return;
    }

    const templateBody = template.body;

    // Replace placeholders with booking data
    const message = templateBody
      .replace("{clientName}", selectedBooking.clientname || "")
      .replace("{clientEmail}", selectedBooking.email || "")
      .replace("{CustomerBy}", selectedBooking.CustomerBy || "")
      .replace("{ReceiptBy}", selectedBooking.ReceiptBy || "")
      .replace("{Alterations}", selectedBooking.Alterations || "")
      .replace("{SpecialNote}", selectedBooking.SpecialNote || "")
      .replace("{GrandTotalRent}", selectedBooking.GrandTotalRent || "")
      .replace("{DiscountOnRent}", selectedBooking.DiscountOnRent || "")
      .replace("{FinalRent}", selectedBooking.FinalRent || "")
      .replace("{GrandTotalDeposit}", selectedBooking.GrandTotalDeposit || "")
      .replace("{DiscountOnDeposit}", selectedBooking.DiscountOnDeposit || "")
      .replace("{FinalDeposit}", selectedBooking.FinalDeposit || "")
      .replace("{AmountToBePaid}", selectedBooking.AmountToBePaid || "")
      .replace("{AmountPaid}", selectedBooking.AmountPaid || "")
      .replace("{Balance}", selectedBooking.Balance || "")
      .replace("{PaymentStatus}", selectedBooking.PaymentStatus || "")
      .replace("{FirstPaymentDetails}", selectedBooking.FirstPaymentDetails || "")
      .replace("{FirstPaymentMode}", selectedBooking.FirstPaymentMode || "")
      .replace("{SecondPaymentMode}", selectedBooking.SecondPaymentMode || "")
      .replace("{SecondPaymentDetails}", selectedBooking.SecondPaymentDetails || "")




      .replace("{pickupDate}", selectedBooking.pickupDate || "")
      .replace("{returnDate}", selectedBooking.returnDate || "")
      .replace("{receiptNumber}", selectedBooking.receiptNumber || "")
      .replace("{stage}", selectedBooking.stage || "")
      .replace("{ContactNo}", selectedBooking.contactNo || "")
      .replace("{IdentityProof}", selectedBooking.IdentityProof || "")
      .replace("{IdentityNumber}", selectedBooking.IdentityNumber || "");

    sendWhatsAppMessage(selectedContactNo, message);

    // Close modal after sending the message
    setIsModalOpen(false);
  };

  // Handle contact number selection
  const handleContactNumberClick = (booking) => {
    setSelectedContactNo(booking.contactNo);
    setSelectedBooking(booking);
    setIsModalOpen(true);
  };
  const stageCounts = filteredBookings.reduce((counts, booking) => {
    counts[booking.stage] = (counts[booking.stage] || 0) + 1;
    return counts;
  }, {});

  // Include "all" count for all bookings
  const totalBookingsCount = filteredBookings.length;
  useEffect(() => {
    if (isModalOpen) {
      document.body.classList.add('modal-open'); // Add class when modal is open
    } else {
      document.body.classList.remove('modal-open'); // Remove class when modal is closed
    }
  }, [isModalOpen]);
  return (
    <div className={`dashboard-container ${sidebarOpen ? 'sidebar-open' : ''}`}>
      <UserSidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      <div className="dashboard-content">
        <UserHeader onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        <h2 style={{ marginLeft: '10px', marginTop: '120px' }}>
          Total Bookings
        </h2>
        <div className="filter-container">
          <button onClick={() => setStageFilter('all')}> All ({totalBookingsCount})</button>
          <button onClick={() => setStageFilter('Booking')}>Booking ({stageCounts['Booking'] || 0}) </button>
          <button onClick={() => setStageFilter('pickupPending')}> Pickup Pending ({stageCounts['pickupPending'] || 0})</button>
          <button onClick={() => setStageFilter('pickup')}>Picked Up ({stageCounts['pickup'] || 0})</button>
          <button onClick={() => setStageFilter('returnPending')}>Return Pending ({stageCounts['returnPending'] || 0})</button>
          <button onClick={() => setStageFilter('return')}>Returned  ({stageCounts['return'] || 0})</button>
          <button onClick={() => setStageFilter('successful')}>Successful ({stageCounts['successful'] || 0})</button>
          <button onClick={() => setStageFilter('cancelled')}>Cancelled ({stageCounts['cancelled'] || 0})</button>
          <button onClick={() => setStageFilter('postponed')}>Postponed / Credit note ({stageCounts['postponed'] || 0})</button>
        </div>

        <div className="toolbar-container">
          <div className="search-bar-container7">
            <img src={search} alt="search icon" className="search-icon7" />
            <select
              value={searchField}
              onChange={(e) => setSearchField(e.target.value)}
              className="search-dropdown7"
            >

              <option value="receiptNumber">Receipt Number</option>
              <option value="bookingcreation">Booking Creation</option>
              <option value="username">Clients Name</option>
              <option value="contactNo">Contact Number</option>
              <option value="emailId">Email Id</option>
              <option value="productCode">Product Code</option>


              <option value="pickupDate">Pickup Date</option>
              <option value="returnDate">Return Date</option>
            </select>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}

              placeholder="Search..."
            />
            {/* <button onClick={handleSearch} className="search-button">Search</button> */}
          </div>

          <div className='action-buttons'>
            <label className="export-button" onClick={exportToCSV}>
              <FaUpload /> Export
            </label>
            {/* <label htmlFor="import" className="import-button">
              <FaDownload /> Import
              <input
                id="file"
                type="file"
                accept=".csv"
                onChange={handleImport}
                style={{ display: 'none' }}
              />
            </label> */}
            <label className="add-product-button" onClick={handleAddBooking}>
              <FaPlus /> Add Booking
            </label>
          </div>

        </div>

        {loading ? (
          <p>Loading bookings...</p>
        ) : (
          <div className="booking-list">
            {finalFilteredBookings.length > 0 ? (
              <table className="booking-table">
                <thead>
                  <tr>
                    <th>Receipt Number</th>
                    <th>Booking Creation Date</th>
                    <th>Clients Name</th>
                    <th>Contact Number</th>
                    <th>Email id </th>
                    <th>Products</th>
                    <th>Pickup Date</th>

                    <th>Return Date</th>

                    <th>Stage</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {finalFilteredBookings.map((booking) => (
                    <tr key={`${booking.receiptNumber}`} >

                      <td>
                        {/* Make only the receipt number clickable */}
                        <span

                          onClick={() => handleBookingClick(booking)}
                        >
                          {booking.receiptNumber}
                        </span>
                      </td>
                      <td>
                        {booking.createdAt ? booking.createdAt.toDate().toLocaleString() : 'N/A'}
                      </td>


                      <td>{booking.clientname}</td>
                      <td>{booking.contactNo
                      }</td>
                      <td>{booking.email}</td>
                      <td>
                        {booking.products.map((product) => (
                          <div key={product.productCode}>
                            {product.productCode}: {product.quantity}
                          </div>
                        ))}
                      </td>
                      <td>{booking.pickupDate.toLocaleString()}</td>
                      <td>{booking.returnDate.toLocaleString()}</td>

                      <td>
                        <select
                          value={booking.stage}
                          onChange={(e) => handleStageChange(booking.receiptNumber, e.target.value)} // Make sure bookingId is being passed correctly
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
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button
                            onClick={(event) => {
                              event.stopPropagation(); // Prevent event bubbling
                              handleContactNumberClick(booking); // Your existing function
                            }}
                            className="whatsapp-button"
                          >
                            <FaWhatsapp style={{ marginRight: "5px" }} />
                          </button>

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
                        </div>


                      </td>


                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p>No bookings found.</p>
            )}
          </div>
        )}
      </div>
      <ToastContainer />
    </div>
  );
};

export default BookingDashboard;
