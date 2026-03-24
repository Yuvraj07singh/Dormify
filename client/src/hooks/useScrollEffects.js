import { useEffect, useRef, useState, useCallback } from "react";

// Hook for scroll-triggered reveal animations
export function useScrollReveal(options = {}) {
    const ref = useRef(null);
    const [isRevealed, setIsRevealed] = useState(false);

    useEffect(() => {
        const element = ref.current;
        if (!element) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsRevealed(true);
                    if (options.once !== false) {
                        observer.unobserve(element);
                    }
                } else if (options.once === false) {
                    setIsRevealed(false);
                }
            },
            {
                threshold: options.threshold || 0.15,
                rootMargin: options.rootMargin || "0px 0px -50px 0px",
            }
        );

        observer.observe(element);
        return () => observer.disconnect();
    }, [options.threshold, options.rootMargin, options.once]);

    return [ref, isRevealed];
}

// Hook for scroll-based fade-out effect (cool disappearing)
export function useScrollFadeOut() {
    const ref = useRef(null);
    const [isFaded, setIsFaded] = useState(false);

    useEffect(() => {
        const element = ref.current;
        if (!element) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                // Fade out when the element is leaving the viewport from the top
                if (!entry.isIntersecting && entry.boundingClientRect.top < 0) {
                    setIsFaded(true);
                } else {
                    setIsFaded(false);
                }
            },
            {
                threshold: [0, 0.5, 1],
                rootMargin: "0px",
            }
        );

        observer.observe(element);
        return () => observer.disconnect();
    }, []);

    return [ref, isFaded];
}

// Hook for parallax scroll effect
export function useParallax(speed = 0.5) {
    const ref = useRef(null);

    useEffect(() => {
        const element = ref.current;
        if (!element) return;

        const handleScroll = () => {
            const rect = element.getBoundingClientRect();
            const scrolled = window.innerHeight - rect.top;
            if (rect.top < window.innerHeight && rect.bottom > 0) {
                const yOffset = scrolled * speed * 0.1;
                element.style.transform = `translateY(${yOffset}px)`;
            }
        };

        window.addEventListener("scroll", handleScroll, { passive: true });
        return () => window.removeEventListener("scroll", handleScroll);
    }, [speed]);

    return ref;
}

// Hook for 3D card tilt effect
export function useCardTilt() {
    const ref = useRef(null);

    const handleMouseMove = useCallback((e) => {
        const card = ref.current;
        if (!card) return;

        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const rotateX = ((y - centerY) / centerY) * -8;
        const rotateY = ((x - centerX) / centerX) * 8;

        card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
    }, []);

    const handleMouseLeave = useCallback(() => {
        const card = ref.current;
        if (!card) return;
        card.style.transform = "perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)";
    }, []);

    useEffect(() => {
        const card = ref.current;
        if (!card) return;

        card.style.transition = "transform 0.3s ease";
        card.addEventListener("mousemove", handleMouseMove);
        card.addEventListener("mouseleave", handleMouseLeave);

        return () => {
            card.removeEventListener("mousemove", handleMouseMove);
            card.removeEventListener("mouseleave", handleMouseLeave);
        };
    }, [handleMouseMove, handleMouseLeave]);

    return ref;
}
