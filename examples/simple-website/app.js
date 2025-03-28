import initRouter from '../../router.js';
import signal from "../../signal.js";

initRouter({
    404: { file: "404.html", title: "404 - Page Not Found" },
    "/": { file: "home.html", title: "Home" },
    "/about": { file: "about.html" },
    "/lorem": { file: "lorem.html", title: "Lorem" }
});

let state = signal({
    "foo": "bar",
    1: 2
});
let state2 = state.derive(obj => obj[1] + 1);
let state3 = signal([1, 2, 3]);

state.effect(val => console.log("STATE", val));
state2.effect(val => console.log("STATE2", val));
state3.effect(val => console.log("STATE3", val));

state({
    ...state(),
    1: 10,
});
