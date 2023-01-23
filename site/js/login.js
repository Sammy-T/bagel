const form = document.querySelector('#credential-form');
const responseArea = document.querySelector('#response');
const templateError = document.querySelector('#template-error');

function displayError(err) {
    const errorDisplay = templateError.content.firstElementChild.cloneNode(true);
    errorDisplay.textContent = (err.status < 500) ? 'Invalid credentials' : 'Server Error';

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
            console.warn('Login/Signup error', respJson);

            const error = new Error(respJson.error || 'Network response was not ok.');
            error.status = respJson.code;
            throw error;
        }

        // Currently Vite requires trailing slash for nested index files in dev
        // https://github.com/vitejs/vite/issues/6596
        location.href = '/members/';
    } catch(e) {
        console.error(e);
        displayError(e);
    }
});