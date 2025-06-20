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
      console.error('Error fetching users:', error);
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
  
      // Determine the base date: today or current subscription end date if valid
      let baseDate = new Date();
      const currentSub = userDoc.data().subscription;
      if (currentSub && currentSub.endDate && currentSub.endDate !== '-') {
        const existingEnd = new Date(currentSub.endDate);
        if (existingEnd > new Date()) {
          baseDate = existingEnd; // Use existing end date if it's in the future
        }
      }
  
      let endDate = '-';
  
      if (plan === 'Monthly Plan') {
        const newEnd = new Date(baseDate);
        newEnd.setMonth(newEnd.getMonth() + 1);
        endDate = newEnd.toISOString().split('T')[0];
      } else if (plan === 'Yearly Plan') {
        const newEnd = new Date(baseDate);
        newEnd.setFullYear(newEnd.getFullYear() + 1);
        endDate = newEnd.toISOString().split('T')[0];
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
        endDate,
        createdAt: new Date().toISOString(), // actual update timestamp
        paymentId: 'not_provided',
        orderId: 'not_provided',
      };
      console.log("Completed here1\n\n");
  
      // Update the user document with the subscription details

      await updateDoc(userDoc.ref, {
        subscription: subscriptionData,
      });

      console.log("Completed here2\n\n");
      console.log(subscriptionData);
  
      // Add the subscription to the subscriptions subcollection
      await addDoc(collection(db, 'users', userId, 'subscriptions'), subscriptionData);

      console.log("Completed here3\n\n");
      setError('');
      alert('Subscription updated successfully!');
      setUserEmail('');
      //setPlan('Lifetime Plan');
      setIsDialogOpen(false); // Close dialog after successful update
      setLoading(false);
    } catch (err) {
      console.error('Subscription update error:', err);
      setError('Failed to update subscription: ' + err.message);
      setLoading(false);
    }
  };
  ;

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
            let isExpired = false;

            if (user.subscription && user.subscription.endDate && user.subscription.endDate !== '-') {
              isExpired = new Date(user.subscription.endDate) < new Date();
            }
            if (!user.subscription) {
              isExpired = true;
            }

            return (
              <div
                key={user.id || idx}
                className={`subscriber-card ${isExpired ? 'expired' : ''}`}
                onClick={() => {
                  setUserEmail(user.email);
                  setIsDialogOpen(true);
                  setPlan(user.subscription?.plan || 'Lifetime Plan');
                }}
              >
                <div className="card-part first-part">
                  <h3>{user.fullName || 'N/A'}</h3>
                </div>
                <div className="card-part second-part">
                  <p>{user.email || 'N/A'}</p>
                </div>
                <div className="card-part third-part">
                  {user.subscription && user.subscription.plan ? user.subscription.plan : 'No Plan'}
                </div>
                <div className="card-part fourth-part">
                  <p>{user.subscription && user.subscription.endDate ? user.subscription.endDate : 'N/A'}</p>
                </div>
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