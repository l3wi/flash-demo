# WebRTC

IOTA Flash Payments has a custom WebRTC wrapper (at libs/flash/webrtc.js) that manages the low-level tasks (message i/o, keeping connections) as well as some of the more advanced stuff (peer id negotiation, events)

We go over some of the functionality and how to use the WebRTC wrapper.

## How to use

Aside for WebRTC being a class, you generally don't have to make your own instance. Instead, libs/flash/index.js has a 'global' (module-wide) instance of WebRTC.

Importing looks like this: `import { webRTC } from "/path/to/libs/flash"`

To create a room, do:

```
(async() => {
  var result = await webRTC.initChannel({
    roomId: 'my_room_id'
  })
})
```

This doesn't do much yet. We need to search for peers in this room. Let's add the following within the async-wrapper:

```
  setInterval(() => {
    webRTC.connectToPeers()
  }, 1000)
```

Now if you open the same page within 2 different browser windows, you'll see in the console that both browsers have a different peer id, and you're both connected.

Now sending messages to everyone in the room is simple as this:

```
webRTC.broadcastMessage({
  data: e.currentTarget.value
})
```

For a more complete example, check out pages/channel.js

## Why the wrapper

- abstracting WebRTC code, making it easy to switch if we need to (as long as the class behaves the same way, we're good overall)

- A lot of IOTA Flash functions overlaps with WebRTC-related functionality (i.e assigning an unique id to the peer)

## Design principles

- Do as little as possible on the server-side (i.e, just connect the peers using a centralized server and then let the data flow through the peers directly)

  - For instance, we don't keep peer IDs on the server. Instead, we are going to persist them on the client.
