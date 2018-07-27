# Queue Design

## Contents

+ [Actions](#actions)
+ [Linked List Type](#linked-list-type)
+ [Space Management](#space-management)
	+ [Client Based Queue?](#client-based-queue)

## <a id="actions"></a> Actions

+ Batch removal (one or more songs can be removed at once, regardless of position in queue)
+ Add a song before or after one that's already in the queue
+ Play the next/previous song

## <a id="linked-list-type"></a>Linked List Type

A linked list structure would make adding songs in the middle of the queue easier, along with removal.

We'll describe two types of linked lists, traditional linked lists and skip linked lists.

+ A traditional linked list would be a singly or doubly linked one, both of which have low insertion and deletion costs of `O(1)`, but come at the expense of searching, `O(n)`. Searches are mandatory for inserting songs at the desired locations (need to find the song to add it before/after) and deleting unwanted songs (need to find the song to delete). This essentially means that all operations for a traditional list are `O(n)`.
	+ In our case, we'd favor a doubly linked list over a singly linked one because we want to be able to skip forward/backward in the queue.
+ A [skip list](http://en.wikipedia.org/wiki/Skip_list) is an ordered linked list that aims to reduce search costs, but it does increase insertion and deletion costs when compared to traditional linked lists.

Additionally, the linked list would have to be circular. This allows for playback to continue if the user has repeat enabled (we don't want to generate another queue once our original one runs out, instead just reuse it).

The following table details the time and space complexities for these two types of linked lists (time complexity is for all operations: search, insertion, and deletion):

|List Type|Avg Time|Worst Time|Worst Space|
|:-:|:-:|:-:|:-:|
|Traditional|`O(n)`|`O(n)`|`O(n)`|
|Skip|`O(log(n))`|`O(n)`|`O(nlog(n))`|

In the worst case, skip and traditional lists have the same time complexity, but skip lists have a worse space complexity (addressed later). But because skip lists, on average, have smaller time complexities than traditional lists, skip lists are more appealing.

One more thing to note is that skip lists are sorted. For the time being, let's ignore the fact that we're using a skip list, and focus on solely an ordered list. Our ordering is dependent on the positions of the songs, rather than their values (i.e. not the track names), so this essentially leaves our list ordered all the time. When we insert a song, we just have to make sure we insert it in the right place, and similarly for removing a song.

However, it becomes a slight issue when we need to search for songs. In order to insert songs in the right position, we need to know which songs are around it, along with the queue positions of those neighboring songs. We can't compare song details against each other because they don't determine where the song is in the queue. We'd want to index the songs based on their queue positions (the indexes should be non-negative, but sign doesn't really matter since it won't be showed to the client). But using indices has some limitations:

### Integer Indices

If we insert a new element, then all the elements to the right need their index to be offset by 1, which makes our insertion an O(n) operation. Not so great.

### Float Indices

If we insert a new element, it's index can be an average of the element's indices that the new element is being inserted into. So if we insert `C` in between `A` (current playing song) and `B` (next and last song in queue), then `C`s index would be an average of `A`s and `B`s indices. This becomes an issue if we repeatedly try to insert an element in between `A` and `x`, where `x` is the element next to `A`. We can only do this so many times because float precision is finite (we can do this ~50 times).

Besides that, we don't have to worry about adding `C` before the current playing song, because that wouldn't make much sense. But, we do have to worry about adding `C` after the last song in the queue. In this case, we can set `C`s index to be one plus `B`s index. What if the user has repeat on? Well even with repeat on, `B` is still considered to be the last song in the queue, we just end up going back to the beginning of the queue after `B` finishes playing. So we'd still set `C`s index directly after `B`s index.

Despite the fact that this can break if someone tries to add 50 songs after one particular song, that isn't a practical case because at that point you may as well just update your playlist. This makes floating indices to be more accurate then integer ones.

## <a id="space-management"></a> Space Management

With regard to the skip list's space complexity, there will be two queues:

+ A server queue
+ A client-based, or local, queue

The server queue will be a skip list queue, where all modification requests must be processed first. The local queue is an HTML list, because it is designed to be displayed and handle user interactions. All of this means that any requests to modify the queue must first be processed on the server queue. After the server processes them, the server will notify the client which requests fulfilled and rejected. The client will then update it's local queue to mimic the one on the server.

Why does the client not have the skip list?

+ There is no need to search in the queue, because everything will be displayed on the user's screen in a scrollable list.
+ Takes up twice the amount of space, if not more, because there's the client-based skip list *and* an HTML list to display the elements. Instead, we could have the client just use the HTML list and get rid of the skip list entirely.

Why not just have the queue stored on the server?

+ Nothing could ever be displayed on the client side, because the client wouldn't have any list of elements resembling that queue (unless we send that queue data to the client).

*What if the client sends a lot of queue modification requests in a short amount of time?*

+ Maybe the first few requests we can process individually, but if we start to notice the same pattern, could probably just suspend the requests until the client stops sending so many requests (maybe a 5 second period), and then process all the requests we just held onto all at once. Hopefully, queue modification doesn't get to expensive so we don't have to rely on this feature.

### <a id="client-based-queue"></a> Client Based Queue?

*But what if it the queue was local or client-based?*

+ This actually isn't that bad of an idea, but there are significant trade offs involved. If the client held the queue locally, then in this case it can't be a skip list (explained above). Instead, it would just be an HTML list. This means the server uses less memory, aka more memory for other tasks, which is a huge plus. It could be a peer-to-peer network model.

*What if listeners join in after the host started the session?*

+ This means that listeners need to grab the host's current queue, but how? They have to ask the server for that data. But the server doesn't have that data, so it needs to ask the host client. This is the main issue here. If a group of people join in at once, they all need that queue information. Which means the host client uses up network resources, which can be an issue if the host is attempting to fulfill a bunch of requests at once and/or doesn't have a strong enough internet connection. If instead we had the server hold the queue, the network load will be placed onto the server rather than the host client when a group of listeners request the queue. This is the main reason as to why the queue will not be completely local.
