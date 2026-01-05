import { useEffect, useState } from "react";

export default function InstallButton() {
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const handler = (e) => {
            e.preventDefault();
            setDeferredPrompt(e);
            setVisible(true);
        };

        window.addEventListener("beforeinstallprompt", handler);

        return () => window.removeEventListener("beforeinstallprompt", handler);
    }, []);

    const installApp = async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        await deferredPrompt.userChoice;
        setVisible(false);
    };

    if (!visible) return null;

    return (
        <button
            onClick={installApp}
            className="w-full px-4 py-2.5 rounded-xl bg-gradient-to-r from-brand-purple to-brand-pink text-white text-sm font-semibold shadow-sm hover:shadow-md transition-all duration-300 active:scale-95"
        >
            Install App
        </button>
    );
}
