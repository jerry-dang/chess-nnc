// pages/profile/[username].js
import { useRouter } from 'next/router';
import './[username].css';
import Profile from './Profile/Profile';
import { addFriend, getUserInfo, getUsernameCookie, getProfilePicURL } from '../../src/api/api.mjs'


const UserProfilePage = () => {
  const router = useRouter();
  const { username } = router.query;

  return <Profile
    username={username}
    addFriend={addFriend}
    getUserInfo={getUserInfo}
    getUsernameCookie={getUsernameCookie}
    getProfilePicURL={getProfilePicURL}/>;
};

export default UserProfilePage;