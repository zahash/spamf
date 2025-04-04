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
export default function initRouter(routes, options = {}) {
    const { fragments = {} } = options;

    /**
     * Handles navigation when a user clicks a link.
     * Updates the URL hash without triggering a full page reload.
     *
     * @param {MouseEvent} event - The click event from the navigation link.
     */
    function route(event) {
        const anchor = event.target.closest("a[href]");
        if (!anchor) return;

        const href = anchor.getAttribute("href");
        if (href.startsWith("#")) {
            event.preventDefault();
            window.location.hash = href; // hashchange triggers render
        }
    }

    async function resolveFragments(element) {
        const slots = Array.from(element.querySelectorAll("div[data-slot]"));
        if (!slots.length) return;

        await Promise.all(slots.map(async slot => {
            const slotName = slot.getAttribute("data-slot");
            const fragment = fragments[slotName];
            if (!fragment) return;

            try {
                const response = await fetch(fragment);
                if (!response.ok) {
                    console.error(`failed to load fragment "${fragment}"`);
                    return;
                }
                const html = await response.text();
                slot.outerHTML = html;
            } catch (err) {
                console.error(`failed to fetch fragment "${fragment}"`);
                console.error(err);
            }
        }));

        await resolveFragments(element);
    }

    /**
     * Loads the appropriate content based on the current URL hash.
     * Fetches the corresponding HTML file and injects it into the page.
     */
    async function render() {
        await (window.spamf.onUnmount || (async () => { }))();
        delete window.spamf.onUnmount; // reset the hook

        const path = window.location.hash.slice(1) || "/"; // Remove "#" and default to "/"
        const route = routes[path] || routes[404];

        const root = document.getElementById("root");

        if (!route) {
            root.innerHTML = "<h1>404 - Page Not Found</h1>";
            document.title = "404 - Page Not Found";
            return;
        }

        document.title = route.title || "Untitled Page";

        const response = await fetch(route.template);
        const html = await response.text();
        root.innerHTML = html;

        await resolveFragments(root); // inject fragments into slots

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
        await Promise.all((route.scripts || []).map(src => new Promise((resolve) => {
            const script = document.createElement("script");
            script.src = src;
            script.defer = true;
            if (src.endsWith(".mjs")) script.type = "module";
            script.setAttribute("data-dynamic-script", "");
            script.onload = () => resolve();
            script.onerror = () => {
                console.error(`failed to load script: ${src}`);
                resolve();
            };
            document.body.appendChild(script);
        })));

        await (window.spamf.onMount || (async () => { }))();
        delete window.spamf.onMount;  // reset the hook
    }

    /**
     * Prefetches content when hovering over a link with `data-prefetch`.
     *
     * @param {MouseEvent | TouchEvent} event - The event triggered by hovering or touching a link.
     */
    function prefetch(event) {
        const anchor = event.target.closest("a[data-prefetch][href]");
        if (!anchor) return;

        const href = anchor.getAttribute("href");
        if (!href.startsWith("#")) return;

        const path = href.slice(1) || "/"; // Remove "#" and default to "/"
        const route = routes[path] || routes[404];

        if (route) fetch(route.template);
    }

    window.spamf = {}; // namespace

    document.addEventListener("click", route); // Listen for clicks on the entire document
    document.addEventListener("mouseover", prefetch);
    document.addEventListener("touchstart", prefetch); // `touchstart` for Mobile support
    window.addEventListener("hashchange", render); // Handle back/forward navigation using hashchange

    render(); // initial render on first page load

    return {
        redirect: (href) => { window.location.hash = href; }
    }
}
