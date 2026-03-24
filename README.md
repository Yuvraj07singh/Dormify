# 🏠 Dormify – Student Housing Marketplace

Dormify is a full-stack web application built using the MERN stack that helps students find, list, and book affordable housing with integrated payments, maps, and real-time features.

---

## 🚀 Features

* 🔍 Search and explore student accommodations
* 🗺️ Interactive maps using OpenStreetMap (GIS)
* 💳 Secure online payments (Stripe / Razorpay)
* 📸 Image upload & management via Cloudinary
* 📧 Email notifications using Nodemailer
* 🔐 Authentication & authorization system
* 📱 Responsive UI for all devices

---

## 🛠️ Tech Stack

### Frontend

* React.js
* Tailwind CSS
* Axios

### Backend

* Node.js
* Express.js

### Database

* MongoDB Atlas

### Integrations

* OpenStreetMap (Leaflet)
* Stripe / Razorpay
* Cloudinary
* Nodemailer

---

## 📁 Project Structure

```
Dormify/
│
├── client/        # React frontend
├── server/        # Express backend
├── .gitignore
├── README.md
```

---

## ⚙️ Environment Variables

Create a `.env` file inside `/server`:

```
PORT=5000
MONGO_URI=your_mongodb_uri
JWT_SECRET=your_secret

STRIPE_SECRET_KEY=your_key
RAZORPAY_KEY_ID=your_key
RAZORPAY_SECRET=your_secret

CLOUDINARY_CLOUD_NAME=your_name
CLOUDINARY_API_KEY=your_key
CLOUDINARY_API_SECRET=your_secret

EMAIL_USER=your_email
EMAIL_PASS=your_password
```

---

## 🧑‍💻 Installation & Setup

### 1. Clone the repository

```
git clone https://github.com/your-username/Dormify.git
cd Dormify
```

### 2. Install dependencies

#### Backend

```
cd server
npm install
```

#### Frontend

```
cd ../client
npm install
```

---

### 3. Run the application

#### Start backend

```
cd server
npm start
```

#### Start frontend

```
cd client
npm start
```

---

## 🌐 Deployment

* Frontend → Vercel
* Backend → Render
* Database → MongoDB Atlas

---

## 🔒 Security

* All sensitive data is stored in environment variables
* No API keys are exposed in the repository
* GitHub secret scanning compliance

---

## 📌 Future Improvements

* Chat system between users
* Advanced filtering & recommendations
* Admin dashboard
* Mobile app version

---

## 🤝 Contributing

Pull requests are welcome. For major changes, please open an issue first.

---

## 📄 License

This project is licensed under the MIT License.

---

## 👨‍💻 Author

**Yuvraj Singh Kaushik**

---
