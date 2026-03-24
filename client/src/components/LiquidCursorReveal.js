import { useEffect, useRef, useCallback } from "react";

/**
 * LiquidCursorReveal
 * ──────────────────
 * A full-viewport canvas overlay that paints softly glowing,
 * organically fading "liquid blobs" wherever the user moves their cursor.
 * When the cursor leaves the section, every blob gracefully dissolves.
 * 
 * The canvas is pointer-events:none so all clicks pass through to content below.
 * Mouse tracking is done on the parent element.
 */

const BLOB_RADIUS = 130;
const BLOB_LIFETIME = 1.8;
const SPAWN_INTERVAL = 35;
const MAX_BLOBS = 70;

const COLORS = [
    [99, 102, 241, 0.30],    // indigo
    [139, 92, 246, 0.28],    // violet
    [6, 182, 212, 0.22],     // cyan
    [168, 85, 247, 0.28],    // purple
    [59, 130, 246, 0.25],    // blue
    [236, 72, 153, 0.20],    // pink
];

export default function LiquidCursorReveal() {
    const canvasRef = useRef(null);
    const blobsRef = useRef([]);
    const mouseRef = useRef({ x: -9999, y: -9999, active: false });
    const lastSpawnRef = useRef(0);
    const rafRef = useRef(null);

    const pickColor = useCallback(() => COLORS[Math.floor(Math.random() * COLORS.length)], []);

    const spawnBlob = useCallback((x, y) => {
        const now = performance.now();
        if (now - lastSpawnRef.current < SPAWN_INTERVAL) return;
        lastSpawnRef.current = now;

        if (blobsRef.current.length >= MAX_BLOBS) {
            blobsRef.current.shift();
        }

        const [r, g, b, a] = pickColor();
        blobsRef.current.push({
            x,
            y,
            r: BLOB_RADIUS * (0.5 + Math.random() * 0.9),
            cr: r, cg: g, cb: b, ca: a,
            born: now,
            lifetime: BLOB_LIFETIME * 1000 * (0.7 + Math.random() * 0.6),
            vx: (Math.random() - 0.5) * 0.4,
            vy: (Math.random() - 0.5) * 0.4,
        });
    }, [pickColor]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");

        // The parent section is what we listen on for mouse events
        const parent = canvas.parentElement;
        if (!parent) return;

        const resize = () => {
            canvas.width = parent.offsetWidth;
            canvas.height = parent.offsetHeight;
        };
        resize();
        window.addEventListener("resize", resize);

        // Listen on the PARENT (not canvas) so pointer-events:none on canvas is fine
        const onMove = (e) => {
            const rect = parent.getBoundingClientRect();
            mouseRef.current.x = e.clientX - rect.left;
            mouseRef.current.y = e.clientY - rect.top;
            mouseRef.current.active = true;
            spawnBlob(mouseRef.current.x, mouseRef.current.y);
        };

        const onLeave = () => {
            mouseRef.current.active = false;
        };

        parent.addEventListener("mousemove", onMove);
        parent.addEventListener("mouseleave", onLeave);

        const animate = () => {
            const now = performance.now();
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            if (mouseRef.current.active) {
                spawnBlob(mouseRef.current.x, mouseRef.current.y);
            }

            blobsRef.current = blobsRef.current.filter((blob) => {
                const age = now - blob.born;
                const progress = age / blob.lifetime;
                if (progress >= 1 || !Number.isFinite(progress)) return false;

                // Smooth ease-out fade
                const alpha = Math.max(0, Math.min(1, 1 - Math.pow(progress, 0.5)));

                // Organic drift
                blob.x += blob.vx;
                blob.y += blob.vy;
                // Grow slightly as it ages
                const currentR = Math.max(1, blob.r * (1 + progress * 0.5));

                // Clamp alpha values to valid range and guard against NaN
                const a1 = Math.max(0, Math.min(1, (alpha * (blob.ca || 0))));
                const a2 = Math.max(0, Math.min(1, (alpha * (blob.ca || 0) * 0.3)));

                if (!Number.isFinite(a1) || !Number.isFinite(a2)) return false;

                // Draw radial gradient blob
                const gradient = ctx.createRadialGradient(
                    blob.x, blob.y, 0,
                    blob.x, blob.y, currentR
                );

                gradient.addColorStop(0, `rgba(${blob.cr},${blob.cg},${blob.cb},${a1.toFixed(4)})`);
                gradient.addColorStop(0.4, `rgba(${blob.cr},${blob.cg},${blob.cb},${a2.toFixed(4)})`);
                gradient.addColorStop(1, `rgba(${blob.cr},${blob.cg},${blob.cb},0)`);

                ctx.beginPath();
                ctx.arc(blob.x, blob.y, currentR, 0, Math.PI * 2);
                ctx.fillStyle = gradient;
                ctx.fill();

                return true;
            });

            rafRef.current = requestAnimationFrame(animate);
        };

        rafRef.current = requestAnimationFrame(animate);

        return () => {
            window.removeEventListener("resize", resize);
            parent.removeEventListener("mousemove", onMove);
            parent.removeEventListener("mouseleave", onLeave);
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
        };
    }, [spawnBlob]);

    return (
        <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full z-[1]"
            style={{ pointerEvents: "none", mixBlendMode: "screen" }}
        />
    );
}

