/**
 * Creates a reactive signal that can store a value and notify subscribers when updated.
 *
 * @template T
 * @param {T} initialValue - The initial value of the signal.
 * @returns {function(T=): T} A getter/setter function for the signal.
 *   - Calling the getter/setter function without arguments returns the current value.
 *   - Calling the getter/setter function with a new value updates it and notifies subscribers.
 */
export default function signal(initialValue) {
    let value = initialValue;
    let subscribers = [];

    /**
     * Getter/setter function for the signal.
     * - If called without arguments, returns the current value.
     * - If called with a new value, updates it and notifies subscribers.
     *
     * @param {T} [newValue] - The new value to set.
     * @returns {T} The current value after potential update.
     */
    function _signal(newValue) {
        if (arguments.length === 0) return value; // Getter

        if (value !== newValue) {
            value = newValue;
            subscribers.forEach(fn => fn(value));
        }
    }

    /**
     * Subscribes a function to be called when the signal updates.
     *
     * @param {(value: T) => void} fn - The function to run on updates.
     */
    _signal.effect = (fn) => subscribers.push(fn);

    /**
     * Creates a derived signal that updates whenever the original signal changes.
     *
     * @param {(value: T) => U} transform - The transformation function.
     * @returns {function(U=): U} A new reactive signal derived from the original.
     * @template U
     */
    _signal.derive = (transform) => {
        let derived = signal(transform(value));
        _signal.effect(val => derived(transform(val)));
        return derived;
    }

    return _signal;
}

/**
 * Merges multiple signals into a single signal, where the value is a list of the individual values.
 * Whenever any signal updates, the merged signal will also update.
 *
 * @param {...function} signals - The signals to merge.
 * @returns {function([T, U, ...])} A new reactive signal holding a list of the signals' values.
 */
export function merge(...signals) {
    const mergedSignal = signal(signals.map(s => s()));

    // Add effects to update the merged signal when any of the individual signals change
    signals.forEach((s, index) => {
        s.effect(value => {
            const currentValues = [...mergedSignal()];
            currentValues[index] = value;
            mergedSignal(currentValues);
        });
    });

    return mergedSignal;
}
