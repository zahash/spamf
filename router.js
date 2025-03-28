/**
 * @typedef {Object} Route
 * @property {string} file - The HTML file to load for this route.
 * @property {string} [title] - (Optional) The title to set when this route is loaded.
 */

/**
 * Initializes a simple client-side router using the hash-based navigation approach.
 * This router listens for link clicks and hash changes to dynamically update content 
 * without a full page reload.
 *
 * @param {Object.<string, Route>} routes - A mapping of URL paths to route objects.
 *
 * @example
 * initRouter({
 *   404: { file: "404.html", title: "404 - Page Not Found" },
 *   "/": { file: "home.html", title: "Home" },
 *   "/about": { file: "about.html", title: "About" },
 *   "/lorem": { file: "lorem.html", title: "Lorem" }
 * });
 */
export default function initRouter(routes) {
    /**
     * Handles navigation when a user clicks a link.
     * Updates the URL hash without triggering a full page reload.
     *
     * @param {MouseEvent} event - The click event from the navigation link.
     */
    function route(event) {
        const tagName = event.target.tagName;
        const href = event.target.getAttribute("href");

        if (tagName === "A" && href) {
            event.preventDefault();
            window.location.hash = href;
            render();
        }
    }

    /**
     * Loads the appropriate content based on the current URL hash.
     * Fetches the corresponding HTML file and injects it into the page.
     */
    async function render() {
        const path = window.location.hash.slice(1) || "/"; // Remove "#" and default to "/"
        const route = routes[path] || routes[404];

        if (route) {
            const response = await fetch(route.file);
            const html = await response.text();
            document.getElementById("root").innerHTML = html;
            document.title = route.title || "Untitled Page"
        } else {
            document.getElementById("root").innerHTML = "<h1>404 - Page Not Found</h1>";
            document.title = "404 - Page Not Found"
        }
    }

    document.addEventListener("click", route); // Listen for clicks on the entire document
    window.addEventListener("hashchange", render); // Handle back/forward navigation using hashchange
    render(); // initial render on first page load
}
