
import { getDB } from "../config/db.js";
import { ObjectId } from "mongodb";


export async function createBooking(req, res) {
  try {
    const db = getDB();

    const {
      studioId,
      userEmail,
      userName,
      bookingDate,
      startTime,
      endTime
    } = req.body;

    if (
      !studioId || !userEmail || !userName ||
      !bookingDate || !startTime || !endTime
    ) {
      return res.status(400).send({
        message: "Please provide all booking details"
      });
    }

    if (!ObjectId.isValid(studioId)) {
      return res.status(400).send({
        message: "Invalid studio ID"
      });
    }

    const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;

    if (
      !timePattern.test(startTime) ||
      !timePattern.test(endTime) ||
      endTime <= startTime
    ) {
      return res.status(400).send({
        message: "Please provide a valid time range"
      });
    }

    const studio = await db.collection("studios").findOne({
      _id: new ObjectId(studioId)
    });

    if (!studio) {
      return res.status(404).send({
        message: "Studio not found"
      });
    }

    const conflict = await db.collection("bookings").findOne({
      studioId,
      bookingDate,
      status: "Confirmed",
      startTime: { $lt: endTime },
      endTime: { $gt: startTime }
    });

    if (conflict) {
      return res.status(409).send({
        message: "This studio is already booked for that time"
      });
    }


    const start = startTime.split(":");
    const end = endTime.split(":");

    const startMinutes = Number(start[0]) * 60 + Number(start[1]);
    const endMinutes = Number(end[0]) * 60 + Number(end[1]);

    const hours = (endMinutes - startMinutes) / 60;
    const totalPrice = hours * Number(studio.hourlyRate);

    const newBooking = {
      studioId,
      studioTitle: studio.title,
      userEmail,
      userName,
      bookingDate,
      startTime,
      endTime,
      totalPrice,
      status: "Pending",
      createdAt: new Date()
    };

    const result = await db.collection("bookings")
      .insertOne(newBooking);

    res.status(201).send({
      message: "Booking created successfully",
      insertedId: result.insertedId
    });

  } catch (error) {
    res.status(500).send({
      message: "Failed to create booking"
    });
  }
}


export async function getMyBookings(req, res) {
  try {
    const db = getDB();
    const email = req.query.email;

    if (!email) {
      return res.status(400).send({
        message: "User email is required"
      });
    }

    const bookings = await db.collection("bookings")
      .find({ userEmail: email })
      .sort({ createdAt: -1 })
      .toArray();

    res.send(bookings);

  } catch (error) {
    res.status(500).send({
      message: "Failed to fetch bookings"
    });
  }
}


export async function cancelBooking(req, res) {
  try {
    const db = getDB();
    const id = req.params.id;

    if (!ObjectId.isValid(id)) {
      return res.status(400).send({
        message: "Invalid booking ID"
      });
    }

    const result = await db.collection("bookings").updateOne(
      {
        _id: new ObjectId(id),
        status: "Pending"
      },
      {
        $set: {
          status: "Cancelled",
          updatedAt: new Date()
        }
      }
    );

    if (result.matchedCount === 0) {
      return res.status(404).send({
        message: "Pending booking not found"
      });
    }

    res.send({
      message: "Booking cancelled successfully"
    });

  } catch (error) {
    res.status(500).send({
      message: "Failed to cancel booking"
    });
  }
}
