import initRouter from '../../router.js';
import signal, { merge } from "../../signal.js";

initRouter({
    404: { template: "404.html", title: "404 - Page Not Found" },
    "/": { template: "home.html", title: "Home" },
    "/about": { template: "about.html" },
    "/lorem": { template: "lorem.html", title: "Lorem" }
});

let state = signal({
    "foo": "bar",
    1: 2
});
let state2 = state.derive(obj => obj[1] + 1);
let state3 = signal([1, 2, 3]);
let mergedState = merge({ state, state2, state3 });
let state4 = mergedState.derive(obj => obj["state2"] * 10);

state.effect(val => console.log("STATE", val));
state2.effect(val => console.log("STATE2", val));
state3.effect(val => console.log("STATE3", val));
mergedState.effect(val => console.log("MERGED", val));
state4.effect(val => console.log("STATE4", val));

state({
    ...state(),
    1: 10,
});
