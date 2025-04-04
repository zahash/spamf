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
 * @param {Object} [options] - Additional options.
 * @param {Object<string, string>} [options.fragments] - Mapping of fragment names to HTML file paths.
 * @returns {{ redirect(href: string): void }} Router instance with `redirect()` function.
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

    /**
     * Resolves all nested fragments within an HTML string before rendering.
     * This prevents layout shifts by fully resolving fragments before insertion.
     *
     * @param {string} html - Raw HTML string of the page template.
     * @returns {Promise<DocumentFragment>} - Fully resolved DOM fragment ready for insertion.
     */
    async function resolvePage(html) {
        /**
         * Recursively resolves <div data-slot="name"> with associated fragments.
         *
         * @param {DocumentFragment | HTMLElement} fragment - DOM fragment to scan and mutate.
         * @returns {Promise<void>}
         */
        async function resolveNestedFragments(fragment) {
            const slots = Array.from(fragment.querySelectorAll("div[data-slot]"));
            if (!slots.length) return;

            await Promise.all(slots.map(async slot => {
                const slotName = slot.getAttribute("data-slot");
                const fragmentPath = fragments[slotName];
                if (!fragmentPath) return;

                try {
                    const response = await fetch(fragmentPath);
                    if (!response.ok) {
                        console.error(`failed to load fragment { ${slotName} : "${fragmentPath}" }`);
                        return;
                    }
                    const html = await response.text();
                    const innerFragment = document.createRange().createContextualFragment(html);
                    await resolveNestedFragments(innerFragment);
                    slot.replaceWith(innerFragment);
                } catch (err) {
                    console.error(`failed to fetch fragment { ${slotName} : "${fragmentPath}" }`);
                    console.error(err);
                }
            }));
        }

        const page = document.createRange().createContextualFragment(html);
        await resolveNestedFragments(page);
        return page;
    }

    /**
     * Loads the appropriate content based on the current URL hash.
     * Fetches the corresponding HTML file, resolves fragments, and injects it into the DOM.
     *
     * @returns {Promise<void>}
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
        const page = await resolvePage(html);
        root.replaceChildren(page);

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
