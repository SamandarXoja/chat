import express from "express";

const app = express();

app.get('/', (req, res) => {
    res.send('Hello world11!');
})


app.listen(5555, (err) => {
    if (err) {
        return console.log(err);
    }

    console.log('Server Ok');
})