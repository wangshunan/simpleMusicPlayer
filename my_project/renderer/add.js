const { ipcRenderer } = require('electron')
const { $, getAlbumCover } = require('./helper')
const path = require('path')
const jsmediatags = require('jsmediatags')

let musicFilesPath = []
let fileIndex = 0

$('select-music').addEventListener('click', () => {
    ipcRenderer.send('open-music-file')
})

$('add-music').addEventListener('click', () => {
    if (musicFilesPath.length > 0) {
        ipcRenderer.send('add-tracks', musicFilesPath)
    }
})

$('musicList').addEventListener('click', (event) => {
    event.preventDefault()
    const { dataset, classList } = event.target
    const index = dataset && dataset.index

    if ( classList.contains('fa-trash-alt') ) {
        musicFilesPath.splice(index, 1)
        renderListHTML(musicFilesPath)
    }
})

const renderListHTML = (pathes) => {
    const musicList = $('musicList')
    const musicItemHTML = pathes.reduce((html, music) => {
        html += `<li class="row list-group-item d-flex justify-content-center align-items-center">
            <div class="col-1">
                <i class="fas fa-music"></i>
            </div>
            <div class="col-10">
                <b>${path.basename(music)}</b>
            </div>
            <div class="col-1">
                <i class="fas fa-trash-alt" data-index="${fileIndex}"></i>
            </div>
        </div>
        </li>`
        fileIndex += 1
        return html
    }, '')

    const emptyAddList = `没有添加音乐文件`
    const noEmptyAddList = `<ul class="list-group">${musicItemHTML}</ul>`
    musicList.innerHTML = pathes.length ? noEmptyAddList : emptyAddList
    fileIndex = 0
}

ipcRenderer.on('selected-file', (event, filesPath) => {
    if( Array.isArray(filesPath) ) {
        renderListHTML(filesPath)
        musicFilesPath = filesPath
    }
})