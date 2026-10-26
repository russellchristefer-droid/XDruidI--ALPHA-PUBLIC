# Standing orders

XDruid I (Assay Homestead in code) is an alpha homestead for a desktop browser.

- The only live URL is https://xdruidi.grok.me. Nothing else counts.
- Cloudflare is the edge in front of that host. HTML is `cache-control: no-store` and Cloudflare marks it DYNAMIC. Do not add a Worker, Pages project, `wrangler.toml`, tunnel, or a second domain.
- The grok.me zone is not this repository's Cloudflare account. Do not change DNS or purge that cache.
- The owner publishes. Do not publish or patch the live site.
- A phone or tablet is told to use a computer. Do not bring back a mobile build.
- Save key stays `assay-homestead-v2`. Never delete a save from load, quarantine, or New homestead.
- Art credit stays: Farm Life Pixel Art Pack by sophi-x-x. Do not ship the raw pack.
- `stun:stun.cloudflare.com:3478` is a WebRTC STUN address only. It is not hosting.
