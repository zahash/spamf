/**
 * Initializes a simple client-side router using the hash-based navigation approach.
 * This router listens for link clicks and hash changes to dynamically update content 
 * without a full page reload.
 *
 * @param {Object} routes - A mapping of URL paths to corresponding HTML file paths.
 * Example:
 * {
 *   404: "404.html",
 *   "/": "home.html",
 *   "/about": "about.html"
 * }
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

        const response = await fetch(route);
        const html = await response.text();
        document.getElementById("main").innerHTML = html;
    }

    document.addEventListener("click", route); // Listen for clicks on the entire document
    window.addEventListener("hashchange", render); // Handle back/forward navigation using hashchange
    render(); // initial render on first page load
}
