import { useEffect, useState } from 'react';
import UploadProfilePicForm from './UploadProfilePicForm';
import { useRouter } from 'next/navigation'
import './Profile.css';

export default function Profile({ username, addFriend, getUserInfo, getUsernameCookie, getProfilePicURL }) {
  const [userData, setUserData] = useState(null);
  const [popupVisible, setPopupVisible] = useState(false);
  const [render, setRender] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const router = useRouter();

  useEffect(() => {
    async function fetchData() {
        await getUserInfo(username)
        .then(
            async res => {
                const result = await res.json();

                if (res.status !== 200) {
                    setUserData(null);
                }
                else {
                    setUserData(result);
                }
            });
      }
      fetchData();
      console.log(username?(typeof username):username);
  }, [username, render]);

  if (!userData) {
    return <div>
        <h1>User {username} does not exist.</h1>
        <button onClick={() => router.push('/')} className="submit-button">Home</button>
        </div>
  }

  return (
    <div>
        <button onClick = {() => {addFriend(username).then(x => x.json().then(y => setErrorMessage(y)))}} className='add-button'>Add Friend</button>
        <p className="error-prompt" id="error-add-friend">{
            errorMessage? (
                errorMessage.error? (
                    errorMessage.error
                ) :JSON.stringify(errorMessage, null, 2)
            ) :null
        }</p>
        {getUsernameCookie() === username ? (<UploadProfilePicForm visible={popupVisible} setVisible={setPopupVisible} triggerRender={() => setRender(!render)}/>) : null}
        <h1>User Profile: {username}</h1>
        <img src={`${getProfilePicURL(username)}?t=${Date.now()}`} alt="Profile Picture" width="100" height="100"/>
        <h3>Date joined: {userData.createdAt}</h3>
        <h1>Friends:</h1>
        <div className="friend-grid">
            {userData.friends.map((friend) => (
                <div key={friend} className="friend-item" onClick={() => router.push(`/profile/${friend}`)}>
                    <img
                        src={`${getProfilePicURL(friend)}?t=${Date.now()}`}
                        alt={`Profile of ${friend}`}
                        className="friend-picture"
                        width="100" height="100"
                    />
                    <div className="friend-popup">{friend}</div>
                </div>
            ))}
        </div>
        <button onClick={() => router.push('/')}>Home</button>
    </div>
  );
}