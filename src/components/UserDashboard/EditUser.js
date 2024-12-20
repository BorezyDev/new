import React, { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../../firebaseConfig'; // Firebase config import
import './EditUser.css';
import { toast, ToastContainer } from 'react-toastify'; // Import react-toastify
import 'react-toastify/dist/ReactToastify.css'; // Import CSS for react-toastify

const EditUser = () => {
  const { id } = useParams();
  const [user, setUser] = useState({});
  const [loading, setLoading] = useState(true);
  const [isActive, setIsActive] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const docRef = doc(db, 'subusers', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const userData = docSnap.data();
          setUser(userData);
          setIsActive(userData.isActive || false);
        } else {
          console.error('User not found');
          toast.error('User not found. Redirecting to users list.'); // User feedback
          setTimeout(() =>  navigate('/usersidebar/users'),5000); // Redirect if user not found
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        toast.error('Error fetching user data. Please try again.'); // User feedback
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [id, navigate]);

  const handleSave = async () => {
    try {
      const docRef = doc(db, 'subusers', id);
      await updateDoc(docRef, {
        ...user,
        isActive,
      });
      toast.success('User updated successfully!'); // Show success notification
      setTimeout(() => navigate('/usersidebar/users'),5000); // Redirect back to user dashboard
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error('Error updating user. Please try again.'); // Show error notification
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUser((prevUser) => ({ ...prevUser, [name]: value }));
  };

  return (
    <div className="edit-user-container">
      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="edit-user-form">
          <h2>Edit User</h2>

          <label>Name:</label>
          <input
            type="text"
            name="name"
            value={user.name || ''}
            onChange={handleInputChange}
          />

          <label>Email:</label>
          <input
            type="text"
            name="email"
            value={user.email || ''}
            onChange={handleInputChange}
          />

          <label>Salary:</label>
          <input
            type="text"
            name="salary"
            value={user.salary || ''}
            onChange={handleInputChange}
          />

          <label>Contact Number:</label>
          <input
            type="text"
            name="contactNumber"
            value={user.contactNumber || ''}
            onChange={handleInputChange}
          />

          <label>Role:</label>
          <input
            type="text"
            name="role"
            value={user.role || ''}
            onChange={handleInputChange}
          />

          

          <label>Active:</label>
          <input
            type="checkbox"
            checked={isActive}
            onChange={() => setIsActive((prev) => !prev)} // Toggle active status
          />

          <button onClick={handleSave}>Save</button>
        </div>
      )}
      <ToastContainer/>
    </div>
  );
};

export default EditUser;
