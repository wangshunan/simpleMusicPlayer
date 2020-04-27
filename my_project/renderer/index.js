const { ipcRenderer } = require('electron')
const { $, converDuration } = require('./helper')
const jsmediatags = require('jsmediatags')

let musicAudio = new Audio()
let currentVloume = 100
let allTracks
let currentTrack
let currentEle
let playListStyle = 'scroll-1080p'
let imgSize = 40
const defalutCover = '../assets/1.png'

$('add-music-button').addEventListener('click', () => {
    ipcRenderer.send('add-music-window')
})

$('tracksList').addEventListener('click', (event)=> {
    event.preventDefault()
    const { dataset, classList } = event.target
    const id = dataset && dataset.id

    if ( id && classList.contains('fa-trash-alt') ) {

        if ( currentTrack && currentTrack.id === dataset.id ) {
            musicAudio.pause()
            currentTrack = null
        }

        ipcRenderer.send('delete-track', id)
        
        if ( !currentTrack ) {
            resetRenderPlayerHTML()
        }
        
        return
    }

    if ( id ) {
        // new selected music
        currentTrack = allTracks.find(track => track.id === id)
        musicAudio.src = currentTrack.path
        currentVloume = musicAudio.volume * 100
        currentEle = event.target
    }
})

$('player-status').addEventListener('click', (event) => {
    event.preventDefault()
    const { classList } = event.target

    if ( !classList ) return

    if( classList.contains('fa-pause') || classList.contains('fa-play') ) {
        playerButtonControl(classList)
    }

    if ( classList.contains('fa-forward') ) {
        musicAudio.currentTime = fastForward(musicAudio.currentTime, musicAudio.duration)
    } 
    else if ( classList.contains('fa-backward') ) {
        musicAudio.currentTime = fastBackward(musicAudio.currentTime)
    } 
    else if ( classList.contains('fa-step-backward') ) {
        lastTrack()
    } 
    else if ( classList.contains('fa-step-forward') ) {
        nextTrack()
    }
})

ipcRenderer.on('getTracks', (event, tracks) => {
    renderListHTML(tracks)
    allTracks = tracks
})

ipcRenderer.on('setPlayListStyle', (event, resolution) => {
    playListStyle = 'scroll-' + resolution + 'p'
    if ( resolution === 1080 ) {
        imgSize = 40
    } else if ( resolution === 1440 ) {
        imgSize = 50
    }
})

musicAudio.addEventListener('loadedmetadata', () => {  
    renderPlayerHTML(currentTrack, musicAudio.duration)
    musicAudio.play()
})

musicAudio.addEventListener('timeupdate', () => {
    if ( currentTrack ) {
        updateProgressHTML(musicAudio.currentTime)
    }
})

musicAudio.addEventListener('ended', () => {
    nextTrack()
})

const updateProgressHTML = (currentTime) => {
    const seeker = $('current-seeker')
    if ( seeker ) {
        seeker.innerHTML = converDuration(currentTime)
    }
}

const renderListHTML = (tracks) => {
    const tracksList = $('tracksList')
    const tracksListHTML = tracks.reduce((html,track) => {
        html += `<li class="music-track list-group-item row d-flex justify-content-center align-items-center ml-1">
            <div class="col-1">
                <img src= ${imgDataChangeToSrc(track.cover)} id="picture" class="rounded-circle" width="${imgSize}" height="${imgSize}">
            </div>
            <div class="col-9">
                <b>${track.fileName}</b>
            </div>
            <div class="col-1">
                <i class="fas fa-play ml-4 mr-2" data-id="${track.id}"></i>
            </div>
            <div class="col-1">
                <i class="fas fa-trash-alt" data-id="${track.id}"></i>
            </div>
        </div>
        </li>`
        return html
    }, '')

    const trackHTML = `<ul class="container list-group scroll ${playListStyle}">${tracksListHTML}</ul>`
    const emptyTrackHTML = `音楽ファイルがありません`
    tracksList.innerHTML = tracks.length ? trackHTML : emptyTrackHTML
}

const renderPlayerHTML = (track ,duration) => {
    const player = $('player-status')
    const html = `<div class="col-5 font-weight-bold">
                    再生中: ${track.fileName}
                </div>
                <div class="col-3" align="right">
                    <span id="current-seeker">0:00</span> / ${converDuration(duration)}
                </div>
                <div class="col-2 pr-0" align="right">
                    <i class="fas fa-step-backward" data-id="${track.id}"></i>
                    <i class="fas fa-backward"></i>
                    <i id="status-playbtn" class="fas fa-pause mr-1 ml-1" data-id="${track.id}"></i>
                    <i class="fas fa-forward"></i>
                    <i class="fas fa-step-forward" data-id="${track.id}"></i>
                    <i class="fas fa-volume-up"></i>
                </div>
                <div class="col-1 pl-2">
                    <input type="range" class="form-control-range" id="formControlRange" value="${currentVloume}"/>
                </div>`
    player.innerHTML = html

    const rangeBtn = $('formControlRange')
    if ( rangeBtn ) {
        rangeBtn.addEventListener('input', (event) => {
            setVolume(event.target.value)
            setRange(event.target.style)
        })
    }
    setRange(rangeBtn.style)
}

const resetRenderPlayerHTML = () => {
    const player = $('player-status')
    player.innerHTML = ""
}

const fastForward = (currentTime, duration) => {
    currentTime += 5
    return currentTime <= duration ? currentTime : duration
}

const fastBackward = (currentTime) => {
    currentTime -= 5
    return currentTime >= 0 ? currentTime : 0
}

const lastTrack = () => {

    if ( musicAudio.currentTime >= 3 ) {
        musicAudio.currentTime = 0
        return
    }

    for ( i = 0; i < allTracks.length; i++ ) {
        if ( allTracks[i].id === currentTrack.id ) {
            musicAudio.pause()
            currentTrack = allTracks[ i === 0 ? i : i - 1 ]
            musicAudio.src = currentTrack.path
            return
        }
    }
}

const nextTrack = () => {
    for ( i = 0; i < allTracks.length; i++ ) {
        if ( allTracks[i].id === currentTrack.id ) {
            musicAudio.pause()
            currentTrack = allTracks[ i === allTracks.length - 1 ? 0 : i + 1 ]
            musicAudio.src = currentTrack.path
            return
        }
    }
}

const playerButtonControl = (buttonClass) => {
    const statusPlaybtn = $('status-playbtn')
    
    if ( buttonClass.contains('fa-play') ) {
        // play music
        musicAudio.play()
        if ( statusPlaybtn ) statusPlaybtn.classList.replace('fa-play', 'fa-pause')

    }else if ( buttonClass.contains('fa-pause') ) {
        // pause music
        musicAudio.pause()
        statusPlaybtn.classList.replace('fa-pause', 'fa-play')
    }
}

const imgDataChangeToSrc = (cover) => {
    if ( cover ) {
        var base64String = "";
        for (var i = 0; i < cover.data.length; i++) {
            base64String += String.fromCharCode(cover.data[i])
        }
        var src = "data:" + cover.format + ";base64," + window.btoa(base64String)
    } 

    return cover ? src : defalutCover
}

const setVolume = (value) => {
    musicAudio.volume = value / 100
    currentVloume = value
}

const setRange = (style) => {
    style.backgroundSize = currentVloume + '% ' + '100%'
}