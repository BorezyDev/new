import React, { useEffect, useState } from 'react';
import { collection, getDocs, query, where, orderBy,collectionGroup } from 'firebase/firestore';
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
  
  
  return (
    <div className={`dashboard-container ${sidebarOpen ? 'sidebar-open' : ''}`}>
      <UserSidebar isOpen={sidebarOpen} onToggle={handleSidebarToggle} />
      <div className="reports-container">
        <UserHeader onMenuClick={handleSidebarToggle} isSidebarOpen={sidebarOpen} />
        {/* <h2 style={{ marginTop: '30px' }}>Dashboard</h2> */}

        <div className="sales-report">
          <h4>Today's Report</h4>
          <div className="report-cards">
            <div className="card">Today's Booking <br /> {todaysBookings}</div>
            <div className="card">Pick-up Pending <br /> {pickupPendingCount}</div>
            <div className="card">Return Pending <br /> {returnPendingCount}</div>
            <div className="card">Successful <br /> {successfulCount}</div>
          </div>
        </div>

        <div className="sales-overview">
          <h4>Monthly Overview</h4>
          <div className="report-cards">
            <div className="card">Monthly Total Booking <br /> {monthlyTotalBookings}</div>
            <div className="card">Monthly Pick-up Pending <br /> {monthlyPickupPending}</div>
            <div className="card">Monthly Return Pending <br /> {monthlyReturnPending}</div>
            <div className="card">Monthly Successful <br /> {monthlySuccessful}</div>
          </div>
        </div>

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
                 <td><img src={product.imageUrls} style={{ width: '30px', height: '30px' }}/> </td>
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

