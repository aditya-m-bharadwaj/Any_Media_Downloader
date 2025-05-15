# Download Any Media

**Version:** 0.0.1  
**Author:** Aditya Bharadwaj
**Repository:** [https://github.com/aditya-idw/Any_Media_Downloader](https://github.com/aditya-idw/Any_Media_Downloader)

## Overview

Download Any Media is a Chrome extension that lets you discover and selectively download images, videos, and other media from any website—even if the source URLs are obfuscated.

## Features

- **On/Off Toggle** with configurable session duration  
- **DOM parsing** and **network interception** (fetch/XHR wrappers, `chrome.webRequest`)  
- **Found Media List** with thumbnails, rich metadata, and format tags (image/audio/video/vector)  
- **Sort**, **filter**, and **search** by file size, dimensions, duration, quality, format, and usage count  
- **Quality dropdown** for multiple variants (defaults to highest)  
- **Individual** and **bulk** download controls  
- **First-run onboarding** and **persistent settings**  

## Installation

1. Clone or download this repository.  
2. Open Chrome and navigate to `chrome://extensions`.  
3. Enable **Developer mode**.  
4. Click **Load unpacked** and select the `download-any-media/` folder.  
5. Pin the **Download Any Media** icon to your toolbar.

## Usage

1. Click the extension icon → toggle **Enable**.  
2. Click **Gather Media on Page** to scan the active tab.  
3. A new tab opens showing all found media; use the checkboxes, dropdowns, and filters to select and download.

## Settings

Access **Settings** via the popup to adjust:  
- **Default Quality** (Highest / Medium / Lowest)  
- **Show Metadata** (On / Off)  
- **Session Duration** (minutes)  
- **Activation Scope** (Per-tab / Per-domain / Global)

## Contributing

1. Fork the repo.  
2. Create a feature branch.  
3. Submit a pull request with tests and documentation updates.

## License

This project is licensed under the MIT License. See [LICENSE.md](LICENSE.md) for details.
