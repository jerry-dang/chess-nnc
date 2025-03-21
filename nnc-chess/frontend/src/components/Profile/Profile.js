import { useEffect, useState } from 'react';

export default function Profile({ username, getUserInfo }) {
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    async function fetchData() {
        const userInfo = await getUserInfo(username)
        .then(
            async res => {
                const result = await res.json();
                setUserData(result);
                if (res.status !== 200) {
                    //setErrorMessage(result.error);
                }
                else {
                    //setErrorMessage('');
                    //render();
                }
            });
      }
      fetchData();
  }, [username]);

  if (!userData) {
    return <div>Loading...</div>;
  }

  return (
    <div className='profile'>
      <h1>Username: {username}</h1>
      {/* Display user-specific content */}
      <p>Account created: {userData.createdAt}</p>
      {/* Add other user-specific information */}
    </div>
  );
}