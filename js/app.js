const util = (() => {
    const timer = () => {
        const el = document.getElementById("date");
        if (!el) return;

        const countDownDate = new Date(el.getAttribute("data-date").replace(" ", "T")).getTime();

        const tick = () => {
            const distance = Math.abs(countDownDate - Date.now());
            document.getElementById("day").textContent = Math.floor(distance / (1000 * 60 * 60 * 24));
            document.getElementById("hour").textContent = Math.floor(
                (distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
            );
            document.getElementById("minute").textContent = Math.floor(
                (distance % (1000 * 60 * 60)) / (1000 * 60)
            );
            document.getElementById("seconds").textContent = Math.floor((distance % (1000 * 60)) / 1000);
        };

        tick();
        setInterval(tick, 1000);
    };

    const play = (btn) => {
        if (btn.getAttribute("data-status") !== "true") {
            btn.setAttribute("data-status", "true");
            audio.play();
            btn.innerHTML = '<i class="fa-solid fa-circle-pause"></i>';
        } else {
            btn.setAttribute("data-status", "false");
            audio.pause();
            btn.innerHTML = '<i class="fa-solid fa-circle-play"></i>';
        }
    };

    const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    const openinvite = async (button) => {
        if (button.disabled) return;
        button.disabled = true;

        const welcome = document.getElementById("welcome");
        const envelope = document.getElementById("envelope");
        if (!welcome || !envelope) return;

        // 1) Seal press → flap opens (CSS). Card stays fully tucked until flap clears.
        envelope.classList.remove("is-closed");
        envelope.classList.add("is-opening");
        button.setAttribute("aria-hidden", "true");

        // Flap: 700ms. Then letter may rise.
        await wait(720);
        envelope.classList.add("is-open");

        // 2) Card slide-out: 1450ms (matches --card-ms).
        await wait(1550);

        // 3) Page reveal — same post-open behavior as before.
        welcome.classList.add("is-hiding");

        const musicBtn = document.getElementById("music");
        musicBtn.classList.add("is-visible");
        audio.play().catch(() => {});
        timer();
        observeReveals();

        setTimeout(() => welcome.remove(), 700);

        if (typeof confetti === "function") {
            await confetti({
                particleCount: 80,
                spread: 70,
                origin: { y: 0.72 },
                colors: ["#5c2a32", "#c9a45c", "#f3e6c8", "#8a6a32"],
            });
        }
    };

    const observeReveals = () => {
        const nodes = document.querySelectorAll("[data-reveal]");
        if (!("IntersectionObserver" in window)) {
            nodes.forEach((n) => n.classList.add("is-visible"));
            return;
        }

        const scroller = document.querySelector("main");
        const io = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add("is-visible");
                        io.unobserve(entry.target);
                    }
                });
            },
            { root: scroller || null, threshold: 0.18 }
        );

        nodes.forEach((n) => io.observe(n));
    };

    return { openinvite, play };
})();

const audio = (() => {
    let audioEl = null;

    const singleton = () => {
        if (!audioEl) {
            audioEl = new Audio();
            audioEl.src = document.getElementById("music").getAttribute("data-url");
            audioEl.loop = true;
            audioEl.volume = 1;
            audioEl.load();
        }
        return audioEl;
    };

    return {
        play: () => singleton().play(),
        pause: () => singleton().pause(),
    };
})();

document.addEventListener("DOMContentLoaded", () => {
    const scroller = document.querySelector("main");
    document.querySelector(".nav-bottom")?.addEventListener("click", (e) => {
        const link = e.target.closest('a[href^="#"]');
        if (!link || !scroller) return;
        const target = document.getElementById(link.getAttribute("href").slice(1));
        if (!target) return;
        e.preventDefault();
        target.scrollIntoView({ behavior: "smooth", block: "start" });
    });
});
