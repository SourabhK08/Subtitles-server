import mongoose from "mongoose";

mongoose
  .connect("mongodb://127.0.0.1:27017/UserDatabase", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Mongoose connected");
  })
  .catch((e) => {
    console.error("Failed to connect with DB", e);
  });

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
});

const Collection = mongoose.model("User", userSchema);

export default Collection;
