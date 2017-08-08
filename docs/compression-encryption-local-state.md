# The local state

The local state is the flash channel state, stored in HTML5 local storage.

The state can become quite large, so compression may be necessary in order to keep track of states (especially when going in different rooms, it can get pretty big)

Another issue is that because of the nature of flash channels (with sharable urls like iota.com/myFlashChannel) any page that is hosted on iota.com can get access to the room data (and the user's seeds). For that I have proposed an encryption scheme.

# Compression

The compression is really simple. We'll use LZString, a fast, tiny compression algorithm that matches LZMA in terms of compression ratio, but is much faster and specially designed for JS and strings.

More info: <http://pieroxy.net/blog/pages/lz-string/index.html>

# Encryption

In the intro we looked at the potential data leaks that can occur by storing sensitive data in the HTML5 storage. In order to solve this problem we are going to encrypt the local data for each room.

Some have expressed concerns about having the user to remember a password to guard the data. This is not necessary, as we can just use the hash of the room name as password. This is because:

- Only 2 people in the world know about the room (as long as the name is sufficiently long enough)
- When using a hash of the room name, other rooms would not be able to find out what room names are stored (in case the flash channel app gets compromised).

The process is simple:

- When storing room data locally, encrypt the room data with `hash(<room name> + 0)`
- The key for which the roomdata will be attached to (html5 storage is key-value storage) is `hash(<room name> + 1)`

We achieve the following with this:

- Only the owner of the room name will be able to figure out at what key the room data is stored.
- If someone ever gets the html5 local storage, they cannot use the key to decrypt the room data, since that is a completely different hash
- The room owner can just decrypt the data by hashing room name again with a 1 appended at the end.
