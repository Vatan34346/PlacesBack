const HttpError = require("../models/http-errors");
const { validationResult } = require("express-validator");
const Place = require("../models/place");
const User = require("../models/user");
const mongoose = require("mongoose");

const getPlaceByID = async (req, res, next) => {
  const placeID = req.params.pid;
  let places;
  try {
    places = await Place.findById(placeID);
  } catch (err) {
    const error = new HttpError("Could not find place", 500);
    return next(error);
  }

  if (!places) {
    const error = new HttpError(`no places for  id: ${placeID}`, 404);
    return next(error);
  }

  res.json({ places: places.toObject({ getters: true }) });
};
const getPlacesByUserId = async (req, res, next) => {
  const uid = req.params.uid;
  let places;
  try {
    places = await Place.find({ creator: uid });
  } catch (err) {
    const error = new HttpError("Fetching places faild", 500);
    return next(error);
  }

  if (!places || places.length === 0) {
    return next(new HttpError(`no places for  id: ${uid}`, 404));
  }
  res.json({ places: places.map((p) => p.toObject({ getters: true })) });
};

const createPLace = async (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return next(new HttpError("Invalid input", 422));
  }

  const { title, description, address, creator } = req.body;

  const createdPlace = new Place({
    title,
    description,
    address,
    creator,
    location: {
      lat: 40.7484474,
      lng: -73.9871516,
    },
    image:
      "https://nunt.ru/wp-content/uploads/2019/05/kak-proverit-na-unikalnost-foto-onlajn.jpg",
  });

  let user;
  try {
    user = await User.findById(creator);
  } catch (err) {
    const error = new HttpError("Creating place failed", 500);
    return next(error);
  }

  if (!user) {
    const error = new HttpError("CUser not exists", 500);
    return next(error);
  }

  try {
    const session = await mongoose.startSession();
    session.startTransaction();
    await createdPlace.save({ session: session });

    user.places.push(createdPlace);

    await user.save({ session: session });

    await session.commitTransaction();
  } catch (err) {
    const error = new HttpError("Creating Place failed", 500);
    return next(error);
  }

  res.status(201).json({ place: createdPlace });
};

const updatePlaceById = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new HttpError("Invalid input", 422));
  }

  const { title, description } = req.body;
  const placeId = req.params.pid;

  let place;
  try {
    place = await Place.findById(placeId);
  } catch (err) {
    const error = new HttpError("Smthing went wrong", 500);

    return next(error);
  }

  place.title = title;
  place.description = description;

  try {
    await place.save();
  } catch (err) {
    const error = new HttpError("Smthing went wrong", 500);

    return next(error);
  }

  res.status(200).json({ place: place.toObject({ getters: true }) });
};

const deletePlace = async (req, res, next) => {
  const placeId = req.params.pid;

  let place;
  try {
    place = await Place.findById(placeId).populate("creator"); // from user model type
  } catch (err) {
    const error = new HttpError("Somthing go wrong", 500);
    return next(error);
  }
  if (!place) {
    const error = new HttpError("could not find place", 404);
    return next(error);
  }

  try {
    const session = await mongoose.startSession();
    session.startTransaction();
    await place.remove({ session: session });
    place.creator.places.pull(place);
    await place.creator.save({ session: session });
    await session.commitTransaction();
  } catch (err) {
    const error = new HttpError("Somthing go wrong", 500);
    return next(error);
  }
  res.status(200).json({ message: "DELETED" });
};

exports.getPlaceByID = getPlaceByID;
exports.getPlacesByUserId = getPlacesByUserId;
exports.createPLace = createPLace;
exports.updatePlaceById = updatePlaceById;
exports.deletePlace = deletePlace;
