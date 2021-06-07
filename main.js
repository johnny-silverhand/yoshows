const apiURL = "https://api.myshows.me/v2/rpc/"
const yoURL = "https://yohoho.cc/#"

const rootId = "__nuxt"

const observerConfig = {
    childList: true
}

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

const render = () => {
    const path = window.location.pathname
    if (path === "/profile/") {
        renderProfile().catch(error => console.log(error.message))
    } else if (path === "/search/all/") {
        renderSearch().catch(error => console.log(error.message))
    } else if (/view\/\d+\/+$/ig.exec(path)) {
        renderView(path.match(/\d+/g).shift()).catch(error => console.log(error.message))
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

const renderProfile = () => {
    return Promise.all(Array.from(document.getElementsByClassName("Unwatched-showTitle"), item => {
        const showId = item.href.match(/\d+/g).shift()
        const element = Array.from(item.closest("div.Row-container").getElementsByClassName("Unwatched-remain")).pop()
        return fetchQuery(showId).then(result => {
            return {
                id: result,
                element: element,
            }
        })
    })).then(result => result.map(value => createYoNode(value)))
}

const renderSearch = () => {
    return Promise.all(Array.from(document.getElementsByClassName("ShowCol-title"), item => {
        const showId = item.firstElementChild.href.match(/\d+/g).shift()
        const element = Array.from(item.parentElement.getElementsByClassName("ShowCol-titleOriginal")).pop()
        return fetchQuery(showId).then(result => {
            return {
                id: result,
                element: element,
            }
        })
    })).then(result => result.map(value => createYoNode(value)))
}

const renderView = (showId) => {
    return fetchQuery(showId).then(result => {
        const element = Array.from(document.getElementsByClassName("ShowStatusBar-option")).pop()
        return {
            id: result,
            element: element
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
