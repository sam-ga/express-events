const mongoose = require('mongoose')

const commentSchema = new mongoose.Schema({
  text: { type: String, required: true },
  user: { type: mongoose.Types.ObjectId, ref: 'User', required: true }
}, {
  timestamps: true // this option set to true provides a dynamic createdAt and updatedAt field that update automatically
})

const eventSchema = new mongoose.Schema({
  name: { type: String, required: ['Add a name', true] },
  description: { type: String, required: ['Add a description', true] },
  location: { type: String, required: ['Add a location', true] },
  date: { type: Date, required: ['Add a date', true] },
  organiser: { type: mongoose.Types.ObjectId, ref: 'User', required: true },
  comments: [commentSchema],
  attendees: [{ type: mongoose.Types.ObjectId, ref: 'User'}],
  images: [String]
})

const Event = mongoose.model('Event', eventSchema)

module.exports = Event