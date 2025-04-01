/**
 * @typedef {Object} Route
 * @property {string} template - The path to the HTML file for the route.
 * @property {string} [title] - The title of the page (optional).
 * @property {string[]} [styles] - List of CSS files to load for the route (optional).
 * @property {string[]} [scripts] - List of JavaScript files to load for the route (optional).
 */

/**
 * Initializes a simple client-side router using hash-based navigation.
 * Dynamically loads HTML content, styles, and scripts based on the current route.
 *
 * @param {Object<string, Route>} routes - A mapping of URL paths to route configurations.
 * Example:
 * {
 *   404: { template: "404.html", title: "Page Not Found" },
 *   "/": { template: "home.html", title: "Home", styles: ["home.css"], scripts: ["home.js"] },
 *   "/about": { template: "about.html", title: "About", styles: ["about.css"], scripts: ["about.js"] }
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

        if (tagName === "A" && href && href.startsWith("#")) {
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
            const response = await fetch(route.template);
            const html = await response.text();
            document.getElementById("root").innerHTML = html;
            document.title = route.title || "Untitled Page";

            // Convert all internal `<a>` links (starting with `/`) to hash-based routes.
            document.querySelectorAll("a[href]").forEach(anchor => {
                const href = anchor.getAttribute("href");
                if (href.startsWith("/")) {
                    anchor.setAttribute("href", `#${href}`);
                }
            });

            document.querySelectorAll("link[data-dynamic-style]").forEach(link => link.remove());
            (route.styles || []).forEach(css => {
                const link = document.createElement("link");
                link.rel = "stylesheet";
                link.href = css;
                link.setAttribute("data-dynamic-style", ""); // Mark as dynamically loaded
                document.head.appendChild(link);
            });

            document.querySelectorAll("script[data-dynamic-script]").forEach(script => script.remove());
            (route.scripts || []).forEach(src => {
                const script = document.createElement("script");
                script.src = src;
                script.setAttribute("data-dynamic-script", ""); // Mark as dynamically loaded
                script.defer = true;
                document.body.appendChild(script);
            });
        } else {
            document.getElementById("root").innerHTML = "<h1>404 - Page Not Found</h1>";
            document.title = "404 - Page Not Found"
        }
    }

    document.addEventListener("click", route); // Listen for clicks on the entire document
    window.addEventListener("hashchange", render); // Handle back/forward navigation using hashchange
    render(); // initial render on first page load
}
