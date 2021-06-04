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

    static watch() {
        const observer = new MutationObserver((mutations, observer) => {
            for (let mutation of mutations) {
                Array.from(mutation.removedNodes, node => {
                    if (node.classList.contains("nuxt-progress")) {
                        const path = window.location.pathname
                        if (path === "/profile/") {
                            Yo.renderProfile().catch(error => console.log(error))
                        } else if (/view\/\d+\/+$/ig.exec(path)) {
                            Yo.renderView(path.match(/\d+/g).shift()).catch(error => console.log(error))
                        }
                    }
                })
            }
        });
        observer.observe(document.getElementById(this.rootId), this.observerConfig);
    }

    static fetchQuery(showId) {
        return fetch(this.apiURL, this.fetchOptions(showId))
            .then(response => response.json())
            .then(data => data.result.kinopoiskId)
    }

    static renderProfile() {
        return Promise.all(Array.from(document.getElementsByClassName("Unwatched-showTitle"), item => {
            const showId = item.href.match(/\d+/g).shift()
            return this.fetchQuery(showId).then(result => {
                return {
                    id: result,
                    element: item.closest("div.Row-container")
                }
            })
        })).then(r => console.log(r))
    }

    static renderView(showId) {
        return this.fetchQuery(showId).then(result => {
            const element = Array.from(document.getElementsByClassName("ShowStatusBar-list")).shift()
            return {
                id: result,
                element: element.lastChild
            }
        }).then(r => console.log(r))
    }
}

Yo.watch()
