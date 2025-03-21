import { useEffect } from "react";

export function SignoutButton({ signOut, cookies, render }) {
    useEffect(() => {
      }, [cookies]);
    return (
        <button className={`footer-button ${cookies ? '' : 'hidden'}`} id="signout" onClick={() => signOut().then(render)}>
            Signout
        </button>
  );
}