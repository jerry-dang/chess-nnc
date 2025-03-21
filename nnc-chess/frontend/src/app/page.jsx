'use client'

import Link from 'next/link'
import
{
    checkSessionActive,
    deleteUsernameCookie,
    getUsernameCookie,
    searchUser,
    signIn,
    signUp,
    signOut,
    getProfilePicURL,
    getNotifications,
    deleteNotification,
    addFriend
}
from "../api/api.mjs";

import { LoginOrSignupForm } from "../components/LoginOrSignupForm/LoginOrSignupForm"
import { SignoutButton } from "../components/SignoutButton/SignoutButton"
import { SearchComponent } from "../components/SearchComponent/SearchComponent"
import { JoinGameModule } from "../components/JoinGameModule/JoinGameModule"
import { NotificationPanel } from "../components/NotificationPanel/NotificationPanel"
import { useState, useLayoutEffect} from "react"

export default function Home() {
    const [cookies, setCookies] = useState(true);
    const [sessionActive, setSessionActive] = useState(false);
    const render = () => {
        checkSessionActive()
        .then(res => res.json()
        .then(sessionActive => {
            setSessionActive(sessionActive);
            console.log("session", sessionActive);
            if (!sessionActive) deleteUsernameCookie();
            setCookies(getUsernameCookie());
        }));
    }

    useLayoutEffect(() => {
        // This will run on the client before the browser paints the screen.
        render();
    }, []);

    return (
        <div>
            <div className="main-section">
                <LoginOrSignupForm
                    signIn={signIn}
                    signUp={signUp}
                    render={render}
                    cookies={cookies}
                />
                <div className="left-section">
                    <p className="page-title">NNC Chess</p>
                    <SearchComponent search={searchUser} getProfilePicURL={getProfilePicURL} addFriend={addFriend}/>
                    <JoinGameModule/>
                </div>
                <div className="right-section">
                    {sessionActive?
                        <NotificationPanel
                            deleteNotification={deleteNotification}
                            getNotifications={getNotifications}
                            addFriend={addFriend}
                        />
                    : null}
                </div>
            </div>
            <footer>
                <div className="footer-button-container">
                    <button className="footer-button" id="show-credits" onClick={() => document.getElementById("credits-popup").classList.toggle('hidden')}>
                        Credits
                    </button>
                    <Link
                        className="current-user"
                        href={`/profile/${cookies}`}
                        style={{ textDecoration: 'none' }}>
                            {cookies !== true && cookies ? `Welcome back, ${cookies}` : null}
                    </Link>
                    <SignoutButton
                        signOut={signOut}
                        render={render}
                        cookies={cookies}
                    />
                </div>
                <div className="popup hidden" id="credits-popup">
                        <div className="credits-content">
                            <span className="close" id="close-credits" onClick={() => document.getElementById("credits-popup").classList.toggle('hidden')}>
                                ×
                            </span>
                            <p id="credits-desc">
                                TODO: Complete the credits
                            </p>
                        </div>
                    </div>
            </footer>
        </div>
    )
}
