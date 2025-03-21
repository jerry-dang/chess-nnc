// import React, { useState, useRef, useEffect } from 'react';
// import { FaSearch } from 'react-icons/fa';
// import Link from 'next/link';
// import './SearchComponent.css';

// export function SearchComponent ({ search }) {
//   const [searchTerm, setSearchTerm] = useState('');
//   const [searchResults, setSearchResults] = useState([]);
//   const searchRef = useRef(null);

//   useEffect(() => {
//     const handleClickOutside = (event) => {
//       if (searchRef.current && !searchRef.current.contains(event.target)) {
//         setSearchResults([]);
//       }
//     };

//     document.addEventListener('mousedown', handleClickOutside);
//     return () => {
//       document.removeEventListener('mousedown', handleClickOutside);
//     };
//   }, []);
import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import './SearchComponent.css'

export function SearchComponent ({ search, getProfilePicURL, addFriend }) {
  const searchTerm = useRef(null);
  const [searchResults, setSearchResults] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  const handleSearch = async (e) => {
    try {
      // Call the search function passed as a prop
      const results = await search(searchTerm.current.value)
      .then(
        async res => {
            const result = await res.json();
            setSearchResults(result);
            if (res.status !== 200) {
                setErrorMessage(result.error);
            }
            else {
                if (result.length === 0) {
                    setErrorMessage('No results found');
                }
            }
        });
      // Update state with search results

    } catch (error) {
      console.error('Error during search:', error);
      // Handle errors, e.g., display an error message
    }
  };

  return (
    // <div className='search-component' ref={searchRef}>
    //   <form onSubmit={handleSearch}>
    //     <input
    //       type="text"
    //       value={searchTerm}
    //       onChange={(e) => {
    //         setSearchTerm(e.target.value);
    //         if (e.target.value.length > 0) {
    //           handleSearch(e);
    //         } else {
    //           setSearchResults([]);
    //         }
    //       }}
    //       placeholder="Search for users"
    //     />
    //     <button type="submit" className="search-button">
    //       <FaSearch />
    //     </button>
    //   </form>

    //   <div className='search-results-container'>
    //     {searchResults.length === 0 && searchTerm !== '' ? (
    //       <p>No results found</p>
    //     ) : (
    //       <ul>
    //         {searchResults.map((username) => (
    //           <li key={username}>
    //             <Link id="link" href={`/profile/${username}`}>
    //               {username}
    //             </Link>
    //           </li>
    //         ))}
    //       </ul>
    <form className='search-form' onSubmit={(e)=>e.preventDefault()}>
    <input
        type="text"
        placeholder="Search for users"
        ref={searchTerm}
    />
    <button className="submit-button" onClick={handleSearch}>Search</button>
    <p className='error-prompt search-prompt'>{errorMessage}</p>
    <div>
        {searchResults && searchResults.length > 0 ? (
          <ul style={{ listStyleType: 'none', padding: 0 }}>
            {searchResults.map((user) => (
                <li key={user._id} style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
                    <img src={`${getProfilePicURL(user._id)}?t=${Date.now()}`} alt="Profile Picture" width="50" height="50"/>
                    <Link
                        href={`/profile/${user._id}`}
                        style={{
                            color: 'blue',
                            textDecoration: 'none',
                            fontSize: '16px',
                            marginLeft: '10px',
                            verticalAlign: 'middle'
                        }}>
                        {user._id}
                    </Link>
                    {!user.friends?
                        <button
                            className='add-button'
                            onClick={async () => {
                                await addFriend(user._id)
                                .then((r) => r.json()
                                .then((t)=>setErrorMessage(t)));
                                handleSearch(searchTerm.current.value);
                            }}>
                                Add
                        </button>
                    : null}
                </li>
            ))}
          </ul>
        ) : (
            null
        )}
      </div>
    </form>
  );
};
