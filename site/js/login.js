const form = document.querySelector('#credential-form');
const tokenForm = document.querySelector('#token-form');

form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const data = new URLSearchParams(new FormData(form));
    console.log(data.toString());
    let endpoint;

    switch(data.get('action')) {
        case 'signup':
            endpoint = '.netlify/functions/user-signup';
            break;
        case 'login':
            endpoint = '.netlify/functions/user-login';
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

        console.log(respJson);
    } catch(e) {
        console.error(e);
    }
});

tokenForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const data = new URLSearchParams(new FormData(tokenForm));
    let endpoint;
    
    switch(event.submitter.name) {
        case 'verify':
            endpoint = '.netlify/functions/get-message-authed';
            break;
        case 'refresh':
            endpoint = '.netlify/functions/refresh-auth';
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

        console.log(respJson);
    } catch(e) {
        console.error(e);
    }
});