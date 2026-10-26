# Standing orders

XDruid I (Assay Homestead in code) is an alpha homestead for a desktop browser.

- The canonical site is https://xdruidi.grok.me. The owner publishes that one. Nothing else replaces it.
- Extra production addresses, all the same Vercel project `xdruidialpha`, must stay on the latest public `main` build: https://xdruidialpha.vercel.app, https://xdruidialpha-russellchristefer-3584.vercel.app, and https://xdruidialpha-git-main-russellchristefer-3584.vercel.app. A push to public `main` updates all three. Do not add a second Vercel project or a second build.
- Cloudflare is the edge in front of xdruidi.grok.me. HTML is `cache-control: no-store` and Cloudflare marks it DYNAMIC. Do not add a Worker, Pages project, `wrangler.toml`, tunnel, or a domain this account does not own.
- The grok.me zone is not this repository's Cloudflare account. Do not change DNS or purge that cache. druidi.grok.me is not a live address.
- A phone or tablet is told to use a computer. Do not bring back a mobile build.
- Save key stays `assay-homestead-v2`. Never delete a save from load, quarantine, or New homestead.
- Art credit stays: Farm Life Pixel Art Pack by sophi-x-x. Do not ship the raw pack.
- `stun:stun.cloudflare.com:3478` is a WebRTC STUN address only. It is not hosting.
