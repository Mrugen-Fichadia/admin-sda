import { useState } from 'react';
import './App.css';

const ADMIN_PASSWORD = 'admin';

function App() {
  const [password, setPassword] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [error, setError] = useState('');

  // States for editing
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedSubscriberIndex, setSelectedSubscriberIndex] = useState(null);
  const [renewType, setRenewType] = useState('Monthly');

  const [subscribers, setSubscribers] = useState([
    {
      name: 'Alice Johnson',
      email: 'alice@example.com',
      subscriptionType: 'Monthly',
      expiresAt: '2025-07-20'
    },
    {
      name: 'Bob Smith',
      email: 'bob@example.com',
      subscriptionType: 'Yearly',
      expiresAt: '2026-06-20'
    },
    {
      name: 'Charlie Brown',
      email: 'charlie@example.com',
      subscriptionType: 'Lifetime',
      expiresAt: '-'
    },
    {
      name: 'David Lee',
      email: 'david.lee@example.com',
      subscriptionType: 'Monthly',
      expiresAt: '2025-05-20'
    },
    {
      name: 'Emily Davis',
      email: 'emily.davis@example.com',
      subscriptionType: 'Yearly',
      expiresAt: '2026-06-20'
    },
    {
      name: 'Frank Miller',
      email: 'frank.miller@example.com',
      subscriptionType: 'Lifetime',
      expiresAt: '-'
    },
    {
      name: 'Grace Hopper',
      email: 'grace.hopper@example.com',
      subscriptionType: 'Monthly',
      expiresAt: '2025-07-20'
    },
    {
      name: 'Hannah Wilson',
      email: 'hannah.wilson@example.com',
      subscriptionType: 'Yearly',
      expiresAt: '2026-06-20'
    },
  ]);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newType, setNewType] = useState('Monthly');

  const handleLogin = (e) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setAuthenticated(true);
      setError('');
    } else {
      setError('Incorrect password. Try again.');
    }
  };

  const handleAddSubscriber = (e) => {
    e.preventDefault();
    if (!newName || !newEmail || !newType) return;

    let expiresAt = '-';
    const today = new Date();

    if (newType === 'Monthly') {
      const nextMonth = new Date(today);
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      expiresAt = nextMonth.toISOString().split('T')[0];
    } else if (newType === 'Yearly') {
      const nextYear = new Date(today);
      nextYear.setFullYear(nextYear.getFullYear() + 1);
      expiresAt = nextYear.toISOString().split('T')[0];
    }

    const newSub = {
      name: newName,
      email: newEmail,
      subscriptionType: newType,
      expiresAt: expiresAt,
    };

    setSubscribers([...subscribers, newSub]);

    // Reset form & close dialog
    setNewName('');
    setNewEmail('');
    setNewType('Monthly');
    setIsDialogOpen(false);
  };

  const handleDeleteSubscriber = () => {
    if (selectedSubscriberIndex !== null) {
      const updated = [...subscribers];
      updated.splice(selectedSubscriberIndex, 1);
      setSubscribers(updated);
      setEditDialogOpen(false);
    }
  };

  if (!authenticated) {
    return (
      <div className="login-container">
        <h1>Admin Login</h1>
        <form onSubmit={handleLogin}>
          <input
            type="password"
            placeholder="Enter admin password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button type="submit">Enter</button>
        </form>
        {error && <p className="error">{error}</p>}
      </div>
    );
  }

  return (
    <div className="admin-panel">
      <h1 className="panel-heading">Smart Distributor Admin Panel</h1>

      <div className="table-wrapper">
        <div className="card-header">
          <div className="card-part first-part"><strong>Name</strong></div>
          <div className="card-part second-part"><strong>Email</strong></div>
          <div className="card-part third-part"><strong>Subscription</strong></div>
          <div className="card-part fourth-part"><strong>Expiry</strong></div>
        </div>

        <div className="subscribers-list">
          {subscribers.map((sub, idx) => {
            const isExpired =
              sub.expiresAt !== '-' &&
              new Date(sub.expiresAt) < new Date();

            return (
              <div
                key={idx}
                className={`subscriber-card ${isExpired ? 'expired' : ''}`}
                onClick={() => {
                  setSelectedSubscriberIndex(idx);
                  setRenewType(sub.subscriptionType);
                  setEditDialogOpen(true);
                }}
              >
                <div className="card-part first-part">
                  <h3>{sub.name}</h3>
                </div>
                <div className="card-part second-part">
                  <p>{sub.email}</p>
                </div>
                <div className="card-part third-part">
                  <p>{sub.subscriptionType}</p>
                </div>
                <div className="card-part fourth-part">
                  <p>{sub.expiresAt}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <button className="add-btn-floating" onClick={() => setIsDialogOpen(true)}>
        Add Subscriber
      </button>

      {editDialogOpen && selectedSubscriberIndex !== null && (
        <div className="dialog-backdrop" onClick={() => setEditDialogOpen(false)}>
          <div className="dialog" onClick={(e) => e.stopPropagation()}>
            <h2>Renew Subscription</h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();

                const subsCopy = [...subscribers];
                const sub = subsCopy[selectedSubscriberIndex];

                let baseDate;
                if (sub.expiresAt && sub.expiresAt !== '-') {
                  baseDate = new Date(sub.expiresAt);
                } else {
                  baseDate = new Date();
                }

                let newExpiry = '-';

                if (renewType === 'Monthly') {
                  baseDate.setMonth(baseDate.getMonth() + 1);
                  newExpiry = baseDate.toISOString().split('T')[0];
                } else if (renewType === 'Yearly') {
                  baseDate.setFullYear(baseDate.getFullYear() + 1);
                  newExpiry = baseDate.toISOString().split('T')[0];
                } else {
                  newExpiry = '-';
                }

                sub.subscriptionType = renewType;
                sub.expiresAt = newExpiry;

                setSubscribers(subsCopy);
                setEditDialogOpen(false);
              }}
              className="add-form"
            >
              <label>Renew As:</label>
              <select
                value={renewType}
                onChange={(e) => setRenewType(e.target.value)}
              >
                <option value="Monthly">Monthly</option>
                <option value="Yearly">Yearly</option>
                <option value="Lifetime">Lifetime</option>
              </select>
              <button type="submit">Renew</button>
            </form>
            <div className='delete-close-btn'>
              <button className="delete-btn" onClick={handleDeleteSubscriber}>
                Delete Subscriber
              </button>
              <button className="close-btn" onClick={() => setEditDialogOpen(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {isDialogOpen && (
        <div className="dialog-backdrop" onClick={() => setIsDialogOpen(false)}>
          <div className="dialog" onClick={(e) => e.stopPropagation()}>
            <h2>Add New Subscriber</h2>
            <form onSubmit={handleAddSubscriber} className="add-form">
              <input
                type="text"
                placeholder="Name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
              <input
                type="email"
                placeholder="Email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
              />
              <select
                value={newType}
                onChange={(e) => setNewType(e.target.value)}
              >
                <option value="Monthly">Monthly</option>
                <option value="Yearly">Yearly</option>
                <option value="Lifetime">Lifetime</option>
              </select>
              <button type="submit">Add</button>
            </form>
            <button className="close-btn" onClick={() => setIsDialogOpen(false)}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
