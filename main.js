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

const log = (error) => console.log(error.message)

const render = () => {
    const path = window.location.pathname
    if (path === "/profile/") {
        renderProfile().catch(log)
    } else if (path === "/search/all/") {
        renderSearch().catch(log)
    } else if (/view\/\d+\/+$/ig.exec(path)) {
        renderView(matchShowId(path)).catch(log)
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
    })
    observer.observe(document.getElementById(rootId), observerConfig)
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
    const promises = Array.from(document.getElementsByClassName("Unwatched-showTitle"), item => {
        const elements = item.closest("div.Row-container").getElementsByClassName("Unwatched-remain")
        return fetchQuery(matchShowId(item.href)).then(id => ({
            id: id,
            element: getLastElement(elements),
        }))
    })
    return Promise.all(promises).then(result => result.map(createYoNode))
}

const renderSearch = () => {
    const promises = Array.from(document.getElementsByClassName("ShowCol-title"), item => {
        const elements = item.parentElement.getElementsByClassName("ShowCol-titleOriginal")
        return fetchQuery(matchShowId(item.firstElementChild.href)).then(id => ({
            id: id,
            element: getLastElement(elements),
        }))
    })
    return Promise.all(promises).then(result => result.map(createYoNode))
}

const renderView = (showId) => fetchQuery(showId).then(id => ({
    id: id,
    element: getLastElement(document.getElementsByClassName("ShowStatusBar-option"))
})).then(createYoNode)


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
