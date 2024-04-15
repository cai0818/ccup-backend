import fetch from "node-fetch";

export const turnstileVerify = async (token, ip) => {
    const url = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
    
    // If dev mode use testing secret key
    const secret = process.env.NODE_ENV === 'development' ? process.env.TURNSTILE_TESTING_SECRET_KEY : process.env.TURNSTILE_PRODUCTION_SECRET_KEY;

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            token,
            secret,
            ip
        })
    }).then(res => res.json());

    if (response.success) {
        return true;
    }

    return false;

}
