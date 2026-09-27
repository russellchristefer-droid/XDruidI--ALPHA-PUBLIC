# Security

XDruid I is a browser game. The playable yard is client-side. Treat the repository and any hosted copy as a public game, not a place for secrets.

## Reporting

Report a security problem privately to the repository owner. Use GitHub private security reporting on this repository if it is enabled. Do not open a public issue that includes a working exploit, a stolen token, or step-by-step attack instructions.

Say what you tried, what you expected, and what happened. Allow a reasonable time to fix it before you describe it in public.

## What this project does not want in git

- Passwords, API keys, session cookies, or `.env` files with real secrets
- Private player saves
- Copies of third-party art packaged so other people can reuse the raw files on their own

## What you should expect

- The homestead save lives in your browser. Anyone who can use that browser profile can open the save. Use a device you trust.
- Sign-in, if the host turns it on, uses a session cookie. Do not paste that cookie into chat or issues.
- Assets are loaded from the same site as the game. A phone should open the HTTPS (or local dev) page in a browser. A link that your phone tries to open as an application is the wrong kind of link.

## Hardening already in the client

- Sprite and sound loads that fail do not freeze the title. The game continues without that one file.
- Phones draw the yard at a lower pixel ratio and load pictures in a smaller queue so the page can start.
- Portal, rock, sky, and island plates are drawn once and reused, instead of rebuilding them every frame.
