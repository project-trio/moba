# Moba

An unnamed, top-down 3D, multiplayer online battle arena (MOBA) that plays in your browser.

## Tech

- WebGL rendering with [three.js](https://threejs.org)
- 3D modeling with [MagicaVoxel](https://ephtracy.github.io)
- UI with [Vue.js](https://vuejs.org)
- WebSocket networking with [socket.io](https://socket.io)

## Development

Moba uses [Trio](https://github.com/project-trio/trio) as its game server, so ensure you have that running first.

```sh
cd moba
# Install dependencies
npm install

# Hot-reload dev environment
npm run serve

# Build for production
npm run build
```
