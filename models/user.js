const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  profileImage: String
}, {
  toObject: { virtuals: true }
})

// Creating a virtual field and populating events attended
userSchema.virtual('eventsAttending', {
  ref: 'Event', // The ref is the collection to look for the objects to populate this field with
  localField: '_id', // local identifier, usually _id
  foreignField: 'attendees' // which field are we looking for a matching value to the localField
})

userSchema.virtual('eventsOrganised', {
  ref: 'Event', // The ref is the collection to look for the objects to populate this field with
  localField: '_id', // local identifier, usually _id
  foreignField: 'organiser' // which field are we looking for a matching value to the localField
})

const User = mongoose.model('User', userSchema)

module.exports = User