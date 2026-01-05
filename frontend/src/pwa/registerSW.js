export function registerSW() {
    if ("serviceWorker" in navigator) {
        window.addEventListener("load", () => {
            navigator.serviceWorker.register("/tracker/sw.js");
        });
    }
}
