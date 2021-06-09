const apiURL = "https://api.myshows.me/v2/rpc/"
const yoURL = "https://yohoho.cc/#"

const rootId = "__nuxt"

const observerConfig = {
    childList: true
}

const numbersPattern = /\d+/g

const fetchOptions = (showId) => {
    return {
        method: "POST",
        mode: "cors",
        cache: "no-cache",
        credentials: "same-origin",
        headers: {
            "Content-Type": "application/json;charset=utf-8"
        },
        redirect: "follow",
        referrerPolicy: "no-referrer",
        body: JSON.stringify({
            jsonrpc: "2.0",
            method: "shows.GetById",
            params: {
                showId: showId,
                withEpisodes: false
            },
            id: 1
        })
    }
}

const log = (error) => {
    return console.log(error.message)
}

const render = () => {
    const path = window.location.pathname
    if (path === "/profile/") {
        renderProfile().catch(error => log(error))
    } else if (path === "/search/all/") {
        renderSearch().catch(error => log(error))
    } else if (/view\/\d+\/+$/ig.exec(path)) {
        renderView(matchShowId(path)).catch(error => log(error))
    }
}

const watch = () => {
    const observer = new MutationObserver((mutations, observer) => {
        for (let mutation of mutations) {
            Array.from(mutation.removedNodes, node => {
                if (node.classList.contains("nuxt-progress")) {
                    render()
                }
            })
        }
    });
    observer.observe(document.getElementById(rootId), observerConfig);
    render()
}

const fetchQuery = (showId) => {
    return fetch(apiURL, fetchOptions(showId))
        .then(response => response.json())
        .then(data => data.result.kinopoiskId)
}

const matchShowId = (href) => {
    const [showId, ...trash] = href.match(numbersPattern)
    return showId
}

const getLastElement = (htmlElements) => {
    const elements = Array.from(htmlElements)
    return elements[elements.length - 1]
}

const renderProfile = () => {
    return Promise.all(Array.from(document.getElementsByClassName("Unwatched-showTitle"), item => {
        return fetchQuery(matchShowId(item.href)).then(result => {
            return {
                id: result,
                element: getLastElement(item.closest("div.Row-container").getElementsByClassName("Unwatched-remain")),
            }
        })
    })).then(result => result.map(value => createYoNode(value)))
}

const renderSearch = () => {
    return Promise.all(Array.from(document.getElementsByClassName("ShowCol-title"), item => {
        return fetchQuery(matchShowId(item.firstElementChild.href)).then(result => {
            return {
                id: result,
                element: getLastElement(item.parentElement.getElementsByClassName("ShowCol-titleOriginal")),
            }
        })
    })).then(result => result.map(value => createYoNode(value)))
}

const renderView = (showId) => {
    return fetchQuery(showId).then(result => {
        return {
            id: result,
            element: getLastElement(document.getElementsByClassName("ShowStatusBar-option"))
        }
    }).then(r => createYoNode(r))
}

const createYoNode = (data) => {
    if (data.element.dataset.id === data.id.toString()) {
        return
    }
    const a = document.createElement('a')
    a.setAttribute('data-id', data.id)
    a.setAttribute('target', '_blank')
    a.setAttribute('href', yoURL + data.id)
    a.classList.add(data.element.classList.item(0))
    const span = document.createElement('span')
    span.innerText = 'Смотреть на Yohoho'
    a.append(span)
    return data.element.after(a)
}

watch()
