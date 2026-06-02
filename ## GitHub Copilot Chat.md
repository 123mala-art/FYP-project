## GitHub Copilot Chat

- Extension: 0.37.9 (prod)
- VS Code: 1.109.4 (c3a26841a84f20dfe0850d0a5a9bd01da4f003ea)
- OS: win32 6.0.6000 x64
- GitHub Account: 123mala-art

## Network

User Settings:
```json
  "http.systemCertificatesNode": true,
  "github.copilot.advanced.debug.useElectronFetcher": true,
  "github.copilot.advanced.debug.useNodeFetcher": false,
  "github.copilot.advanced.debug.useNodeFetchFetcher": true
```

Connecting to https://api.github.com:
- DNS ipv4 Lookup: 20.207.73.85 (57 ms)
- DNS ipv6 Lookup: Error (14 ms): getaddrinfo ENOTFOUND api.github.com
- Proxy URL: None (1 ms)
- Electron fetch (configured): Error (369 ms): Error: net::ERR_CERT_DATE_INVALID
	at SimpleURLLoaderWrapper.<anonymous> (node:electron/js2c/utility_init:2:10684)
	at SimpleURLLoaderWrapper.emit (node:events:519:28)
  [object Object]
  {"is_request_error":true,"network_process_crashed":false}
- Node.js https: Error (853 ms): Error: certificate is not yet valid
	at TLSSocket.onConnectSecure (node:_tls_wrap:1679:34)
	at TLSSocket.emit (node:events:519:28)
	at TLSSocket._finishInit (node:_tls_wrap:1078:8)
	at ssl.onhandshakedone (node:_tls_wrap:864:12)
- Node.js fetch: Error (495 ms): TypeError: fetch failed
	at node:internal/deps/undici/undici:14900:13
	at process.processTicksAndRejections (node:internal/process/task_queues:105:5)
	at async n._fetch (c:\Users\ahtas\.vscode\extensions\github.copilot-chat-0.37.9\dist\extension.js:4862:26129)
	at async n.fetch (c:\Users\ahtas\.vscode\extensions\github.copilot-chat-0.37.9\dist\extension.js:4862:25777)
	at async u (c:\Users\ahtas\.vscode\extensions\github.copilot-chat-0.37.9\dist\extension.js:4894:190)
	at async CA.h (file:///c:/Users/ahtas/AppData/Local/Programs/Microsoft%20VS%20Code/c3a26841a8/resources/app/out/vs/workbench/api/node/extensionHostProcess.js:116:41743)
  Error: certificate is not yet valid
  	at TLSSocket.onConnectSecure (node:_tls_wrap:1679:34)
  	at TLSSocket.emit (node:events:519:28)
  	at TLSSocket._finishInit (node:_tls_wrap:1078:8)
  	at ssl.onhandshakedone (node:_tls_wrap:864:12)

Connecting to https://api.githubcopilot.com/_ping:
- DNS ipv4 Lookup: 140.82.114.22 (12 ms)
- DNS ipv6 Lookup: Error (10 ms): getaddrinfo ENOTFOUND api.githubcopilot.com
- Proxy URL: None (16 ms)
- Electron fetch (configured): HTTP 200 (1027 ms)
- Node.js https: HTTP 200 (903 ms)
- Node.js fetch: HTTP 200 (835 ms)

Connecting to https://copilot-proxy.githubusercontent.com/_ping:
- DNS ipv4 Lookup: 4.237.22.41 (280 ms)
- DNS ipv6 Lookup: Error (7 ms): getaddrinfo ENOTFOUND copilot-proxy.githubusercontent.com
- Proxy URL: None (29 ms)
- Electron fetch (configured): HTTP 200 (660 ms)
- Node.js https: HTTP 200 (1879 ms)
- Node.js fetch: HTTP 200 (1790 ms)

Connecting to https://mobile.events.data.microsoft.com: HTTP 404 (433 ms)
Connecting to https://dc.services.visualstudio.com: HTTP 404 (2019 ms)
Connecting to https://copilot-telemetry.githubusercontent.com/_ping: HTTP 200 (870 ms)
Connecting to https://copilot-telemetry.githubusercontent.com/_ping: HTTP 200 (814 ms)
Connecting to https://default.exp-tas.com: Error (412 ms): Error: certificate is not yet valid
	at TLSSocket.onConnectSecure (node:_tls_wrap:1679:34)
	at TLSSocket.emit (node:events:519:28)
	at TLSSocket._finishInit (node:_tls_wrap:1078:8)
	at ssl.onhandshakedone (node:_tls_wrap:864:12)

Number of system certificates: 73

## Documentation

In corporate networks: [Troubleshooting firewall settings for GitHub Copilot](https://docs.github.com/en/copilot/troubleshooting-github-copilot/troubleshooting-firewall-settings-for-github-copilot).