import { useRef, useState, useEffect } from "react";

export function LoginOrSignupForm({ signIn, signUp, cookies, render }) {
    const username = useRef(null);
    const password = useRef(null);
    const [errorMessage, setErrorMessage] = useState('Please signup or login');

    useEffect(() => {
    }, [cookies]);

    const handleLoginOrSignup = (e) => {
        e.preventDefault(); // Prevents the default form submission behavior
        const method = e.target.id === "login-button" ? signIn : signUp;
        method(username.current.value, password.current.value)
        .then(
            async res => {
                if (res.status !== 200) {
                    const result = await res.json();
                    console.log(result);
                    setErrorMessage(result.error);
                }
                else {
                    setErrorMessage('');
                    render();
                }
            }
        );
    };

    return (
        <div className={`popup ${cookies ? 'hidden' : ''}`} id="user-popup">
            <form className="popup-content" id="add_user_form">
                <input
                    type="text"
                    id="username_field"
                    className="form_element"
                    placeholder="username"
                    name="username"
                    required
                    ref={username}
                />
                <input
                    type="password"
                    id="password_field"
                    className="form_element"
                    placeholder="password"
                    name="password"
                    required
                    ref={password}
                />
                <div className="button-container">
                    <button className="submit-button" id="signup-button" onClick={handleLoginOrSignup}>
                        Signup
                    </button>
                    <button className="submit-button" id="login-button" onClick={handleLoginOrSignup}>
                        Login
                    </button>
                </div>
                <p className="error-prompt" id="error-login">
                    {errorMessage}
                </p>
            </form>
        </div>
    );
}