//TODO: Use env variable
const NEXT_PUBLIC_BACKEND = "http://34.130.219.58:8080"

//-------------- HTTP Request helpers
async function send(method, url, data){
    const x = await fetch(`${NEXT_PUBLIC_BACKEND}${url}`, {
        method: method,
        credentials: 'include',
        headers: { "Content-Type": "application/json" },
        body: (data) ? JSON.stringify(data) : null,
    });
    return x;
}

async function sendFiles(method, url, data) {
    const formdata = new FormData();
    Object.keys(data).forEach(function (key) {
        const value = data[key];
        formdata.append(key, value);
    });

    const x = await fetch(`${NEXT_PUBLIC_BACKEND}${url}`, {
        method: method,
        credentials: 'include',
        body: formdata,
    });
    return x;
}


//-------------- Cookie Helpers
export function getUsernameCookie() {
    return document.cookie.replace(
        /(?:(?:^|.*;\s*)username\s*\=\s*([^;]*).*$)|^.*$/,
        "$1"
    );
}

export function deleteUsernameCookie() {
    document.cookie = "username=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
}

//-------------- Web API Interfacing functions
export async function signIn(username, password) {
    return await send("POST", "/signin/", { username, password });
}
  
export async function signUp(username, password) {
    return await send("POST", "/signup/", { username, password });
}

export async function signOut() {
    return await send("GET", "/signout/", null);
}

export async function checkSessionActive() {
    return await send("GET", "/sessionActive/", null);
}

export async function searchUser(query) {
    return await send("GET", `/api/search/${query}/`, null);
}

export async function getUserInfo(username) {
    return await send("GET", `/api/user/${username}/`, null);
}

export async function addImage(picture) {
    return await sendFiles(
        "POST",
        "/api/user/image/",
        { picture }
    );
}

export async function deleteImage() {
    return await send(
        "DELETE",
        "/api/user/image/",
        null
    );
}

export function getProfilePicURL(username) {
    return `${NEXT_PUBLIC_BACKEND}/api/user/${username}/image`;
}

export async function hasProfilePic(username) {
    return (await send("GET", `/api/user/${getUsernameCookie()}/image`, null)).status !== 404;
}

export async function addFriend(username) {
    return await send("POST", `/api/add/friend/${username}`, null);
}

export async function getNotifications(page) {
    return await send("GET", `/api/notifications/page/${page}`, null);
}

export async function deleteNotification(id) {
    return await send("DELETE", `/api/notification/${id}/`, null);
}