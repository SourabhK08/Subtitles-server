import mongoose from "mongoose";

mongoose
  .connect(
    "mongodb+srv://ukdiaries1208:1234567890@transcriptgenerator.hmkhe.mongodb.net/UserDatabase?retryWrites=true&w=majority",
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }
  )
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
