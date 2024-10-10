const mongoose = require('mongoose')
const express = require('express')
const upload = require('../middleware/file-upload.js')

// ! -- Router
const router = express.Router()

// ! -- Model
const Event = require('../models/event.js')

// ! Middleware Functions
const isSignedIn = require('../middleware/is-signed-in.js')

// ! -- Routes
// * Each route is already prepended with `/events`

// * Index Route
router.get('/', async (req, res) => {
  try {
    const events = await Event.find()
    return res.render('events/index.ejs', { events })
  } catch (error) {
    console.log(error)
    return res.status(500).send('<h1>An error occurred.</h1>')
  }
})

// * New Page (form page)
router.get('/new', isSignedIn, (req, res) => {
  res.render('events/new.ejs')
})

// * Show Page
router.get('/:eventId', async (req, res, next) => {
  try {
    if (mongoose.Types.ObjectId.isValid(req.params.eventId)) {
      const event = await Event.findById(req.params.eventId).populate('organiser').populate('comments.user')
      if (!event) return next()
      return res.render('events/show.ejs', { event })
    } else {
      next()
    }
  } catch (error) {
    console.log(error)
    return res.status(500).send('<h1>An error occurred.</h1>')
  }
})

// * Create Route
router.post('/', isSignedIn, upload.array('images'), async (req, res) => {
  try {
    if (req.files) {
      req.body.images = req.files.map(file => file.path)
    }
    req.body.organiser = req.session.user._id // Add the organiser ObjectId using the authenticated user's _id (from the session)
    const event = await Event.create(req.body)
    req.session.message = 'Event created successfully'
    req.session.save(() => {
      return res.redirect('/events')
    })
  } catch (error) {
    console.log(error)
    return res.status(500).render('events/new.ejs', {
      errors: error.errors,
      fieldValues: req.body
    })
  }
})

// * Delete Route
router.delete('/:eventId', async (req, res) => {
  try {
    const eventToDelete = await Event.findById(req.params.eventId)

    if (eventToDelete.organiser.equals(req.session.user._id)) {
      const deletedEvent = await Event.findByIdAndDelete(req.params.eventId)
      return res.redirect('/events')
    }

    throw new Error('User is not authorised to perform this action')
  } catch (error) {
    console.log(error)
    return res.status(500).send('<h1>An error occurred.</h1>')
  }
})

router.get('/:eventId/edit', isSignedIn, async (req, res, next) => {
  try {
    if (mongoose.Types.ObjectId.isValid(req.params.eventId)) {
      const event = await Event.findById(req.params.eventId)
      if (!event) return next()

      if (!event.organiser.equals(req.session.user._id)) {
        return res.redirect(`/events/${req.params.eventId}`)
      }

      return res.render('events/edit.ejs', { event })
    }
    next()
  } catch (error) {
    console.log(error)
    return res.status(500).send('<h1>An error occurred.</h1>')
  }
})

router.put('/:eventId', isSignedIn, async (req, res) => {
  try {
    const eventToUpdate = await Event.findById(req.params.eventId)
    
    if (eventToUpdate.organiser.equals(req.session.user._id)) {
      const updatedEvent = await Event.findByIdAndUpdate(req.params.eventId, req.body, { new: true })
      return res.redirect(`/events/${req.params.eventId}`)
    }
    
    throw new Error('User is not authorised to perform this action')
    
  } catch (error) {
    console.log(error)
    return res.status(500).send('<h1>An error occurred.</h1>')
  }
})

// ! Comments Section

// * -- Create Comment
router.post('/:eventId/comments', async (req, res, next) => {
  try {

    // Add signed in user id to the user field
    req.body.user = req.session.user._id

    // Find the event that we want to add the comment to
    const event = await Event.findById(req.params.eventId)
    if (!event) return next() // send 404

    // Push the req.body (new comment) into the comments array
    event.comments.push(req.body)

    // Save the event we just added the comment to - this will persist to the database
    await event.save()

    return res.redirect(`/events/${req.params.eventId}`)
  } catch (error) {
    req.session.message = error.message

    req.session.save(() => {
      return res.redirect(`/events/${req.params.eventId}`)
    })
  }
})

// * -- Delete Comment
router.delete('/:eventId/comments/:commentId', isSignedIn, async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.eventId)
    if (!event) return next()
    
    // Locate comment to delete
    const commentToDelete = event.comments.id(req.params.commentId)
    if (!commentToDelete) return next()

    // Ensure user is authorized
    if (!commentToDelete.user.equals(req.session.user._id)) {
      throw new Error('User not authorized to perform this action.')
    }
    
    // Delete comment (this does not make a call to the db)
    commentToDelete.deleteOne()

    // Persist changed to database (this does make a call to the db)
    await event.save()

    // Redirect back to show page
    return res.redirect(`/events/${req.params.eventId}`)
  } catch (error) {
    console.log(error)
    return res.status(500).send('<h1>An error occurred</h1>')
  }
})

// ! -- Attendees Section

// * Add attending status for a user
router.post('/:eventId/attending', isSignedIn, async (req, res, next) => {
  try {
    // Find the event the user wants to attend
    const event = await Event.findById(req.params.eventId)
    // Send 404 if event not found
    if (!event) return next()
    
    // Add logged in user's id into the attendees array
    event.attendees.push(req.session.user._id)

    // Save the event to persist to the DB
    await event.save()

    // Redirect back to the show page
    return res.redirect(`/events/${req.params.eventId}`)
  } catch (error) {
    console.log(error)
    req.session.message = 'Failed to update attending status'
    req.session.save(() => {
      return res.redirect(`/events/${req.params.eventId}`)
    })
  }
})

// * Remove attending status for a user
router.delete('/:eventId/attending', isSignedIn, async (req, res, next) => {
  try {
    // Find the event the user wants to remove their attending status
    const event = await Event.findById(req.params.eventId)
    // Send 404 if event not found
    if (!event) return next()
    
    // remove logged in user's id from the attendees array
    event.attendees.pull(req.session.user._id)

    // Save the event to persist to the DB
    await event.save()

    // Redirect back to the show page
    return res.redirect(`/events/${req.params.eventId}`)
  } catch (error) {
    console.log(error)
    req.session.message = 'Failed to update attending status'
    req.session.save(() => {
      return res.redirect(`/events/${req.params.eventId}`)
    })
  }
})

module.exports = router