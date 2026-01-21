const FULL_NAME = document.getElementById("fullname");
const EMAIL = document.getElementById("email");
const USERNAME = document.getElementById("username");
const PASSWORD = document.getElementById("password");
const CPASSWORD = document.getElementById("confirmPassword");
const SHOW_P = document.getElementById("show");
const SUBMIT = document.getElementById("submit");

//declaring local variables
let fullname = "";
let email = "";
let username = "";
let password = "";
let cpassword = "";
let check = true;
let detail = [];

//Adding event listener to show password
SHOW_P.addEventListener('click', () => {
    PASSWORD.setAttribute('type', 'text');
    CPASSWORD.setAttribute('type', 'text');
    setTimeout(() =>{
        PASSWORD.setAttribute('type', 'password');
        CPASSWORD.setAttribute('type', 'password');
    }, 5000);
})

//adding event listener to submit 
SUBMIT.addEventListener('click', () => {
    
    check = true;
    fullname = FULL_NAME.value;
    email = EMAIL.value;
    username = USERNAME.value;
    password = PASSWORD.value;
    cpassword = CPASSWORD.value;

    if(fullname.length <= 5){
        check = false;
        document.getElementById("warning1").style.visibility = "visible";
    }
    else{
        document.getElementById("warning1").style.visibility = "hidden";
    }
    if(!email.includes("@")){
        check = false;
        document.getElementById("warning2").style.visibility = "visible";
    }
    else{
        document.getElementById("warning2").style.visibility = "hidden";
    }
    if(password != cpassword){
        check = false;
        document.getElementById("warning4").textContent = "Password and Confirm Password have to be same";
        document.getElementById("warning5").textContent = "Password and Confirm Password have to be same";
        document.getElementById("warning4").style.visibility = "visible";
        document.getElementById("warning5").style.visibility = "visible";
    }
    else{
        document.getElementById("warning4").style.visibility = "hidden";
        document.getElementById("warning5").style.visibility = "hidden";
    }
    if(check){
        fetch("/save_details/", {
            method: 'POST',
            headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCookie('csrftoken')  // CSRF token needed for POST
            },
            body: JSON.stringify({
                Name: fullname,
                Email: email,
                Username: username,
                Password: password,
            })
        })
        .then(response => response.json())
        .then(data => console.log("Response:", data))
        .catch(err => console.error("Error:", err))
        detail.push({
        fullname : FULL_NAME.value,
        email : EMAIL.value,
        username : USERNAME.value,
        password : PASSWORD.value,
        cpassword : CPASSWORD.value,
    });
    console.log(detail);
    }
    else{
        console.log(error);
    }
})

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