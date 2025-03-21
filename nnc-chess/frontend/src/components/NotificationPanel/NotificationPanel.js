import React, { useState, useLayoutEffect, useEffect } from 'react';
import './NotificationPanel.css';

export function NotificationPanel ({ deleteNotification, getNotifications, addFriend }) {
  const [notifications, setNotifications] = useState([]);

  const updateNotifs = () => getNotifications(1).then(n => n.json().then(notifs => {console.log("notifs", notifs); setNotifications(notifs);}));
  useLayoutEffect(() => {
    updateNotifs();
  }, []);

  return (
    <form className="notification-panel">
      <h2>Notification Panel</h2>
      <div className="notifications">
        {notifications.map((notification) => (
          <div key={notification._id} className={`notification ${notification.type}`}>
            <span>
                <strong>{notification.createdAt}</strong>
                <br />
                {notification.message}
            </span>
            {notification.type === 'AddFriend'?
                <button
                    className='add-button'
                    onClick={() => addFriend(notification.from).then(() => updateNotifs())}>
                        Add
                </button>
            : null}
            <button className='delete-button' onClick={() => deleteNotification(notification._id).then(() => updateNotifs())}>Dismiss</button>
          </div>
        ))}
      </div>
    </form>
  )
}