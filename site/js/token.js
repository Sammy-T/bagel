const tokenForm = document.querySelector('#token-form');

tokenForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const data = new URLSearchParams(new FormData(tokenForm));
    let endpoint;
    
    switch(event.submitter.name) {
        case 'verify':
            endpoint = '/.netlify/functions/get-message-authed';
            break;
        case 'refresh':
            endpoint = '/.netlify/functions/refresh-auth';
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