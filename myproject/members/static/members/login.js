// Initializing html elements in js
const USERNAME = document.getElementById("username");
const PASSWORD = document.getElementById("password");
const SHOW_PW = document.getElementById("show");
const SUBMIT = document.getElementById("submit");

function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let cookie of cookies) {
            cookie = cookie.trim();
            if (cookie.startsWith(name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

SHOW_PW.addEventListener('click', () => {
    PASSWORD.setAttribute('type', 'text');
    setTimeout(() => {
        PASSWORD.setAttribute('type', 'password');
    }, 3000)
})

SUBMIT.addEventListener('click', ()=>{
    let username = USERNAME.value;
    let password = PASSWORD.value;
    fetch("/get_details/", {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCookie('csrftoken')  // CSRF token needed for POST
        },
        body: JSON.stringify({
            UserName: username,
            PassWord: password,
        })
    })
    .then(response => response.json())
    .then(data => {
        if(data.message == "Matched"){
            console.log("logined")
        }
        else{
            console.log("Invalid details")
        }
    })
    .catch(err => console.error("Error: ", err))
})