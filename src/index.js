const express = require('express')
const mongoose = require('mongoose')
const mongoDB = 'mongodb+srv://nambeo1998:lvnam1998@cluster0.fiflxtq.mongodb.net/message-db?retryWrites=true&w=majority'
mongoose.connect(mongoDB).then(() => {
    console.log('connected')
}).catch(err => console.log(err))

const path = require('path')
const http = require('http')
const socketio = require('socket.io')
const Filter = require('bad-words')
const { generateMessage, generateLocation, Msg } = require('./utils/messages')
const { addUser, getUser, removeUser, getUsersInRoom } = require('./utils/users')
const { error } = require('console')

const app = express()
const server = http.createServer(app)
const io = socketio(server)

const port = process.env.PORT || 3000
const publicDirectoryPath = path.join(__dirname, '../public')

app.use(express.static(publicDirectoryPath))

io.on('connection', (socket) => {
    console.log('New Websocket connection')

    socket.on('join', ({ username, room}, callback) => {
        const { error, user } = addUser({ id: socket.id, username, room })
        
        if (error) {
            return callback(error) 
        }

        socket.join(user.room)

        socket.emit('message', generateMessage('Admin', `Welcome ${user.username} :)`))
        socket.broadcast.to(user.room).emit('message', generateMessage('Admin', `${user.username} has joined!! Send ${user.username} something :)`))
        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUsersInRoom(user.room)
        })
        callback()
    })

    socket.on('sendMessage', (message, callback) => {
        const filter = new Filter()
        const user = getUser(socket.id)
        const me = new Msg({
            message
        })
        me.save().then(() => {
            if(filter.isProfane(message)) {
                return callback('Profanity is not allowed')
            }
            io.to(user.room).emit('message', generateMessage(user.username, message))  
        })
        callback()
    })

    socket.on('sendLocation', (coords, callback) => {
        const user = getUser(socket.id)
        io.to(user.room).emit('locationMessage', generateLocation(user.username, `https://google.com/maps?q=${coords.latitude},${coords.longitude}`))
        callback()
    })

    socket.on('disconnect', () => {
        const user = removeUser(socket.id)
        if(user) {
            io.to(user.room).emit('message', generateMessage('Admin', `${user.username} has left!!!`))
            io.to(user.room).emit('roomData', {
                room: user.room,
                users: getUsersInRoom(user.room)
            })
        }
    })
})


server.listen(port, () => {
    console.log(`Server is up on port ${port}`)
})


