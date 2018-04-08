const fs = require('fs')

var trackItems = require ('./sample_tracks_in.json')
var listOfArtists

function TrackObject (trackName, trackId, artists, album) {
    this.trackName = trackName;
    this.trackId = trackId;
    for(let i = 0; i < trackItems.items[i].track.artists.length; i++){  
        listOfArtists + ' ' + trackItems.items[i].track.artists[i].name
    }
    this.artists = artists;
    this.album = album;
}

var listOfObjects =[];

for(let i = 0; i < trackItems.items.length; i++){
    listOfObjects.push(new TrackObject(trackItems.items[i].track.name, trackItems.items[i].track.id, trackItems.items[i].track.arists, trackItems.items[i].track.album.name))

}

console.log(listOfObjects)
