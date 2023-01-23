const responseArea = document.querySelector('#response');
const templateMsg = document.querySelector('#template-msg');
const templateLogin = document.querySelector('#template-login');

let tries = 3;

function displayLoginMsg() {
    const loginMsg = templateLogin.content.firstElementChild.cloneNode(true);

    responseArea.innerHTML = '';
    responseArea.append(loginMsg);
}

function displayMsg(msgText) {
    const msg = templateMsg.content.firstElementChild.cloneNode(true);
    msg.querySelector('#resp-text').textContent = msgText;

    responseArea.innerHTML = '';
    responseArea.append(msg);
}

async function getData() {
    const endpoint = '/.netlify/functions/get-message';

    try {
        const resp = await fetch(endpoint);
        const respJson = await resp.json();
        
        if(!resp.ok) {
            console.warn('Error getting data', respJson);

            const error = new Error(respJson.error || 'Network response was not ok.');
            error.status = respJson.code;
            throw error;
        }

        console.log(respJson);

        displayMsg(respJson.data.message);
    } catch(e) {
        console.error(e);

        if(tries <= 0) return;

        refreshAuth();
        tries--;
    }
}

async function refreshAuth() {
    const endpoint = '/.netlify/functions/refresh-auth';

    try {
        const resp = await fetch(endpoint);
        const respJson = await resp.json();
        
        if(!resp.ok) {
            console.warn('Error refreshing auth', respJson);

            const error = new Error(respJson.error || 'Network response was not ok.');
            error.status = respJson.code;
            throw error;
        }

        console.log(respJson);
        
        getData();
    } catch(e) {
        console.error(e);
        displayLoginMsg();
    }
}

getData();