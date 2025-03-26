# Orlog Game over WebRTC

<div align="center">

<br>

[![Play Game]][Link]

</div>

<br>

## Orlog?

Orlog is a dice game popular among the Norse and Anglo-Saxons in which the contestants attempt to reduce their opponent's "health", as represented by a set of 15 stones, to zero through various dice rolls and bonus effects.
[see here](https://www.youtube.com/watch?v=vATOTvBTgeY)

## WebRTC

WebRTC is a free and open-source project providing web browsers and mobile applications with real-time communication via application programming interfaces.
[see here](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API)

### How it works

Instead of using a signaling server to act as a broker, we exchange messages between the peers, effectively making it serverless, allowing players to connect and play on GitHub docs, this is not intended for commercial use, only as means to understand the API.

## Development

This project is built using Vite, TypeScript, Three.js, and Cannon-es.

### Getting started

1. Clone the repository
2. Install dependencies
   ```
   npm install
   ```
3. Start the development server
   ```
   npm run dev
   ```
4. Build for production
   ```
   npm run build
   ```

## Features

- [x] Connect 2 peers using WebRTC
- [x] Make it serverless
- [x] 3D dice roll
- [x] Implement base game logic
- [x] Modern build system with Vite
- [x] TypeScript for better code organization
- [ ] Implement god favor mechanics
- [ ] Add better UI/UX

[Play Game]: https://img.shields.io/badge/Play_Game-37a779?style=for-the-badge
[Link]: https://luandev.github.io/orlog/
