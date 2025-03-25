import initRouter from '../../hash-router.js';
import signal from "../../signal.js";

initRouter({
    404: "404.html",
    "/": "home.html",
    "/about": "about.html",
    "/lorem": "lorem.html"
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
