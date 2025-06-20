import { useEffect, useState } from 'react';
import './App.css';
import { db } from './firebase';
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  onSnapshot,
} from 'firebase/firestore';

function App() {
  const [users, setUsers] = useState([]); // Store users from users collection
  const [userEmail, setUserEmail] = useState(''); // Email of user to update
  const [plan, setPlan] = useState('Lifetime Plan'); // Selected subscription plan
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true); // Loading state
  const [isDialogOpen, setIsDialogOpen] = useState(false); // State for dialog visibility
  const currentDate = new Date(); // Current date for expiration check

  useEffect(() => {
    const unsubscribeUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      console.log('Users snapshot:', snapshot.docs);
      const usersData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setUsers(usersData);
      console.log(usersData);
      setLoading(false); // Stop loading once data is fetched
    }, (error) => {
      console.error();
      setError('Failed to fetch users: ' + error.message);
      setLoading(false);
    });

    return () => unsubscribeUsers();
  }, []);

  const updateSubscription = async () => {
    if (!userEmail || !plan) {
      setError('Please enter user email and select a plan.');
      return;
    }
  
    setLoading(true);
    try {
      console.log('Updating subscription for:', userEmail, plan);
  
      const q = query(collection(db, 'users'), where('email', '==', userEmail));
      const querySnapshot = await getDocs(q);
  
      if (querySnapshot.empty) {
        setError('No user found with that email.');
        setLoading(false);
        return;
      }
  
      const userDoc = querySnapshot.docs[0];
      const userId = userDoc.id;
  
      // Get today’s date
      const today = new Date();
  
      // Determine base date: either today, or existing endDate if in future
      let baseDate = new Date(today);
  
      if (userDoc.data().subscription && userDoc.data().subscription.endDate) {
        const existingEndDate = new Date(userDoc.data().subscription.endDate);
        if (existingEndDate > today) {
          baseDate = existingEndDate;
        }
      }
  
      // Calculate new endDate based on baseDate + plan length
      let newEndDate = new Date(baseDate);
  
      if (plan === 'Monthly Plan') {
        newEndDate.setMonth(newEndDate.getMonth() + 1);
      } else if (plan === 'Yearly Plan') {
        newEndDate.setFullYear(newEndDate.getFullYear() + 1);
      } else if (plan === 'Lifetime Plan') {
        newEndDate = new Date('2050-12-31');
      }
  
      const subscriptionData = {
        plan,
        amount:
          plan === 'Monthly Plan'
            ? 699
            : plan === 'Yearly Plan'
            ? 5999
            : 24999,
        startDate: baseDate.toISOString().split('T')[0],
        endDate: newEndDate.toISOString().split('T')[0],
        createdAt: today.toISOString().split('T')[0], // Current date/time for log
        paymentId: 'not_provided',
        orderId: 'not_provided',
      };
  
      console.log('Subscription data:', subscriptionData);
  
      // Update the user document
      await updateDoc(userDoc.ref, {
        subscription: subscriptionData,
      });
  
      // Add to subscriptions subcollection
      await addDoc(collection(db, 'users', userId, 'subscriptions'), subscriptionData);
  
      alert('Subscription updated successfully!');
      setError('');
      setUserEmail('');
      setIsDialogOpen(false);
      setLoading(false);
  
    } catch (err) {
      console.error('Subscription update error:', err);
      setLoading(false);
    }
  };  

  const openDialog = () => setIsDialogOpen(true);
  const closeDialog = () => {
    setIsDialogOpen(false);
    setUserEmail('');
    setPlan('Lifetime Plan');
    setError('');
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="admin-panel">
      <h1 className="panel-heading">Smart Distributor Admin Panel</h1>
      <div className="table-wrapper">
        <div className="card-header">
          <div className="card-part first-part"><strong>Name</strong></div>
          <div className="card-part second-part"><strong>Email</strong></div>
          <div className="card-part third-part"><strong>Plan</strong></div>
          <div className="card-part fourth-part"><strong>Expiry</strong></div>
        </div>
        <div className="subscribers-list">
          {users.length > 0 ? (
            users.map((user, idx) => {
              const subscription = user.subscription || {};
              const endDate = new Date(subscription.endDate || '1970-01-01');
              const isExpired = currentDate > endDate;

              return (
                <div
                  key={user.id || idx}
                  className={`subscriber-card ${isExpired ? 'expired' : ''}`}
                  onClick={() => {
                    setUserEmail(user.email);   // pre-fill user email
                    setPlan('Lifetime Plan');   // or keep previous value if you want
                    setIsDialogOpen(true);      // open the dialog
                  }}
                >
                  <div className="card-part first-part"><h3>{user.fullName || 'N/A'}</h3></div>
                  <div className="card-part second-part"><p>{user.email || 'N/A'}</p></div>
                  <div className="card-part third-part">
                    {isExpired ? 'No Plan' : subscription.plan || 'No Plan'}
                  </div>
                  <div className="card-part fourth-part"><p>{user.subscription && user.subscription.endDate? user.subscription.endDate : 'N/A'}</p></div>
                </div>
              );
            })
          ) : (
            <p>No users found.</p>
          )}
        </div>
      </div>
      <button className="add-btn-floating" onClick={openDialog}>+</button>
      {isDialogOpen && (
        <div className="dialog-backdrop" onClick={closeDialog}>
          <div className="dialog" onClick={(e) => e.stopPropagation()}>
            <h2>Add Subscription</h2>
            <div className="add-form">
              <input
                type="email"
                placeholder="Enter user email"
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
              />
              <select value={plan} onChange={(e) => setPlan(e.target.value)}>
                <option value="Lifetime Plan">Lifetime Plan (₹24,999)</option>
                <option value="Monthly Plan">Monthly Plan (₹699)</option>
                <option value="Yearly Plan">Yearly Plan (₹5,999)</option>
              </select>
              <button onClick={updateSubscription}>Update Subscription</button>
              {error && <p className="error">{error}</p>}
              <div className="delete-close-btn">
                <button className="close-btn" onClick={closeDialog}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;