# Linkscope — URL Sandbox

A small, static URL inspection and preview tool designed for GitHub Pages. It has no server, build step, package manager, or third-party API dependency.

## Features

- Parse a URL locally and show its hostname, scheme, port, path, query count, fragment, and full address.
- Load the entered address in an embedded iframe with the browser's `sandbox` attribute.
- Keep page scripts disabled by default; optionally enable scripts while retaining the other sandbox restrictions.
- Block non-HTTP(S) schemes, embedded URL credentials, and obvious local/private IP destinations.
- No analytics, persistence, server-side URL fetching, or external scanning service.

## Important security and browser limitations

This is a convenience preview, **not** a malware-analysis VM or a guarantee that a URL is safe.

- The target site is still contacted directly by your browser. It can load images, scripts, and other resources from its own or third-party servers.
- The iframe sandbox blocks top-level navigation, popups, forms, downloads, and other capabilities unless explicitly allowed. The optional script setting adds only `allow-scripts`; it does not add `allow-same-origin`.
- This app cannot read a cross-origin iframe's current location. Redirects can happen inside the frame, but the final URL and redirect chain are not available to the parent page because of browser same-origin protections.
- Some sites refuse to be embedded using `X-Frame-Options` or Content Security Policy. An empty or blocked preview does not mean the destination is safe or unavailable in a normal tab.
- An HTTPS-hosted GitHub Pages site may not be able to display an HTTP target because browsers block mixed active content.
- The local/private-address check is deliberately conservative but not a complete network boundary. DNS rebinding and other network-level tricks cannot be reliably ruled out by a static browser-only app.
- Do not sign in, enter personal information, or download files from an unknown destination. For high-risk investigation, use a dedicated disposable virtual machine or professional URL-analysis service.

## Local development

Open `index.html` in a modern browser, or serve this folder using any static file server. There are no build commands.

## License

MIT — see [LICENSE](LICENSE).
