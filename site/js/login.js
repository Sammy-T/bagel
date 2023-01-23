const form = document.querySelector('#credential-form');
const responseArea = document.querySelector('#response');
const templateError = document.querySelector('#template-error');

function displayError() {
    const errorDisplay = templateError.content.cloneNode(true);
    responseArea.innerHTML = '';
    responseArea.append(errorDisplay);
}

form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const data = new URLSearchParams(new FormData(form));
    console.log(data.toString());
    let endpoint;

    switch(data.get('action')) {
        case 'signup':
            endpoint = '/.netlify/functions/user-signup';
            break;
        case 'login':
            endpoint = '/.netlify/functions/user-login';
            break;
    }
    
    try {
        const resp = await fetch(endpoint, {
            method: 'post',
            body: data
        });
        const respJson = await resp.json();
        
        if(!resp.ok) {
            console.warn(respJson);
            throw new Error('Network response was not ok.');
        }

        // Currently Vite requires trailing slash for nested index files in dev
        // https://github.com/vitejs/vite/issues/6596
        location.href = '/members/';
    } catch(e) {
        console.error(e);
        displayError();
    }
});