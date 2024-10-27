import React, { useEffect, useState } from 'react';
import { db } from '../../firebaseConfig';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { useUser } from '../Auth/UserContext';
import { useNavigate } from 'react-router-dom';
import './productreport.css';

const ProductReport = () => {
  const [salesData, setSalesData] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [productReportData, setProductReportData] = useState([]);
  const { userData } = useUser();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [salesSearchTerm, setSalesSearchTerm] = useState('');
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const entriesPerPage = 50;

  const navigate = useNavigate();

  useEffect(() => {
    const fetchSalesData = async () => {
      if (userData && userData.branchCode) {
        const branchCode = userData.branchCode;
        const productsRef = collection(db, 'products');
        const productsQuery = query(productsRef, where('branchCode', '==', branchCode));
        const productsSnapshot = await getDocs(productsQuery);

        const allSalesData = [];
        const uniqueProducts = new Set();

        for (const productDoc of productsSnapshot.docs) {
          const productData = productDoc.data();
          const bookingsRef = collection(db, 'products', productDoc.id, 'bookings');
          const bookingsSnapshot = await getDocs(bookingsRef);

          uniqueProducts.add(productData.productName);

          bookingsSnapshot.forEach((bookingDoc) => {
            const bookingData = bookingDoc.data();
            allSalesData.push({
              productId: productDoc.id,
              productName: productData.productName,
              productType: productData.type,
              pickupDate: bookingData.pickupDate ? bookingData.pickupDate.toDate() : null,
              quantity: bookingData.quantity || 0,
              price: parseFloat(bookingData.price) || 0,
              deposit: parseFloat(bookingData.deposit) || 0,
              totalCost: parseFloat(bookingData.totalCost) || 0,
              bookingId: bookingDoc.id,
            });
          });
        }

        setSalesData(allSalesData);
        setAllProducts(Array.from(uniqueProducts));
      }
    };

    fetchSalesData();
  }, [userData]);

  useEffect(() => {
    const fetchProductReportData = async () => {
      if (userData && userData.branchCode) {
        const branchCode = userData.branchCode;
        const productsRef = collection(db, 'products');
        const productsQuery = query(productsRef, where('branchCode', '==', branchCode));
        const productsSnapshot = await getDocs(productsQuery);

        const productReport = [];

        for (const productDoc of productsSnapshot.docs) {
          const productData = productDoc.data();
          const bookingsRef = collection(db, 'products', productDoc.id, 'bookings');
          const bookingsSnapshot = await getDocs(bookingsRef);

          let totalQuantity = 0;
          let totalBooked = 0;
          let totalPrice = 0;
          let totalDeposit = 0;

          bookingsSnapshot.forEach((bookingDoc) => {
            const bookingData = bookingDoc.data();
            totalQuantity += bookingData.quantity || 0;
            totalBooked += 1;
            totalPrice += (parseFloat(bookingData.price) || 0) * (bookingData.quantity || 0);
            totalDeposit += parseFloat(bookingData.deposit) || 0;
          });

          productReport.push({
            productId: productDoc.id,
            productName: productData.productName,
            brandName: productData.brandName || 'N/A',
            totalBooked,
            totalPrice,
            totalDeposit,
            totalQuantity,
          });
        }

        setProductReportData(productReport);
      }
    };

    fetchProductReportData();
  }, [userData]);

  const filteredProductReportData = productReportData.filter((product) => {
    const productName = product.productName ? product.productName.toLowerCase() : '';
    const productId = product.productId ? product.productId.toLowerCase() : '';

    return productName.includes(productSearchTerm.toLowerCase()) || productId.includes(productSearchTerm.toLowerCase());
  });

  const filteredSalesData = salesData
    .filter((sale) => {
      const saleDate = new Date(sale.pickupDate);
      const isWithinDateRange =
        (!startDate || saleDate >= new Date(startDate)) &&
        (!endDate || saleDate <= new Date(endDate));

      const productName = sale.productName ? sale.productName.toLowerCase() : '';
      const productId = sale.productId ? sale.productId.toLowerCase() : '';
      const productType = sale.productType ? sale.productType.toLowerCase() : '';

      const matchesSearchTerm =
        productName.includes(salesSearchTerm.toLowerCase()) ||
        productId.includes(salesSearchTerm.toLowerCase()) ||
        productType.includes(salesSearchTerm.toLowerCase());

      return isWithinDateRange && matchesSearchTerm;
    })
    .sort((a, b) => new Date(b.pickupDate) - new Date(a.pickupDate));

  const totalEntries = filteredSalesData.length;
  const totalSalesAmount = filteredSalesData.reduce((total, sale) => total + sale.totalCost, 0);
  const totalRentAmount = filteredSalesData.reduce((total, sale) => total + (sale.price * sale.quantity), 0);

  const totalPages = Math.ceil(totalEntries / entriesPerPage);
  const indexOfFirstEntry = (currentPage - 1) * entriesPerPage;
  const indexOfLastEntry = indexOfFirstEntry + entriesPerPage;

  const mostRentedProducts = filteredProductReportData
    .filter((product) => product.totalBooked > 0)
    .sort((a, b) => b.totalBooked - a.totalBooked);

  const neverRentedProducts = filteredProductReportData.filter((product) => product.totalBooked === 0);

  const exportSalesData = () => {
    const csvRows = [];
    const headers = ['Product Code', 'Product Name', 'Pickup Date', 'Quantity', 'Price', 'Deposit'];

    csvRows.push(headers.join(','));

    filteredSalesData.forEach(sale => {
      const row = [
        sale.productId,
        sale.productName,
        sale.pickupDate?.toDateString() || '',
        sale.quantity,
        sale.price ? sale.price.toFixed(2) : '0.00',
        sale.deposit ? sale.deposit.toFixed(2) : '0.00',
      ];
      csvRows.push(row.join(','));
    });

    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'sales_report.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="sales-report-container">
      <h2>Product Report</h2>
      <button className="back-button" onClick={() => navigate('/welcome')}>
        Back to Dashboard
      </button>

      <h3>Most Rented Products</h3>
<table className="sales-table">
  <thead>
    <tr>
      <th>SR.No</th>
      <th>Product Code</th>
      <th>Product Name</th>
      <th>Total Booked</th>
    </tr>
  </thead>
  <tbody>
    {mostRentedProducts.length === 0 ? (
      <tr>
        <td colSpan="4">No product data found</td>
      </tr>
    ) : (
      mostRentedProducts.slice(0, 5).map((product, index) => (
        <tr key={index}>
          <td>{index + 1}</td>
          <td>{product.productId}</td>
          <td>{product.productName}</td>
          <td>{product.totalBooked}</td>
        </tr>
      ))
    )}
  </tbody>
</table>

      <hr className="table-divider" />

      <h3>Never Rented Products</h3>
      <table className="sales-table">
        <thead>
          <tr>
            <th>SR.No</th>
            <th>Product Code</th>
            <th>Product Name</th>
          </tr>
        </thead>
        <tbody>
          {neverRentedProducts.length === 0 ? (
            <tr>
              <td colSpan="3">No product data found</td>
            </tr>
          ) : (
            neverRentedProducts.map((product, index) => (
              <tr key={index}>
                <td>{index + 1}</td>
                <td>{product.productId}</td>
                <td>{product.productName}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
      <hr className="table-divider" />

      <h3>Daily Sales</h3>
      <div className="sales-filters">
        <div className="date-filters">
          <label htmlFor="startDate">Start Date:</label>
          <input
            type="date"
            id="startDate"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
          <label htmlFor="endDate">End Date:</label>
          <input
            type="date"
            id="endDate"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
        <div className="search-filters">
          <input
            type="text"
            placeholder="Search Sales"
            value={salesSearchTerm}
            onChange={(e) => setSalesSearchTerm(e.target.value)}
          />
          <button onClick={exportSalesData}>Export Sales Data</button>
        </div>
      </div>

      <table className="sales-table">
  <thead>
    <tr>
      <th>Sr.No</th>
      <th>Product Code</th>
      <th>Product Name</th>
      <th>Pickup Date</th>
      <th>Quantity</th>
      <th>Price</th>
      <th>Deposit</th>
    </tr>
  </thead>
  <tbody>
    {filteredSalesData.length === 0 ? (
      <tr>
        <td colSpan="7">No sales data found</td>
      </tr>
    ) : (
      filteredSalesData
        .slice(indexOfFirstEntry, indexOfLastEntry)
        .map((sale, index) => (
          <tr key={index}>
            <td>{index + 1}</td>
            <td>{sale.productId}</td>
            <td>{sale.productName}</td>
            <td>{sale.pickupDate?.toDateString() || ''}</td>
            <td>{sale.quantity}</td>
            <td>{sale.price.toFixed(2)}</td>
            <td>{sale.deposit.toFixed(2)}</td>
          </tr>
        ))
    )}
    
    {/* Total Row */}
    {filteredSalesData.length > 0 && (
      <tr className="total-row">
        <td colSpan="4" style={{ textAlign: 'right' }}>Total:</td>
        <td>
          {filteredSalesData.reduce((total, sale) => total + sale.quantity, 0)}
        </td>
        <td>
          {filteredSalesData.reduce((total, sale) => total + sale.price, 0).toFixed(2)}
        </td>
        <td>
          {filteredSalesData.reduce((total, sale) => total + sale.deposit, 0).toFixed(2)}
        </td>
      </tr>
    )}
  </tbody>
</table>
<div className="pagination">
  {Array.from({ length: totalPages }, (_, index) => (
    <button
      key={index}
      onClick={() => setCurrentPage(index + 1)}
      className={currentPage === index + 1 ? 'active' : ''}
    >
      {index + 1}
    </button>
  ))}
</div>

<hr className="table-divider" />
      <h3>Total Product Report</h3>
      <div className="search-filters">
          <input
            type="text"
            placeholder="Search"
            value={salesSearchTerm}
            onChange={(e) => setSalesSearchTerm(e.target.value)}
          />
        </div>
      <table className="sales-table">
        <thead>
          <tr>
            <th>Sr.No</th>
            <th>Product Code</th>
            <th>Product Name</th>
            <th>Brand Name</th>
            <th>Total Booked</th>
            <th>Total Quantity</th>
            <th>Total Price</th>
            <th>Total Deposit</th>
          </tr>
        </thead>
        <tbody>
          {filteredProductReportData.length === 0 ? (
            <tr>
              <td colSpan="6">No product report data found</td>
            </tr>
          ) : (
            filteredProductReportData.map((product, index) => (
              <tr key={index}>
                <td>{index + 1}</td>
                <td>{product.productId}</td>
                <td>{product.productName}</td>
                <td>{product.brandName}</td>
                <td>{product.totalBooked}</td>
                <td>{product.totalQuantity}</td>
                <td>{product.totalPrice.toFixed(2)}</td>
                <td>{product.totalDeposit.toFixed(2)}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default ProductReport;
