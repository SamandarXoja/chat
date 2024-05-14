import mongoose from "mongoose";


const { Schema } = mongoose;


const chatSchema = new Schema(
    {
        text: {
            type: String,
            required: true,
        }
    },
    {
        timestamps: true,
    }
);

export default mongoose.model('Chat', chatSchema);