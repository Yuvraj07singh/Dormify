class MemoryCache {
    constructor(ttlSeconds = 60) {
        this.cache = new Map();
        this.ttl = ttlSeconds * 1000;
    }

    get(key) {
        const item = this.cache.get(key);
        if (!item) return null;

        if (Date.now() > item.expiry) {
            this.cache.delete(key);
            return null;
        }
        return item.value;
    }

    set(key, value, customTtlSeconds) {
        const ttl = customTtlSeconds ? customTtlSeconds * 1000 : this.ttl;
        this.cache.set(key, {
            value,
            expiry: Date.now() + ttl
        });
    }

    del(key) {
        this.cache.delete(key);
    }

    clear() {
        this.cache.clear();
    }
}

const globalCache = new MemoryCache(300); // 5 minutes default

// Express Middleware
const cacheMiddleware = (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') return next();

    // Create a unique cache key based on URL and query params
    const key = `__express__${req.originalUrl || req.url}`;
    
    // Check if we have a cached response
    const cachedBody = globalCache.get(key);
    
    if (cachedBody) {
        // Return cached response instantly
        res.setHeader('X-Cache', 'HIT');
        res.setHeader('Content-Type', 'application/json');
        return res.send(cachedBody);
    } else {
        // Intercept res.send to cache the response before sending
        res.setHeader('X-Cache', 'MISS');
        res.sendResponse = res.send;
        res.send = (body) => {
            // Only cache successful JSON responses
            if (res.statusCode >= 200 && res.statusCode < 300) {
                globalCache.set(key, body);
            }
            res.sendResponse(body);
        };
        next();
    }
};

const invalidateCacheMiddleware = (req, res, next) => {
    // When POST, PUT, DELETE happens on properties, we must clear the cache to show fresh data
    if (req.method !== 'GET') {
        globalCache.clear();
    }
    next();
};

module.exports = { globalCache, cacheMiddleware, invalidateCacheMiddleware };
