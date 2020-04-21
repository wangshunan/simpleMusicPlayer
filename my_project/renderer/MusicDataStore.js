const Store = require('electron-store')
const path = require('path')
const uuidv4 = require('uuid/v4')
const jsmediatags = require('jsmediatags')

class DataStore extends Store {
    constructor(settings) {
        super(settings)
        this.tracks = this.get('tracks') || []
    }

    saveTracks() {
        this.set('tracks', this.tracks)
        return this
    }

    getTracks() {
        return this.get('tracks') || []
    }

    async addTracks(tracks) {
      const tracksWithProps = 
        await Promise.all( 
          tracks.map(async track => {
            var tag = await getTrackTags(track)
            var image = tag.tags.picture
            return {
              id: uuidv4(),
              path: track,
              fileName: path.basename(track),
              cover: image ? image : ''
            }
          })
        )

      const newTracks = tracksWithProps.filter(track => {
        const currentTracksPath = this.getTracks().map(track => track.path)
        return currentTracksPath.indexOf(track.path) < 0
      })

      this.tracks = [...this.tracks, ...newTracks]
      return this.saveTracks()
    }

    deleteTrack(deletedId) {
        this.tracks = this.tracks.filter(item => item.id !== deletedId)
        return this.saveTracks()
    }
}

const getTrackTags = (filename) => {
  return new Promise(function(resolve, reject) {
    jsmediatags.read(filename, {
      onSuccess: function(tag) {
          resolve(tag);
      },
      onError: function(error) {
        reject(error);
      }
    })
  })
}

module.exports = DataStore