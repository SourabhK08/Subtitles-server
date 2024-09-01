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

const LogInSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
});

const Collection = mongoose.model("UserLogInSignupCollection", LogInSchema);

export default Collection;
