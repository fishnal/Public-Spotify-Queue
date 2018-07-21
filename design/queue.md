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

One more thing to note is that skip lists are sorted. For the time being, let's ignore the fact that we're using a skip list, and focus on solely an ordered list. To keep them sorted, we'll use key-value pairs:

+ Values will be the song URI (for the Spotify API to use)
+ Keys will be the song's position in the queue, *when the queue was first initialized*

The last part is emphasized because every song's position gets offset by 1 when we skip to the next song in the queue.

```text
(0 is current song playing)
(assuming repeat is on)
Old Queue: A -> B -> C -> D <--- values
           0    1    2    3 <--- keys

(user skips to next song)
New Queue: B -> C -> D -> A
           0    1    2    3
```

If we do not change the numbering of the songs when a song is skipped, then song A would still be numbered as 0, B as 1, and so on. This allows us to retain the ordering of the list and avoid unnecessarily shifting the list's elements around.

However, this poses an issue when it comes to inserting and removing elements from the list because we still need to keep the list ordered:

+ Removing: ordering is retained (so long as you don't modify any keys) because an element was removed from a sorted list
+ Inserting: one or more keys need to change in order to allow for a node to be inserted.

	```text
	A -> B -> C <-- values
	0    1    2 <-- keys

	insert value D in between the keys 0 and 1

	A -> D -> B -> C
	0    ?    1    2
	```

	If our keys were unsigned integers, D would have to be assigned a key of 1, B's key will become 2, and so on. This then becomes an O(n) operation.

	However, if we make the keys unsigned floats, D can be assigned any value in between 0 and 1. We can assign it a value that's halfway from both ranges, so 0.5 in this case. This retains the list's ordering, while also saving time when it comes to inserting the element.

Putting this in terms of song queues, it doesn't mean that a song will be in position 0.5 in the queue because that doesn't make much sense. Rather, these positions/indices are intended to help us keep our skip list queue sorted, so that we can take advantage of the skip list's improved search.

What does this mean for the client? They won't see any numberings on the queue, so they won't have to worry. But if in the future numberings are displayed, it can be handled by whatever list the queue is displaying the list of songs from (i.e. an HTML list), rather than the song's key in the skip list queue.

## <a id="space-management"></a> Space Management

With regard to the skip list's space complexity, there will be two queues:

+ A server queue
+ A client-based, or local, queue

The server queue will be a skip list queue, where all modification requests must be processed first. The local queue is an HTML list, because it is designed to be displayed and handle user interactions. All of this means that any requests to modify the queue must first be processed on the server queue. After the server processes them, the server will notify the client which requests fulfilled and rejected. The client will then update it's local queue to mimic the one on the server.

Why does the client not have the skip list?

+ There is no need to search in the queue, because everything will be displayed on the user's screen in a scrollable list.
+ Takes up twice the amount of space, if not more, because there's the client-based skip list *and* an HTML list to display the elements. Instead, we could have the client just use the HTML list and get rid of the skip list entirely.

Why not just have the queue stored on the server?

+ Nothing could ever be displayed on the client side, because the client can't have any list of elements resembling that queue.

### <a id="client-based-queue"></a> Client Based Queue?

*But what if it the queue was local or client-based?*

This actually isn't that bad of an idea, but there are significant trade offs involved. If the client held the queue locally, then in this case it can't be a skip list (explained above). Instead, it would just be an HTML list. This means the server uses less memory, aka more memory for other tasks, which is a huge plus.

What if the client modifies the queue a bunch? Those changes can just be sent to the server.

What if listeners join in after the host started the session? This means that listeners need to grab the host's current queue, but how? They have to ask the server for that data. But the server doesn't have that data, so it needs to ask the host client. This is the main issue here. If a group of people join in at once, they all need that queue information. Which means the host client uses up network resources, which can be an issue if the host is attempting to fulfill a bunch of requests at once and/or doesn't have a strong enough internet connection. If instead we had the server hold the queue, the network load will be placed onto the server rather than the host client when a group of listeners request the queue. This is the main reason as to why the queue will not be completely local.
