export const genKey = (payload) => {
    let key = "";

    for (let i = 0; i < 6; i++) {
        key += Math.floor(Math.random() * 6) + 1;
    };

    return key;
};