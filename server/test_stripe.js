const axios = require("axios");

async function test() {
    try {
        // Need to hit the endpoint via the app, wait, I can just require the logic locally or make an HTTP request.
        // It's authenticated, so I need to create a user and token first.
        const authClient = axios.create({ baseURL: "http://localhost:5000/api" });
        
        let login = await authClient.post("/auth/register", {
            name: "Tester", email: "stripe_test3@test.com", password: "password", role: "student"
        }).catch(err => err.response);
        
        if (login.status !== 201) {
            login = await authClient.post("/auth/login", { email: "stripe_test3@test.com", password: "password" });
        }
        
        const token = login.data.token;
        console.log("Got token.");
        
        const res = await axios.post("http://localhost:5000/api/stripe/create-checkout-session", {
            propertyId: "65161f36fa2d2", 
            propertyTitle: "Test Property",
            totalAmount: 5000,
            moveInDate: "2024-01-01",
            moveOutDate: "2024-06-01"
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        console.log("SUCCESS:", res.data);
    } catch (err) {
        console.error("FAIL:", err.response ? err.response.data : err.message);
    }
}

test();
