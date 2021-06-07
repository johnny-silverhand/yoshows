class Yo {
    static apiURL = "https://api.myshows.me/v2/rpc/"
    static yoURL = "https://yohoho.cc/#"

    static rootId = "__nuxt"

    static observerConfig = {
        childList: true
    }

    static fetchOptions(showId) {
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

    static render() {
        const path = window.location.pathname
        if (path === "/profile/") {
            Yo.renderProfile().catch(error => console.log(error.message))
        } else if (path === "/search/all/") {
            Yo.renderSearch().catch(error => console.log(error.message))
        } else if (/view\/\d+\/+$/ig.exec(path)) {
            Yo.renderView(path.match(/\d+/g).shift()).catch(error => console.log(error.message))
        }
    }

    static watch() {
        const observer = new MutationObserver((mutations, observer) => {
            for (let mutation of mutations) {
                Array.from(mutation.removedNodes, node => {
                    if (node.classList.contains("nuxt-progress")) {
                        this.render()
                    }
                })
            }
        });
        observer.observe(document.getElementById(this.rootId), this.observerConfig);
        this.render()
    }

    static fetchQuery(showId) {
        return fetch(this.apiURL, this.fetchOptions(showId))
            .then(response => response.json())
            .then(data => data.result.kinopoiskId)
    }

    static renderProfile() {
        return Promise.all(Array.from(document.getElementsByClassName("Unwatched-showTitle"), item => {
            const showId = item.href.match(/\d+/g).shift()
            const element = Array.from(item.closest("div.Row-container").getElementsByClassName("Unwatched-remain")).pop()
            return this.fetchQuery(showId).then(result => {
                return {
                    id: result,
                    element: element,
                }
            })
        })).then(result => result.map(value => this.createYoNode(value)))
    }

    static renderSearch() {
        return Promise.all(Array.from(document.getElementsByClassName("ShowCol-title"), item => {
            const showId = item.firstElementChild.href.match(/\d+/g).shift()
            const element = Array.from(item.parentElement.getElementsByClassName("ShowCol-titleOriginal")).pop()
            return this.fetchQuery(showId).then(result => {
                return {
                    id: result,
                    element: element,
                }
            })
        })).then(result => result.map(value => this.createYoNode(value)))
    }

    static renderView(showId) {
        return this.fetchQuery(showId).then(result => {
            const element = Array.from(document.getElementsByClassName("ShowStatusBar-option")).pop()
            return {
                id: result,
                element: element
            }
        }).then(r => this.createYoNode(r))
    }

    static createYoNode(data) {
        if (data.element.dataset.id === data.id.toString()) {
            return
        }
        const a = document.createElement('a')
        a.setAttribute('data-id', data.id)
        a.setAttribute('target', '_blank')
        a.setAttribute('href', this.yoURL + data.id)
        a.classList.add(data.element.classList.item(0))
        const span = document.createElement('span')
        span.innerText = 'Смотреть на Yohoho'
        a.append(span)
        return data.element.after(a)
    }
}

Yo.watch()
