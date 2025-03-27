# Orlog Game

<div align="center">

<br>

[![Play Game]][Link]

</div>

<br>

## Orlog?

Orlog is a dice game popular among the Norse and Anglo-Saxons in which the contestants attempt to reduce their opponent's "health", as represented by a set of 15 stones, to zero through various dice rolls and bonus effects.
[see here](https://www.youtube.com/watch?v=vATOTvBTgeY)

## Game Implementation

This is a single-player implementation of the Orlog dice game where you play against an AI opponent. The game uses PixiJS for smooth animations and rendering.

## Development

This project is built using Vite, TypeScript, and PixiJS.

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

## Game Rules

1. Players take turns rolling dice and selecting up to 3 dice to keep for the turn
2. Dice faces include:
   - Axe (Attack)
   - Arrow (Attack)
   - Helmet (Defense)
   - Shield (Defense)
   - Hand (Steal god tokens)
   - Prayer (Gain god tokens)
3. During resolution:
   - Attack symbols cause damage if they exceed the opponent's defense symbols
   - Steal symbols let you take god tokens from your opponent
   - Prayer symbols give you god tokens

## Features

- [x] Implement base game logic
- [x] Modern build system with Vite
- [x] TypeScript for better code organization
- [x] Animated dice using PixiJS
- [x] Single-player vs AI
- [ ] Implement god favor mechanics
- [ ] Add better UI/UX
- [ ] Add sound effects
- [ ] Add difficulty levels for AI

[Play Game]: https://img.shields.io/badge/Play_Game-37a779?style=for-the-badge
[Link]: https://luandev.github.io/orlog/
