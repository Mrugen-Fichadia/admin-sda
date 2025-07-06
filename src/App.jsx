import { useEffect, useState } from 'react';
import './App.css';
import { db, auth } from './firebase';
import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  onSnapshot,
} from 'firebase/firestore';
import { onAuthStateChanged, signInWithEmailAndPassword } from 'firebase/auth';

function App() {
  const [users, setUsers] = useState([]);
  const [userEmail, setUserEmail] = useState('');
  const [plan, setPlan] = useState('Lifetime Plan');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');
  const [signInError, setSignInError] = useState('');
  const currentDate = new Date(); // Current date: July 06, 2025

  // Monitor authentication state
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        if (user.email === 'work.ignito@gmail.com') {
          setCurrentUser(user);
          setSignInError('');
          console.log('Authenticated user:', user.uid, user.email);
        } else {
          // Sign out if email is not work.ignito@gmail.com
          auth.signOut();
          setCurrentUser(null);
          setSignInError('email not valid');
          setLoading(false);
        }
      } else {
        setCurrentUser(null);
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  // Fetch users data
  useEffect(() => {
    if (!currentUser) return;

    const unsubscribeUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      console.log('Users snapshot:', snapshot.docs);
      const usersData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setUsers(usersData);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching users:', error);
      if (error.code === 'permission-denied') {
        setError('Permission denied: You do not have access to view users.');
      } else {
        setError('Failed to fetch users: ' + error.message);
      }
      setLoading(false);
    });

    return () => unsubscribeUsers();
  }, [currentUser]);

  const handleSignIn = async (e) => {
    e.preventDefault();
    setSignInError('');

    if (signInEmail !== 'work.ignito@gmail.com') {
      setSignInError('Only authorized user is allowed to sign in.');
      return;
    }

    if (!signInPassword) {
      setSignInError('Please enter a password.');
      return;
    }

    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, signInEmail, signInPassword);
      setSignInEmail('');
      setSignInPassword('');
    } catch (err) {
      console.error('Sign-in error:', err);
      if (err.code === 'auth/wrong-password') {
        setSignInError('Incorrect password.');
      } else if (err.code === 'auth/user-not-found') {
        setSignInError('No user found with this email.');
      } else if (err.code === 'auth/too-many-requests') {
        setSignInError('Too many attempts. Please try again later.');
      } else {
        setSignInError('Failed to sign in: ' + err.message);
      }
      setLoading(false);
    }
  };

  const updateSubscription = async () => {
    if (!currentUser) {
      setError('You must be logged in to update subscriptions.');
      return;
    }

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
      const today = new Date();
      let endDate = new Date(today);
      const originalDay = today.getDate(); // Preserve the day (6th)

      if (plan === 'Monthly Plan') {
        endDate.setMonth(today.getMonth() + 1); // e.g., August 6, 2025
      } else if (plan === 'Yearly Plan') {
        endDate.setFullYear(today.getFullYear() + 1); // July 6, 2026
      } else if (plan === 'Lifetime Plan') {
        endDate = new Date('2050-12-31');
      }

      if (plan !== 'Lifetime Plan') {
        endDate.setDate(originalDay); // Ensure day remains the same
      }

      const subscriptionData = {
        plan,
        amount: plan === 'Monthly Plan' ? 699 : plan === 'Yearly Plan' ? 5999 : 24999,
        startDate: today.toISOString().split('T')[0], // e.g., "2025-07-06"
        endDate: endDate.toISOString().split('T')[0], // e.g., "2025-08-06"
        createdAt: today.toISOString().split('T')[0], // e.g., "2025-07-06"
        paymentId: 'not_provided',
        orderId: 'not_provided',
      };

      console.log('Subscription data being sent:', subscriptionData);
      await updateDoc(userDoc.ref, {
        subscription: subscriptionData,
      });

      setError('Subscription updated successfully!');
      setUserEmail('');
      setPlan('Lifetime Plan');
      setIsDialogOpen(false);
      setLoading(false);
    } catch (err) {
      console.error('Subscription update error:', err);
      if (err.code === 'permission-denied') {
        setError('Permission denied: You do not have permission to update this subscription.');
      } else {
        setError('Failed to update subscription: ' + err.message);
      }
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

  if (!currentUser) {
    return (
      <div className="admin-panel">
        <h1 className="panel-heading">Smart Distributor Admin Panel - Sign In</h1>
        <div className="sign-in-form">
          <form onSubmit={handleSignIn}>
            <input
              type="email"
              placeholder="Enter email "
              value={signInEmail}
              onChange={(e) => setSignInEmail(e.target.value)}
            />
            <input
              type="password"
              placeholder="Enter password"
              value={signInPassword}
              onChange={(e) => setSignInPassword(e.target.value)}
            />
            <button type="submit" disabled={loading}>
              {loading ? 'Signing In...' : 'Sign In'}
            </button>
            {signInError && <p className="error">{signInError}</p>}
          </form>
        </div>
      </div>
    );
  }

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
        </div>
        <div className="subscribers-list">
          {users.length > 0 ? (
            users.map((user, idx) => {
              const subscription = user.subscription || {};
              const endDate = new Date(subscription.endDate || '1970-01-01');
              const isExpired = currentDate > endDate;
              return (
                <div key={user.id || idx} className={`subscriber-card ${isExpired ? 'expired' : ''}`}>
                  <div className="card-part first-part"><h3>{user.fullName || 'N/A'}</h3></div>
                  <div className="card-part second-part"><p>{user.email || 'N/A'}</p></div>
                  <div className="card-part third-part">
                    {isExpired ? 'No Plan' : subscription.plan || 'No Plan'}
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