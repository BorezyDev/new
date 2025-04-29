import React, { useEffect, useState } from 'react';
import { collection, getDocs, query, where, orderBy, collectionGroup } from 'firebase/firestore';
import { db } from '../../../firebaseConfig';
import './Dahboard.css';
import { useUser } from '../../Auth/UserContext';
import UserHeader from '../../UserDashboard/UserHeader';
import UserSidebar from '../../UserDashboard/UserSidebar';

const Dashboard = () => {
  const [bookings, setBookings] = useState([]);
  const [todaysBookings, setTodaysBookings] = useState(0);
  const [pickupPendingCount, setPickupPendingCount] = useState(0);
  const [returnPendingCount, setReturnPendingCount] = useState(0);
  const [successfulCount, setSuccessfulCount] = useState(0);
  const [monthlyPickupPending, setMonthlyPickupPending] = useState(0);
  const [monthlyReturnPending, setMonthlyReturnPending] = useState(0);
  const [monthlySuccessful, setMonthlySuccessful] = useState(0);
  const [monthlyTotalBookings, setMonthlyTotalBookings] = useState(0);
  const [topProducts, setTopProducts] = useState([]); // State for top 5 products
  const [loading, setLoading] = useState(false);
  const { userData } = useUser();
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [filterTitle, setFilterTitle] = useState('');

  const [monthlyFilteredBookings, setMonthlyFilteredBookings] = useState([]);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const handleSidebarToggle = () => setSidebarOpen(!sidebarOpen);
  useEffect(() => {
    const fetchAllBookingsWithUserDetails = async () => {
      setLoading(true);
      try {
        if (!userData?.branchCode) return;

        const branchCode = userData.branchCode;
        console.log('🔍 Branch Code:', branchCode);

        const productsRef = collection(db, `products/${branchCode}/products`);
        const productsSnapshot = await getDocs(productsRef);
        console.log('📦 Products found:', productsSnapshot.size);

        const allBookingFetches = productsSnapshot.docs.map(async (productDoc) => {
          const productId = productDoc.id;
          const { productCode, productName, imageUrls } = productDoc.data();
          console.log(`➡️ Fetching bookings for product: ${productCode} (${productId})`);

          const bookingsRef = collection(db, `products/${branchCode}/products/${productId}/bookings`);
          const bookingsQuery = query(bookingsRef, orderBy('pickupDate', 'asc'));
          const bookingsSnapshot = await getDocs(bookingsQuery);
          console.log(`✅ Bookings for ${productCode}:`, bookingsSnapshot.size);

          return bookingsSnapshot.docs.map((bookingDoc) => {
            const bookingData = bookingDoc.data();
            return {
              productCode,
              productName,
              ...bookingData,
              pickupDate: bookingData.pickupDate?.toDate() || null,
              returnDate: bookingData.returnDate?.toDate() || null,
              createdAt: bookingData.createdAt?.toDate() || null,
              stage: bookingData.userDetails?.stage,
              imageUrls,
            };
          });
        });

        const bookingResults = await Promise.all(allBookingFetches);
        const allBookings = bookingResults.flat();
        console.log('📊 Total bookings fetched:', allBookings.length);

        // Count bookings per product
        const productBookingsCount = {};
        allBookings.forEach((booking) => {
          const { productCode, productName, imageUrls } = booking;
          if (productBookingsCount[productCode]) {
            productBookingsCount[productCode].count += 1;
          } else {
            productBookingsCount[productCode] = { count: 1, productName, imageUrls };
          }
        });

        // Set bookings & calculate stats
        setBookings(allBookings);
        calculateTodaysBookings(allBookings);
        calculateBookingStages(allBookings);
        calculateMonthlyBookings(allBookings);

        // Sort products by booking count and set the top 10
        const sortedProducts = Object.entries(productBookingsCount)
          .sort(([, a], [, b]) => b.count - a.count)
          .slice(0, 10)
          .map(([productCode, { count, productName, imageUrls }]) => ({
            productCode,
            count,
            productName,
            imageUrls,
          }));

        setTopProducts(sortedProducts);
      } catch (error) {
        console.error('❌ Error fetching bookings:', error);
      } finally {
        setLoading(false);
      }
    };

    // Helpers
    const isSameDay = (date1, date2) =>
      date1 && date2 &&
      date1.getDate() === date2.getDate() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getFullYear() === date2.getFullYear();

    const getUniqueBookingsByReceiptNumber = (bookings) => {
      const uniqueBookings = new Set();
      return bookings.filter((booking) => {
        const isUnique = booking.receiptNumber && !uniqueBookings.has(booking.receiptNumber);
        if (isUnique) uniqueBookings.add(booking.receiptNumber);
        return isUnique;
      });
    };

    const calculateTodaysBookings = (allBookings) => {
      const today = new Date();
      const uniqueTodaysBookings = getUniqueBookingsByReceiptNumber(
        allBookings.filter((booking) =>
          booking.createdAt && isSameDay(booking.createdAt, today)
        )
      );
      setTodaysBookings(uniqueTodaysBookings.length);
    };

    const calculateBookingStages = (allBookings) => {
      const today = new Date();
      const uniqueBookings = getUniqueBookingsByReceiptNumber(allBookings);

      const pickupPending = uniqueBookings.filter((booking) =>
        booking.stage === 'pickupPending' && isSameDay(booking.pickupDate, today)
      ).length;

      const returnPending = uniqueBookings.filter((booking) =>
        booking.stage === 'returnPending' && isSameDay(booking.returnDate, today)
      ).length;

      const successful = uniqueBookings.filter((booking) =>
        booking.stage === 'successful' && isSameDay(booking.returnDate, today)
      ).length;

      setPickupPendingCount(pickupPending);
      setReturnPendingCount(returnPending);
      setSuccessfulCount(successful);
    };

    const calculateMonthlyBookings = (allBookings) => {
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      const uniqueBookings = getUniqueBookingsByReceiptNumber(allBookings);

      const monthlyPickupPending = uniqueBookings.filter((booking) =>
        booking.pickupDate?.getMonth() === currentMonth &&
        booking.pickupDate?.getFullYear() === currentYear &&
        booking.stage === 'pickupPending'
      ).length;

      const monthlyReturnPending = uniqueBookings.filter((booking) =>
        booking.returnDate?.getMonth() === currentMonth &&
        booking.returnDate?.getFullYear() === currentYear &&
        booking.stage === 'returnPending'
      ).length;

      const monthlySuccessful = uniqueBookings.filter((booking) =>
        booking.returnDate?.getMonth() === currentMonth &&
        booking.returnDate?.getFullYear() === currentYear &&
        booking.stage === 'successful'
      ).length;

      const monthlyTotal = uniqueBookings.filter((booking) =>
        booking.pickupDate?.getMonth() === currentMonth &&
        booking.pickupDate?.getFullYear() === currentYear
      ).length;

      setMonthlyPickupPending(monthlyPickupPending);
      setMonthlyReturnPending(monthlyReturnPending);
      setMonthlySuccessful(monthlySuccessful);
      setMonthlyTotalBookings(monthlyTotal);
    };

    fetchAllBookingsWithUserDetails();
  }, [userData?.branchCode]);
  const groupBookingsByReceiptNumber = (bookings) => {
    const grouped = {};

    bookings.forEach((booking) => {
      const receipt = booking.receiptNumber;
      if (!receipt) return;

      if (!grouped[receipt]) {
        grouped[receipt] = {
          receiptNumber: receipt,
          createdAt: booking.createdAt,
          customerName: booking.customerName,
          stage: booking.stage,
          bookings: [],
        };
      }
      grouped[receipt].bookings.push(booking); // All products under this receipt
    });

    return Object.values(grouped); // Return as array
  };


  const handleShowFilteredBookings = (filterType) => {
    const today = new Date();
    let filtered = [];

    switch (filterType) {
      case 'todaysBookings':
        filtered = bookings.filter(
          (b) => b.createdAt &&
            b.createdAt.getDate() === today.getDate() &&
            b.createdAt.getMonth() === today.getMonth() &&
            b.createdAt.getFullYear() === today.getFullYear()
        );
        setFilterTitle("Today's Bookings");
        break;

      case 'pickupPending':
        filtered = bookings.filter(
          (b) => b.stage === 'pickupPending' &&
            b.pickupDate &&
            b.pickupDate.getDate() === today.getDate() &&
            b.pickupDate.getMonth() === today.getMonth() &&
            b.pickupDate.getFullYear() === today.getFullYear()
        );
        setFilterTitle('Today’s Pickup Pending');
        break;

      case 'returnPending':
        filtered = bookings.filter(
          (b) => b.stage === 'returnPending' &&
            b.returnDate &&
            b.returnDate.getDate() === today.getDate() &&
            b.returnDate.getMonth() === today.getMonth() &&
            b.returnDate.getFullYear() === today.getFullYear()
        );
        setFilterTitle('Today’s Return Pending');
        break;

      case 'successful':
        filtered = bookings.filter(
          (b) => b.stage === 'successful' &&
            b.returnDate &&
            b.returnDate.getDate() === today.getDate() &&
            b.returnDate.getMonth() === today.getMonth() &&
            b.returnDate.getFullYear() === today.getFullYear()
        );
        setFilterTitle('Today’s Successful Bookings');
        break;

      default:
        filtered = [];
        setFilterTitle('');
    }
    const grouped = groupBookingsByReceiptNumber(filtered);
    setFilteredBookings(grouped);
  };

  const filterMonthlyBookings = (type) => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    const isCurrentMonth = (date) =>
      date?.getMonth() === currentMonth && date?.getFullYear() === currentYear;

    const filtered = bookings.filter((b) => {
      switch (type) {
        case 'pickupPending':
          return b.stage === 'pickupPending' && isCurrentMonth(b.pickupDate);
        case 'returnPending':
          return b.stage === 'returnPending' && isCurrentMonth(b.returnDate);
        case 'successful':
          return b.stage === 'successful' && isCurrentMonth(b.returnDate);
        case 'total':
          return isCurrentMonth(b.pickupDate);
        default:
          return false;
      }
    });

    const grouped = groupBookingsByReceiptNumber(filtered);
    setFilteredBookings(grouped);   // ✅ re-using filteredBookings state
    switch (type) {
      case 'pickupPending':
        setFilterTitle('Monthly Pickup Pending');
        break;
      case 'returnPending':
        setFilterTitle('Monthly Return Pending');
        break;
      case 'successful':
        setFilterTitle('Monthly Successful Bookings');
        break;
      case 'total':
        setFilterTitle('Monthly Total Bookings');
        break;
      default:
        setFilterTitle('');
    }
  };



  return (
    <div className={`dashboard-container ${sidebarOpen ? 'sidebar-open' : ''}`}>
      <UserSidebar isOpen={sidebarOpen} onToggle={handleSidebarToggle} />
      <div className="reports-container">
        <UserHeader onMenuClick={handleSidebarToggle} isSidebarOpen={sidebarOpen} />
        {/* <h2 style={{ marginTop: '30px' }}>Dashboard</h2> */}

        <div className="sales-report">
          <h4>Today's Report</h4>
          <div className="report-cards">
            <div className="card" onClick={() => handleShowFilteredBookings('todaysBookings')}>
              Today's Booking <br /> {todaysBookings}
            </div>
            <div className="card" onClick={() => handleShowFilteredBookings('pickupPending')}>
              Pick-up Pending <br /> {pickupPendingCount}
            </div>
            <div className="card" onClick={() => handleShowFilteredBookings('returnPending')}>
              Return Pending <br /> {returnPendingCount}
            </div>
            <div className="card" onClick={() => handleShowFilteredBookings('successful')}>
              Successful <br /> {successfulCount}
            </div>

          </div>



        </div>

        <div className="sales-overview">
          <h4>Monthly Overview</h4>
          <div className="report-cards">
            <div className="card" onClick={() => filterMonthlyBookings('total')}>Monthly Total Booking <br /> {monthlyTotalBookings}</div>
            <div className="card" onClick={() => filterMonthlyBookings('pickupPending')}>Monthly Pick-up Pending <br /> {monthlyPickupPending}</div>
            <div className="card" onClick={() => filterMonthlyBookings('returnPending')}>Monthly Return Pending <br /> {monthlyReturnPending}</div>
            <div className="card" onClick={() => filterMonthlyBookings('successful')}>Monthly Successful <br /> {monthlySuccessful}</div>          </div>
        </div>
        {filteredBookings.length > 0 && (
          <div className="modal-overlayy" onClick={() => setFilteredBookings([])}>
            <div className="modal-boxx" onClick={(e) => e.stopPropagation()}>
              <button className="modall-close-btn" onClick={() => setFilteredBookings([])}>×</button>
              <h4>{filterTitle}</h4>
              <table>
                <thead>
                  <tr>
                    <th>Receipt No.</th>
                    <th>Booking Creation Date</th>
                    <th>Clients Name</th>
                    <th>Contact Number</th>
                    <th>Email id </th>
                    <th>Products</th>
                    <th>Pickup Date</th>
                    <th>Return Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBookings.map((group, i) => {
                    const { receiptNumber, bookings } = group;
                    const customerName = bookings[0]?.userDetails?.name || '-';
                    const status = bookings[0]?.stage || '-';
                    const pickupDate = bookings[0]?.pickupDate?.toLocaleDateString() || '-';
                    const returnDate = bookings[0]?.returnDate?.toLocaleDateString() || '-';
                    const productNames = bookings.map((b) => `${b.productCode} - ${b.quantity}`).join(', ');
                    const createdAt = bookings[0]?.createdAt?.toLocaleDateString() || '-';
                    const contactNo = bookings[0]?.userDetails?.contact ||'-';
                    const email = bookings[0]?.userDetails?.email ||'-';
                    return (
                      <tr key={i}>
                        <td>{receiptNumber}</td>
                        <td>{createdAt}</td>
                        <td>{customerName}</td>
                        <td>{contactNo}</td>
                        <td>{email}</td>
                        <td>{productNames}</td>
                        <td>{pickupDate}</td>
                        <td>{returnDate}</td>
                        <td>{status}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}



        <div className="tble3">
          <h4>Top Products </h4>
          <table>
            <thead>
              <tr>
                <th>Sr. No</th>
                <th>Product Image</th>
                <th>Product Name</th>
                <th>Product Code</th>
                <th>Booking Count</th>
              </tr>
            </thead>
            <tbody>
              {topProducts.map((product, index) => (
                <tr key={index}>
                  <td>{index + 1}</td>
                  <td><img src={product.imageUrls} style={{ width: '30px', height: '30px' }} /> </td>
                  <td>{product.productName}</td>
                  <td>{product.productCode}</td>
                  <td>{product.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

