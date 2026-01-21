const BOARD = document.getElementById('score_board');
const TABLE = document.getElementById('score_table');

get_data();

async function get_data(){
    const res = await fetch("/get_score/", {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCookie('csrftoken'),  
        },
    });
    const data = await res.json();
    let list = data.Data;
    console.log(list);
    const sortedMarks = Object.entries(list)
    .sort((a, b) => b[1] - a[1])  // sort by value, highest first
    .reduce((acc, [name, score]) => {
        acc[name] = score;
        return acc;
    }, {});
    console.log(sortedMarks);

    let temp = 1;

    for(let ele in sortedMarks){
        const TR = document.createElement('tr');
        const TD = [document.createElement('td'), document.createElement('td'), document.createElement('td')];
        TD[0].textContent = `${temp}`;
        TD[1].textContent = ele.toUpperCase();
        TD[2].textContent = `${sortedMarks[ele]}`;
        for(let i in TD){
            TR.appendChild(TD[i]);
        }
        TABLE.appendChild(TR);
        temp++;
    }
}

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

function dropConfetti() {
  for (let i = 0; i < 50; i++) {
    const confetti = document.createElement('div');
    confetti.classList.add('confetti');
    confetti.style.left = `${Math.random() * 100}vw`;
    confetti.style.backgroundColor = `hsl(${Math.random() * 360}, 100%, 70%)`;
    confetti.style.animationDuration = `${Math.random() * 3 + 2}s`;
    confetti.style.top = '100vh';
    document.body.appendChild(confetti);
    setTimeout(() => confetti.remove(), 5000);
  }
}

dropConfetti();
