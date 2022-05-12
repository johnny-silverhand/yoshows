const bhcheshId = 1;
const bhcheshToken = ``;

const myshowsApi = (method, params) => {
    return fetch(`https://api.myshows.me/v2/rpc/`, {
        method: `POST`,
        mode: `cors`,
        cache: `no-cache`,
        credentials: `same-origin`,
        headers: {
            "Content-Type": `application/json;charset=utf-8`
        },
        redirect: `follow`,
        referrerPolicy: `no-referrer`,
        body: JSON.stringify({
            jsonrpc: `2.0`,
            method: method,
            params: params,
            id: 1
        })
    }).then(response => response.json());
}

const bhcheshApi = (kinopoiskId) => {
    const uri = {
        baseURL: `https://api${bhcheshId}.bhcesh.me`,
        method: `list`,
        params: new URLSearchParams({
            token: `${bhcheshToken}`,
            kinopoisk_id: kinopoiskId
        })
    };
    return fetch(`${uri.baseURL}/${uri.method}?${uri.params.toString()}`, {
        method: `GET`,
        mode: `cors`,
        cache: `no-cache`,
        credentials: `same-origin`,
        headers: {
            "Content-Type": `application/json;charset=utf-8`
        },
        redirect: `follow`,
        referrerPolicy: `no-referrer`,
    }).then(response => response.json());
}

const log = (message, level = 'default') => {
    const pickColor = () => {
        switch (level) {
            case 'error':
                return {
                    background: `#be2626`,
                    text: `#ffffff`
                }
            case 'warning':
                return {
                    background: `#b4a01e`,
                    text: `#ffffff`
                }
            case 'info':
                return {
                    background: `#15a0a9`,
                    text: `#ffffff`
                }
            default:
                return {
                    background: `#ffffff`,
                    text: `#000000`
                }
        }
    }

    const titleStyle = `
        background: ${`#555555`};
        color: ${`#bada55`};
    `;

    const messageStyle = `
        background: ${pickColor().background};
        color: ${pickColor().text};
    `;

    console.log(`%c YoShows: %c ${message} `, titleStyle, messageStyle);
}

const observe = () => {
    const observer = new MutationObserver(mutations => {
        for (let mutation of mutations) {
            Array.from(mutation.removedNodes, node => {
                if (node.classList.contains(`nuxt-progress`)) {
                    init().catch((error) => log(error.message, `error`));
                }
            });
        }
    });
    observer.observe(document.getElementById(`__nuxt`), {childList: true});
    return init();
}

const init = async () => {
    log(`▶️ init.`, `info`);
    const viewRegex = /\/view\/(\d+)/i
    const episodeRegex = /\/episode\/(\d+)/i

    const matchRegex = (regex) => (window.location.href.match(regex)?.length ?? 0) === 2;
    const parseMyReviewsResponse = (data) => {
        return {
            kinopoiskId: data?.result?.kinopoiskId ?? undefined,
            seasonNumber: data?.result?.seasonNumber ?? undefined,
            episodeNumber: data?.result?.episodeNumber ?? undefined
        }
    }

    let MyReviewsData = undefined;
    if (matchRegex(viewRegex)) {
        const [_, showId] = window.location.href.match(viewRegex);
        MyReviewsData = await myshowsApi(`shows.GetById`, {showId: showId, withEpisodes: true})
            .then(parseMyReviewsResponse);

    } else if (matchRegex(episodeRegex)) {
        const [_, episodeId] = window.location.href.match(episodeRegex);
        MyReviewsData = await myshowsApi(`shows.Episode`, {id: episodeId})
            .then(async episodeResponse => {
                const showResponse = await myshowsApi(`shows.GetById`, {
                    showId: episodeResponse.result.showId,
                    withEpisodes: true
                })
                return {
                    ...parseMyReviewsResponse(episodeResponse),
                    kinopoiskId: parseMyReviewsResponse(showResponse).kinopoiskId
                }
            });

    } else {
        throw new Error(`⚠️ current page is not available.`);
    }
    log(`✅ page is available.`, `info`);

    if (MyReviewsData === undefined || MyReviewsData.kinopoiskId === undefined) {
        throw new Error(`⚠️ kinopoisk_id not found.`);
    }
    log(`✅ kinopoisk_id found.`, `info`);

    const playerURL = await bhcheshApi(MyReviewsData.kinopoiskId).then(response => {
        const {results} = response;
        if (Array.isArray(results) && results.length > 0) {
            const {iframe_url} = results.shift();
            if (!iframe_url || iframe_url.length === 0) {
                return undefined;
            }
            const params = new URLSearchParams({
                season: `${MyReviewsData.seasonNumber ?? 1}`,
                episode: `${MyReviewsData.episodeNumber ?? 1}`
            });
            return `${iframe_url}?${params.toString()}`;
        }
        return undefined;
    });

    if (playerURL === undefined) {
        throw new Error(`⚠ playerURL not found.`);
    }
    log(`✅ playerURL found.`, `info`);

    let picture = document.querySelector(`.PicturePoster-picture`);
    let placeholder = document.querySelector(`.PicturePoster-placeholder`);
    if (picture) {
        picture.innerHTML = `<iframe src=${playerURL}></iframe>`
    } else if (placeholder) {
        placeholder.innerHTML = `<iframe src=${playerURL}></iframe>`
        log(`⚠️ .PicturePoster-picture not found.`, `warning`);
    } else {
        log(`⚠️ .PicturePoster-placeholder not found.`, `warning`);
    }
}
log(`▶️ Script has been started.`, `info`);
observe().catch((error) => log(error.message, `error`));
