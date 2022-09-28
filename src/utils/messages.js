const mongoose =require('mongoose')
const msgSchema = new mongoose.Schema({
    message: String
})
const Msg = mongoose.model('msg', msgSchema) 

const generateMessage = (username ,text) => {
    return {
        username,
        text,
        createdAt: new Date().getTime()
    }
}

const generateLocation = (username ,url) => {
    return {
        username,
        url,
        createdAt: new Date().getTime()
    }
}

module.exports = {
    generateMessage,
    generateLocation,
    Msg
}