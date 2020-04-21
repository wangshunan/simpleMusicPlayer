exports.$ = (id) => {
    return document.getElementById(id)
}

exports.converDuration = (time) => {
    const minutes = Math.floor(time / 60)
    const secends = "0" + Math.floor(time - minutes * 60)

    return minutes + ":" + secends.substr(-2)
}
