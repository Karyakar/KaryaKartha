const express = require("express")
const PORT = process.env.PORT || 3000
const app = express()

async function connectToMongoDB() {
    try {
      await mongoose.connect('mongodb://localhost:27017/karyakarta', {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      console.log('Connected to MongoDB');
    } catch (error) {
      console.error('Error connecting to MongoDB:', error);
    }
  }
  
connectToMongoDB();

app.use('/',require("./routes/Auth"))

app.listen(PORT,()=>{
    console.log(`Server is running on port ${PORT}`)
})
