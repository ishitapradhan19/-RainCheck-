import express from "express";
import axios from "axios";
import bodyParser from "body-parser";

const port = 3000;
const app = express();
const API_KEY = "YOUR_API_KEY"; // Replace with your actual API key

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

app.get("/", (req, res) => {
    res.render("index", { weather: null, error: null });
});

app.post("/", async (req, res) => {
    const city = req.body.city;
    try {
        // First API call: Get coordinates of the city
        const geoUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=metric`;
        const geoResponse = await axios.get(geoUrl);

        if (!geoResponse.data.coord) {
            res.render("index", { weather: null, error: "City not found." });
            return;
        }

        const { lat, lon } = geoResponse.data.coord;

        console.log(`City: ${city}, Latitude: ${lat}, Longitude: ${lon}`);

        // Second API call: Get 5-day weather forecast 
        const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`;
        const forecastResponse = await axios.get(forecastUrl);

        // Get tomorrow's forecast 
        const forecastData = forecastResponse.data.list.filter(entry =>
            entry.dt_txt.includes("12:00:00")
        );

        if (forecastData.length === 0) {
            res.render("index", { weather: null, error: "Forecast data unavailable." });
            return;
        }

        const tomorrow = forecastData[1]; // Next day's noon forecast
        const weatherDescription = tomorrow.weather[0].description;
        const rainProbability = tomorrow.pop ? tomorrow.pop * 100 : 0;

        let message = `The weather in ${city} tomorrow will be ${weatherDescription}.`;
        message += rainProbability > 0 ? ` There is a ${rainProbability.toFixed(2)}% chance of rain.` : ` No rain expected.`;

        res.render("index", { weather: message, error: null });
    } catch (error) {
        console.error("Error fetching weather data:", error.response?.data || error.message);
        res.status(400).render("index", { weather: null, error: "Could not fetch data. Check API key or try again later." });
    }
});


app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});

