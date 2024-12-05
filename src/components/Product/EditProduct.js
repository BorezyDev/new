import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../firebaseConfig'; // Assuming you have Firebase initialized here
import { useUser } from '../Auth/UserContext'; // Assuming you're using a UserContext for branchCode
import '../Product/Addproduct.css';
import { FaPlus } from 'react-icons/fa';
import UserHeader from '../UserDashboard/UserHeader';
import UserSidebar from '../UserDashboard/UserSidebar';

function EditProduct() {
  const { productCode } = useParams(); // Get productCode from URL
  const [productName, setProductName] = useState('');
  const [brandName, setBrandName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [price, setPrice] = useState('');
  const [deposit, setDeposit] = useState('');
  const [description, setDescription] = useState('');
  const [minimumRentalPeriod, setMinimumRentalPeriod] = useState(1);
  const [priceType, setPriceType] = useState('');
  const [extraRent, setExtraRent] = useState(1);
  const [images, setImages] = useState([]); // Handles both new and existing images
  const [branchCode, setBranchCode] = useState('');
  const [customFieldValues, setCustomFieldValues] = useState({});
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { userData } = useUser();
  const navigate = useNavigate();
  const imageInputRef = useRef();

  useEffect(() => {
    if (userData && userData.branchCode) {
      setBranchCode(userData.branchCode);
    }

    // Fetch product data when component mounts
    const fetchProductData = async () => {
      const productRef = doc(db, 'products', productCode);
      const productDoc = await getDoc(productRef);
      if (productDoc.exists()) {
        const productData = productDoc.data();
        setProductName(productData.productName);
        setBrandName(productData.brandName);
        setQuantity(productData.quantity);
        setPrice(productData.price);
        setDeposit(productData.deposit);
        setDescription(productData.description);
        setMinimumRentalPeriod(productData.minimumRentalPeriod);
        setExtraRent(productData.extraRent);
        setPriceType(productData.priceType);

        // Load existing images as preview
        if (productData.imageUrls) {
          const existingImages = productData.imageUrls.map((url) => ({
            preview: url,
          }));
          setImages(existingImages);
        }
        setCustomFieldValues(productData.customFields || {});
      }
    };

    fetchProductData();
  }, [productCode, userData]);

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);

    if (files.length > 0) {
      const newImages = files.map((file) => ({
        file,
        preview: URL.createObjectURL(file), // Create local preview for new images
      }));

      // Add new images without removing existing image URLs
      setImages((prevImages) => [...prevImages, ...newImages]);
    }
  };

  const handleImageClick = () => {
    if (imageInputRef.current) {
      imageInputRef.current.click();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const storage = getStorage();
      const uploadedImageUrls = [];

      // Upload new files to Firebase Storage
      for (const image of images) {
        if (image.file) {
          const storageRef = ref(storage, `products/${image.file.name}`);
          await uploadBytes(storageRef, image.file);
          const imageUrl = await getDownloadURL(storageRef);
          uploadedImageUrls.push(imageUrl);
        } else {
          // If it's an existing image URL, retain it
          uploadedImageUrls.push(image.preview);
        }
      }

      const productData = {
        productName,
        productCode,
        brandName,
        quantity: parseInt(quantity, 10),
        price: parseFloat(price),
        deposit: parseFloat(deposit),
        description,
        imageUrls: uploadedImageUrls, // Include both existing and new images
        branchCode,
        customFields: customFieldValues,
        priceType,
        extraRent: parseInt(extraRent, 10),
        minimumRentalPeriod: parseInt(minimumRentalPeriod, 10),
      };

      const productRef = doc(db, 'products', productCode);
      await setDoc(productRef, productData);

      alert('Product updated successfully!');
      navigate('/productdashboard');
    } catch (error) {
      console.error('Error updating product: ', error);
      alert('Failed to update product');
    }
  };

  const handleSidebarToggle = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className={`add-product-container ${sidebarOpen ? 'sidebar-open' : ''}`}>
      <UserSidebar isOpen={sidebarOpen} onToggle={handleSidebarToggle} />
      <div className="add-product-name">
        <UserHeader onMenuClick={handleSidebarToggle} isSidebarOpen={sidebarOpen} />
        <h2 style={{ marginLeft: '20px', marginTop: '70px' }}>Edit Product</h2>

        <form className="product-form" onSubmit={handleSubmit}>
          <div className="general-info">
            <div className="left">
              <label className="pd">Product Details</label>
              <label>Product Name</label>
              <input value={productName} onChange={(e) => setProductName(e.target.value)} required />

              <label>Product Code</label>
              <input value={productCode} readOnly required /> {/* Product Code should not be editable */}

              <label>Quantity</label>
              <input value={quantity} onChange={(e) => setQuantity(e.target.value)} required />

              <label>Description</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
          </div>

          <div className="right">
            <label>Upload Images</label>
            <div className="image-upload-box" onClick={handleImageClick}>
              {images.map((image, index) => (
                <div
                  key={index}
                  style={{
                    backgroundImage: `url(${image.preview})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    width: '100px',
                    height: '100px',
                    margin: '5px',
                  }}
                />
              ))}
              <span style={{ fontSize: '24px', color: '#999', }}>
                <FaPlus />
              </span>
            </div>
            <input
              type="file"
              multiple
              onChange={handleImageChange}
              ref={imageInputRef}
              style={{ display: 'none' }} // Hide file input
            />
          </div>

          <div className="pricing">
            <div className="bottom-left">
              <label>Base Rent</label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
              />
              <label>Deposit</label>
              <input
                type="number"
                value={deposit}
                onChange={(e) => setDeposit(e.target.value)}
                required
              />
              <label>Rent Calculated By</label>
              <select
                value={priceType}
                onChange={(e) => setPriceType(e.target.value)}
              >
                <option value="hourly">Hourly</option>
                <option value="daily">Daily</option>
              </select>
              <label>Minimum Rental Period</label>
              <input
                type="number"
                value={minimumRentalPeriod}
                onChange={(e) => setMinimumRentalPeriod(e.target.value)}
              />
              <label>Add-On Charges</label>
              <div className="extra-rent-group">
                <input
                  type="number"
                  value={extraRent}
                  onChange={(e) => setExtraRent(e.target.value)}
                  style={{ width: '90%' }}
                />
              </div>
            </div>
          </div>

          <div className="right1">
            <label>Brand Name</label>
            <input value={brandName} onChange={(e) => setBrandName(e.target.value)} />
          </div>
          <div className="submit-button5">
            <button type="submit">Update Product</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditProduct;
