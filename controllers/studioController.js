
import { getDB } from "../config/db.js";
import { ObjectId } from "mongodb";

export async function getAllStudios(req, res) {
  try {
    const db = getDB();

    const studios = await db.collection("studios")
      .find()
      .sort({ createdAt: -1 })
      .toArray();

    res.send(studios);
  } catch (error) {
    res.status(500).send({ message: "Failed to fetch studios" });
  }
}

export async function getSingleStudio(req, res) {
  try {
    const db = getDB();
    const id = req.params.id;

    if (!ObjectId.isValid(id)) {
      return res.status(400).send({ message: "Invalid studio ID" });
    }

    const studio = await db.collection("studios").findOne({
      _id: new ObjectId(id)
    });

    if (!studio) {
      return res.status(404).send({ message: "Studio not found" });
    }

    res.send(studio);
  } catch (error) {
    res.status(500).send({ message: "Failed to fetch studio" });
  }
}

export async function addStudio(req, res) {
  try {
    const db = getDB();

    const {
      title,
      category,
      hourlyRate,
      securityDeposit,
      maxCapacity,
      location,
      image,
      amenities,
      description
    } = req.body;

    if (!title || !category || !location) {
      return res.status(400).send({
        message: "Please provide all required fields"
      });
    }

    const newStudio = {
      title,
      category,
      hourlyRate: Number(hourlyRate),
      securityDeposit: Number(securityDeposit),
      maxCapacity: Number(maxCapacity),
      location,
      image,
      amenities: amenities || [],
      description,
      ownerName: req.user.name,
      ownerEmail: req.user.email,
      rating: 0,
      createdAt: new Date()
    };

    const result = await db.collection("studios").insertOne(newStudio);

    res.status(201).send({
      message: "Studio added successfully",
      insertedId: result.insertedId
    });
  } catch (error) {
    res.status(500).send({ message: "Failed to add studio" });
  }
}

export async function updateStudio(req, res) {
  try {
    const db = getDB();
    const id = req.params.id;

    if (!ObjectId.isValid(id)) {
      return res.status(400).send({ message: "Invalid studio ID" });
    }

    const {
      title,
      category,
      hourlyRate,
      securityDeposit,
      maxCapacity,
      location,
      image,
      amenities,
      description
    } = req.body;

    const result = await db.collection("studios").updateOne(
      {
        _id: new ObjectId(id),
        ownerEmail: req.user.email
      },
      {
        $set: {
          title,
          category,
          hourlyRate: Number(hourlyRate),
          securityDeposit: Number(securityDeposit),
          maxCapacity: Number(maxCapacity),
          location,
          image,
          amenities,
          description,
          updatedAt: new Date()
        }
      }
    );

    if (result.matchedCount === 0) {
      return res.status(404).send({
        message: "Studio not found or you are not its owner"
      });
    }

    res.send({ message: "Studio updated successfully" });
  } catch (error) {
    res.status(500).send({ message: "Failed to update studio" });
  }
}

export async function deleteStudio(req, res) {
  try {
    const db = getDB();
    const id = req.params.id;

    if (!ObjectId.isValid(id)) {
      return res.status(400).send({ message: "Invalid studio ID" });
    }

    const result = await db.collection("studios").deleteOne({
      _id: new ObjectId(id),
      ownerEmail: req.user.email
    });

    if (result.deletedCount === 0) {
      return res.status(404).send({
        message: "Studio not found or you are not its owner"
      });
    }

    res.send({ message: "Studio deleted successfully" });
  } catch (error) {
    res.status(500).send({ message: "Failed to delete studio" });
  }
}




export async function getFeaturedStudios(req, res) {
  try {
    const db = getDB();

    const studios = await db
      .collection("studios")
      .find({})
      .sort({ createdAt: -1, _id: -1 })
      .limit(6)
      .toArray();

    res.status(200).json(studios);
  } catch (error) {
    console.error("Failed to fetch featured studios:", error);

    res.status(500).json({
      message: "Failed to fetch featured studios"
    });
  }
}
