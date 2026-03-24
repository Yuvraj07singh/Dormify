const router = require("express").Router();
const Property = require("../models/Property");
const User = require("../models/User");
const bcrypt = require("bcryptjs");

const seedProperties = [
    // ─── MUMBAI ──────────────────────────────────────────
    {
        title: "Modern 1BHK near IIT Bombay, Powai",
        description: "A beautifully designed 1BHK apartment in Hiranandani Gardens, Powai — just 5 minutes walk from IIT Bombay campus. Features marble flooring, modular kitchen, high-speed WiFi, and 24/7 water supply. Building has gym, swimming pool, and round-the-clock security.",
        propertyType: "apartment", location: "Hiranandani Gardens, Powai, Mumbai", locality: "Powai", city: "Mumbai", state: "Maharashtra",
        nearbyUniversity: "IIT Bombay", distanceFromCampus: "0.5 km", price: 22000, priceType: "month",
        latitude: 19.1334, longitude: 72.9133, source: "99acres", contactNumber: "+91 98765 43210",
        images: ["https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800", "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800", "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800"],
        amenities: ["WiFi", "AC", "Parking", "Gym", "Pool", "Security", "Kitchen", "Laundry"],
        bedrooms: 1, bathrooms: 1, maxOccupants: 2, furnished: true, leaseDuration: "11 months", genderPreference: "any",
        averageRating: 4.8, totalReviews: 34, reviews: []
    },
    {
        title: "Sea-Facing Studio in Bandra West",
        description: "Compact but luxurious studio apartment in Bandra West with stunning Arabian Sea views. Walking distance to Bandstand Promenade. Ideal for students at KC College or Mithibai. 24/7 security, power backup, and high-speed elevator.",
        propertyType: "studio", location: "Bandstand Road, Bandra West, Mumbai", locality: "Bandra West", city: "Mumbai", state: "Maharashtra",
        nearbyUniversity: "KC College", distanceFromCampus: "2.0 km", price: 35000, priceType: "month",
        latitude: 19.0544, longitude: 72.8200, source: "MagicBricks", contactNumber: "+91 98111 22334",
        images: ["https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800", "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800", "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800"],
        amenities: ["WiFi", "AC", "Security", "Gym", "Balcony", "Kitchen", "Laundry"],
        bedrooms: 1, bathrooms: 1, maxOccupants: 1, furnished: true, leaseDuration: "11 months", genderPreference: "any",
        averageRating: 4.6, totalReviews: 22, reviews: []
    },
    {
        title: "Affordable PG near Mumbai University",
        description: "Budget-friendly paying guest accommodation in Fort area, short walk to Mumbai University. Includes meals, WiFi, laundry. Common study hall. Perfect for undergrad and post-grad students.",
        propertyType: "shared-room", location: "Fort, Near CST, Mumbai", locality: "Fort", city: "Mumbai", state: "Maharashtra",
        nearbyUniversity: "Mumbai University", distanceFromCampus: "0.4 km", price: 8500, priceType: "month",
        latitude: 18.9322, longitude: 72.8347, source: "JustDial", contactNumber: "+91 98200 55667",
        images: ["https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800", "https://images.unsplash.com/photo-1536376072261-38c75010e6c9?w=800", "https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800"],
        amenities: ["WiFi", "Meals Included", "Laundry", "Study Desk", "Housekeeping", "RO Water"],
        bedrooms: 1, bathrooms: 1, maxOccupants: 3, furnished: true, leaseDuration: "6 months", genderPreference: "any",
        averageRating: 4.1, totalReviews: 67, reviews: []
    },

    // ─── DELHI ───────────────────────────────────────────
    {
        title: "PG Accommodation near Delhi University",
        description: "Fully furnished PG accommodation in Kamla Nagar, walking distance from Delhi University North Campus. Includes home-cooked meals, RO water, washing machine access, and housekeeping. Each room is air-cooled with attached washroom.",
        propertyType: "shared-room", location: "Kamla Nagar, North Campus, Delhi", locality: "Kamla Nagar", city: "Delhi", state: "Delhi",
        nearbyUniversity: "Delhi University", distanceFromCampus: "0.3 km", price: 9500, priceType: "month",
        latitude: 28.6846, longitude: 77.2067, source: "JustDial", contactNumber: "+91 99111 22334",
        images: ["https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800", "https://images.unsplash.com/photo-1536376072261-38c75010e6c9?w=800", "https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800"],
        amenities: ["WiFi", "Meals Included", "Laundry", "Housekeeping", "RO Water", "Study Desk"],
        bedrooms: 1, bathrooms: 1, maxOccupants: 2, furnished: true, leaseDuration: "6 months", genderPreference: "any",
        averageRating: 4.3, totalReviews: 56, reviews: []
    },
    {
        title: "Budget Studio near JNU, Delhi",
        description: "Affordable and clean studio apartment near Jawaharlal Nehru University (JNU) in Munirka. One bedroom, study desk, small kitchen area, and private bathroom. Metro connectivity via Hauz Khas station.",
        propertyType: "studio", location: "Munirka, Near JNU Campus, Delhi", locality: "Munirka", city: "Delhi", state: "Delhi",
        nearbyUniversity: "JNU Delhi", distanceFromCampus: "0.8 km", price: 7500, priceType: "month",
        latitude: 28.5402, longitude: 77.1699, source: "JustDial", contactNumber: "+91 99887 66554",
        images: ["https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800", "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800", "https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?w=800"],
        amenities: ["WiFi", "Study Desk", "Kitchen", "Security", "RO Water"],
        bedrooms: 1, bathrooms: 1, maxOccupants: 1, furnished: true, leaseDuration: "6 months", genderPreference: "any",
        averageRating: 4.1, totalReviews: 41, reviews: []
    },
    {
        title: "Luxury 2BHK near Jamia Millia Islamia",
        description: "Premium 2BHK apartment in Okhla with modern interiors, 3 km from Jamia Millia Islamia. Marble flooring, modular kitchen, split AC. Gated society with park, gym, and covered parking.",
        propertyType: "apartment", location: "Okhla, Near Jamia Campus, Delhi", locality: "Okhla", city: "Delhi", state: "Delhi",
        nearbyUniversity: "Jamia Millia Islamia", distanceFromCampus: "3.0 km", price: 26000, priceType: "month",
        latitude: 28.5525, longitude: 77.2700, source: "99acres", contactNumber: "+91 98765 11223",
        images: ["https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800", "https://images.unsplash.com/photo-1600573472556-e636c2acda9e?w=800", "https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=800"],
        amenities: ["WiFi", "AC", "Parking", "Gym", "Kitchen", "Security", "Balcony", "Study Desk"],
        bedrooms: 2, bathrooms: 2, maxOccupants: 3, furnished: true, leaseDuration: "11 months", genderPreference: "any",
        averageRating: 4.5, totalReviews: 18, reviews: []
    },
    {
        title: "Boys Hostel near IIT Delhi",
        description: "Clean and well-maintained boys hostel in Hauz Khas, close to IIT Delhi gate. Includes meals, WiFi, common study area, and recreational room. CCTV surveillance and warden on premises. Very popular choice among IIT and JNU students.",
        propertyType: "dorm", location: "Hauz Khas, Near IIT Gate, Delhi", locality: "Hauz Khas", city: "Delhi", state: "Delhi",
        nearbyUniversity: "IIT Delhi", distanceFromCampus: "0.6 km", price: 8000, priceType: "month",
        latitude: 28.5494, longitude: 77.2001, source: "JustDial", contactNumber: "+91 98100 44556",
        images: ["https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800", "https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?w=800", "https://images.unsplash.com/photo-1502672023488-70e25813eb80?w=800"],
        amenities: ["WiFi", "Meals Included", "Study Desk", "Security", "Housekeeping", "RO Water"],
        bedrooms: 1, bathrooms: 1, maxOccupants: 2, furnished: true, leaseDuration: "12 months", genderPreference: "male",
        averageRating: 4.0, totalReviews: 73, reviews: []
    },

    // ─── BANGALORE ───────────────────────────────────────
    {
        title: "Spacious 2BHK near IISc Bangalore",
        description: "Premium 2BHK apartment in Malleswaram. Just a short auto ride from Indian Institute of Science (IISc). Large balcony, wooden flooring, semi-modular kitchen, and covered car parking.",
        propertyType: "apartment", location: "18th Cross, Malleswaram, Bangalore", locality: "Malleswaram", city: "Bangalore", state: "Karnataka",
        nearbyUniversity: "IISc Bangalore", distanceFromCampus: "1.2 km", price: 28000, priceType: "month",
        latitude: 13.0067, longitude: 77.5651, source: "99acres", contactNumber: "+91 99002 33445",
        images: ["https://images.unsplash.com/photo-1560185893-a55cbc8c57e8?w=800", "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800", "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800"],
        amenities: ["WiFi", "AC", "Parking", "Study Desk", "Balcony", "Kitchen", "Gym", "Security"],
        bedrooms: 2, bathrooms: 2, maxOccupants: 3, furnished: true, leaseDuration: "11 months", genderPreference: "any",
        averageRating: 4.7, totalReviews: 28, reviews: []
    },
    {
        title: "Co-living Space in Koramangala",
        description: "Trendy co-living space in Koramangala 4th Block — Bangalore's startup hub. Shared living room, high-speed internet, bean bags, community kitchen, and weekly events. Perfect for students at Christ University.",
        propertyType: "shared-room", location: "4th Block, Koramangala, Bangalore", locality: "Koramangala", city: "Bangalore", state: "Karnataka",
        nearbyUniversity: "Christ University", distanceFromCampus: "1.0 km", price: 12000, priceType: "month",
        latitude: 12.9352, longitude: 77.6245, source: "JustDial", contactNumber: "+91 94480 55667",
        images: ["https://images.unsplash.com/photo-1600047509358-9dc75507daeb?w=800", "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800", "https://images.unsplash.com/photo-1600210491892-03d54c0aaf87?w=800"],
        amenities: ["WiFi", "AC", "Meals Included", "Housekeeping", "Co-working Space", "Laundry", "Study Desk", "Security"],
        bedrooms: 1, bathrooms: 1, maxOccupants: 2, furnished: true, leaseDuration: "3 months", genderPreference: "any",
        averageRating: 4.5, totalReviews: 63, reviews: []
    },
    {
        title: "1BHK Flat in Electronics City",
        description: "Modern 1BHK in a gated community near Electronics City Phase-1. Close to IIIT-B and multiple tech parks. Bus connectivity to Silk Board. 24/7 security, CCTV, and power backup.",
        propertyType: "apartment", location: "Electronics City Phase 1, Bangalore", locality: "Electronics City", city: "Bangalore", state: "Karnataka",
        nearbyUniversity: "IIIT Bangalore", distanceFromCampus: "2.5 km", price: 16000, priceType: "month",
        latitude: 12.8456, longitude: 77.6712, source: "MagicBricks", contactNumber: "+91 99020 88990",
        images: ["https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800", "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=800", "https://images.unsplash.com/photo-1600210492493-0946911123ea?w=800"],
        amenities: ["WiFi", "AC", "Parking", "Kitchen", "Security", "Gym", "Balcony"],
        bedrooms: 1, bathrooms: 1, maxOccupants: 2, furnished: true, leaseDuration: "11 months", genderPreference: "any",
        averageRating: 4.3, totalReviews: 35, reviews: []
    },

    // ─── CHENNAI ──────────────────────────────────────────
    {
        title: "3BHK Independent House near Anna University",
        description: "Spacious 3BHK independent house in Guindy, ideal for a group of Anna University students. Large living room, modular kitchen, two bathrooms, covered parking, and a small garden.",
        propertyType: "house", location: "Guindy, Chennai", locality: "Guindy", city: "Chennai", state: "Tamil Nadu",
        nearbyUniversity: "Anna University", distanceFromCampus: "0.7 km", price: 35000, priceType: "month",
        latitude: 13.0108, longitude: 80.2206, source: "JustDial", contactNumber: "+91 98400 11223",
        images: ["https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800", "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=800", "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800"],
        amenities: ["WiFi", "Parking", "Kitchen", "Study Desk", "Backyard", "Security", "Laundry"],
        bedrooms: 3, bathrooms: 2, maxOccupants: 4, furnished: true, leaseDuration: "11 months", genderPreference: "any",
        averageRating: 4.5, totalReviews: 22, reviews: []
    },
    {
        title: "Luxury 2BHK near IIT Madras",
        description: "Elegant 2BHK flat in Adyar, close to IIT Madras campus and the scenic Adyar river. Split AC in all rooms, modular kitchen with chimney, and ample storage. Power backup and covered parking.",
        propertyType: "apartment", location: "Adyar, Near IIT Gate, Chennai", locality: "Adyar", city: "Chennai", state: "Tamil Nadu",
        nearbyUniversity: "IIT Madras", distanceFromCampus: "0.6 km", price: 25000, priceType: "month",
        latitude: 12.9916, longitude: 80.2336, source: "99acres", contactNumber: "+91 98400 22334",
        images: ["https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800", "https://images.unsplash.com/photo-1600573472556-e636c2acda9e?w=800", "https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=800"],
        amenities: ["WiFi", "AC", "Parking", "Kitchen", "Study Desk", "Balcony", "Security", "Gym"],
        bedrooms: 2, bathrooms: 2, maxOccupants: 3, furnished: true, leaseDuration: "11 months", genderPreference: "any",
        averageRating: 4.9, totalReviews: 17, reviews: []
    },
    {
        title: "Budget PG near SRM University",
        description: "Affordable PG in Potheri, right next to SRM University campus. Triple sharing rooms with meals included. Campus shuttle available. Ideal for first-year students.",
        propertyType: "shared-room", location: "Potheri, Near SRM Campus, Chennai", locality: "Potheri", city: "Chennai", state: "Tamil Nadu",
        nearbyUniversity: "SRM University", distanceFromCampus: "0.2 km", price: 6500, priceType: "month",
        latitude: 12.8231, longitude: 80.0424, source: "JustDial", contactNumber: "+91 98400 33445",
        images: ["https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=800", "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800", "https://images.unsplash.com/photo-1600585153490-76fb20a32601?w=800"],
        amenities: ["WiFi", "Meals Included", "Shuttle", "Laundry", "Study Desk", "RO Water"],
        bedrooms: 1, bathrooms: 1, maxOccupants: 3, furnished: true, leaseDuration: "10 months", genderPreference: "any",
        averageRating: 3.9, totalReviews: 85, reviews: []
    },

    // ─── PUNE ────────────────────────────────────────────
    {
        title: "Girls PG near Symbiosis Pune",
        description: "Safe and comfortable girls-only PG near Symbiosis International University in Lavale. Includes breakfast and dinner, WiFi, laundry service, and 24/7 CCTV security.",
        propertyType: "private-room", location: "Lavale, Near Hinjewadi, Pune", locality: "Lavale", city: "Pune", state: "Maharashtra",
        nearbyUniversity: "Symbiosis University", distanceFromCampus: "0.4 km", price: 11000, priceType: "month",
        latitude: 18.5973, longitude: 73.7300, source: "JustDial", contactNumber: "+91 98900 11223",
        images: ["https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=800", "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800", "https://images.unsplash.com/photo-1600585153490-76fb20a32601?w=800"],
        amenities: ["WiFi", "Meals Included", "Laundry", "Security", "Study Desk", "Housekeeping", "Shuttle"],
        bedrooms: 1, bathrooms: 1, maxOccupants: 1, furnished: true, leaseDuration: "6 months", genderPreference: "female",
        averageRating: 4.4, totalReviews: 38, reviews: []
    },
    {
        title: "Modern 1BHK near COEP Pune",
        description: "Well-furnished 1BHK in Shivajinagar, steps away from College of Engineering Pune (COEP). Vitrified flooring, modular kitchen, geyser. Metro station nearby for easy transit.",
        propertyType: "apartment", location: "Shivajinagar, Pune", locality: "Shivajinagar", city: "Pune", state: "Maharashtra",
        nearbyUniversity: "COEP Pune", distanceFromCampus: "0.5 km", price: 15000, priceType: "month",
        latitude: 18.5306, longitude: 73.8497, source: "99acres", contactNumber: "+91 98900 22334",
        images: ["https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800", "https://images.unsplash.com/photo-1560185893-a55cbc8c57e8?w=800", "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800"],
        amenities: ["WiFi", "AC", "Kitchen", "Study Desk", "Parking", "Security"],
        bedrooms: 1, bathrooms: 1, maxOccupants: 2, furnished: true, leaseDuration: "11 months", genderPreference: "any",
        averageRating: 4.6, totalReviews: 29, reviews: []
    },
    {
        title: "Co-living Space near Pune University",
        description: "Vibrant co-living space in Aundh, popular with Pune University and Fergusson College students. Community events, gym, rooftop garden, and fully equipped kitchen.",
        propertyType: "shared-room", location: "Aundh, Pune", locality: "Aundh", city: "Pune", state: "Maharashtra",
        nearbyUniversity: "Pune University", distanceFromCampus: "2.0 km", price: 10500, priceType: "month",
        latitude: 18.5591, longitude: 73.8070, source: "MagicBricks", contactNumber: "+91 98900 44556",
        images: ["https://images.unsplash.com/photo-1600047509358-9dc75507daeb?w=800", "https://images.unsplash.com/photo-1600210491892-03d54c0aaf87?w=800", "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800"],
        amenities: ["WiFi", "Gym", "Kitchen", "Rooftop", "Study Desk", "Laundry", "Co-working Space"],
        bedrooms: 1, bathrooms: 1, maxOccupants: 2, furnished: true, leaseDuration: "3 months", genderPreference: "any",
        averageRating: 4.3, totalReviews: 52, reviews: []
    },

    // ─── HYDERABAD ───────────────────────────────────────
    {
        title: "Lake-View Apartment near IIIT Hyderabad",
        description: "Stunning 1BHK apartment in Gachibowli with views of Durgam Cheruvu lake. Walking distance to IIIT Hyderabad. Large windows, split AC, modular kitchen, and gym access.",
        propertyType: "apartment", location: "Gachibowli, Near IIIT-H, Hyderabad", locality: "Gachibowli", city: "Hyderabad", state: "Telangana",
        nearbyUniversity: "IIIT Hyderabad", distanceFromCampus: "0.5 km", price: 18000, priceType: "month",
        latitude: 17.4435, longitude: 78.3500, source: "99acres", contactNumber: "+91 90000 11223",
        images: ["https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800", "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800", "https://images.unsplash.com/photo-1600573472592-401b489a3cdc?w=800"],
        amenities: ["WiFi", "AC", "Gym", "Pool", "Parking", "Kitchen", "Balcony", "Security"],
        bedrooms: 1, bathrooms: 1, maxOccupants: 2, furnished: true, leaseDuration: "11 months", genderPreference: "any",
        averageRating: 4.8, totalReviews: 21, reviews: []
    },
    {
        title: "PG near Osmania University",
        description: "Well-managed PG accommodation in Tarnaka, walking distance to Osmania University campus. Home-cooked meals, WiFi, and housekeeping. Shared and private rooms available.",
        propertyType: "private-room", location: "Tarnaka, Hyderabad", locality: "Tarnaka", city: "Hyderabad", state: "Telangana",
        nearbyUniversity: "Osmania University", distanceFromCampus: "0.8 km", price: 7000, priceType: "month",
        latitude: 17.4260, longitude: 78.5430, source: "JustDial", contactNumber: "+91 90000 22334",
        images: ["https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800", "https://images.unsplash.com/photo-1600585153490-76fb20a32601?w=800", "https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=800"],
        amenities: ["WiFi", "Meals Included", "Housekeeping", "Study Desk", "RO Water", "Laundry"],
        bedrooms: 1, bathrooms: 1, maxOccupants: 1, furnished: true, leaseDuration: "6 months", genderPreference: "any",
        averageRating: 4.2, totalReviews: 44, reviews: []
    },

    // ─── KOLKATA ──────────────────────────────────────────
    {
        title: "Heritage Flat near Jadavpur University",
        description: "Charming 2BHK flat in a heritage building near Jadavpur University. High ceilings, large windows, and a peaceful academic atmosphere. Walking distance to campus.",
        propertyType: "apartment", location: "Jadavpur, Kolkata", locality: "Jadavpur", city: "Kolkata", state: "West Bengal",
        nearbyUniversity: "Jadavpur University", distanceFromCampus: "0.5 km", price: 14000, priceType: "month",
        latitude: 22.4968, longitude: 88.3714, source: "99acres", contactNumber: "+91 98300 11223",
        images: ["https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800", "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=800", "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800"],
        amenities: ["WiFi", "Kitchen", "Study Desk", "Balcony", "Security"],
        bedrooms: 2, bathrooms: 1, maxOccupants: 3, furnished: true, leaseDuration: "11 months", genderPreference: "any",
        averageRating: 4.4, totalReviews: 31, reviews: []
    },
    {
        title: "Mess-Style PG near Presidency University",
        description: "Traditional mess-style PG in College Street area, steps from Presidency University. Daily Bengali meals, common study room, and a lively student community.",
        propertyType: "shared-room", location: "College Street, Kolkata", locality: "College Street", city: "Kolkata", state: "West Bengal",
        nearbyUniversity: "Presidency University", distanceFromCampus: "0.3 km", price: 5500, priceType: "month",
        latitude: 22.5774, longitude: 88.3617, source: "JustDial", contactNumber: "+91 98300 22334",
        images: ["https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800", "https://images.unsplash.com/photo-1536376072261-38c75010e6c9?w=800", "https://images.unsplash.com/photo-1502672023488-70e25813eb80?w=800"],
        amenities: ["WiFi", "Meals Included", "Study Desk", "RO Water", "Housekeeping"],
        bedrooms: 1, bathrooms: 1, maxOccupants: 2, furnished: true, leaseDuration: "12 months", genderPreference: "any",
        averageRating: 4.0, totalReviews: 58, reviews: []
    },

    // ─── GOA ─────────────────────────────────────────────
    {
        title: "Premium Flat near BITS Pilani, Goa Campus",
        description: "Luxurious 1BHK flat in Zuarinagar, near BITS Pilani Goa Campus. Features sea breeze, modern interiors, modular kitchen, and access to a rooftop terrace. Beach is just 15 minutes away.",
        propertyType: "apartment", location: "Zuarinagar, South Goa", locality: "Zuarinagar", city: "Goa", state: "Goa",
        nearbyUniversity: "BITS Pilani Goa", distanceFromCampus: "1.5 km", price: 15000, priceType: "month",
        latitude: 15.3982, longitude: 73.8780, source: "99acres", contactNumber: "+91 98900 55667",
        images: ["https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800", "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=800", "https://images.unsplash.com/photo-1600210492493-0946911123ea?w=800"],
        amenities: ["WiFi", "AC", "Kitchen", "Balcony", "Parking", "Rooftop", "Study Desk"],
        bedrooms: 1, bathrooms: 1, maxOccupants: 2, furnished: true, leaseDuration: "11 months", genderPreference: "any",
        averageRating: 4.6, totalReviews: 19, reviews: []
    },

    // ─── VARANASI ────────────────────────────────────────
    {
        title: "Hostel-Style Room near BHU Varanasi",
        description: "Clean and affordable hostel-style accommodation near Banaras Hindu University (BHU) in Lanka. Basic furniture, common bathroom, rooftop study area. Walking distance to Lanka Market.",
        propertyType: "dorm", location: "Lanka, Near BHU Gate, Varanasi", locality: "Lanka", city: "Varanasi", state: "Uttar Pradesh",
        nearbyUniversity: "BHU Varanasi", distanceFromCampus: "0.2 km", price: 4500, priceType: "month",
        latitude: 25.2677, longitude: 82.9913, source: "JustDial", contactNumber: "+91 94150 11223",
        images: ["https://images.unsplash.com/photo-1600607687644-c7171b42498f?w=800", "https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?w=800", "https://images.unsplash.com/photo-1502672023488-70e25813eb80?w=800"],
        amenities: ["WiFi", "Study Desk", "RO Water", "Rooftop"],
        bedrooms: 1, bathrooms: 1, maxOccupants: 1, furnished: true, leaseDuration: "12 months", genderPreference: "any",
        averageRating: 4.0, totalReviews: 29, reviews: []
    },

    // ─── TIRUCHIRAPPALLI ─────────────────────────────────
    {
        title: "Affordable PG near NIT Trichy",
        description: "Well-maintained PG accommodation near National Institute of Technology, Tiruchirappalli. Includes 3 meals per day, WiFi, cleaning service, and power backup.",
        propertyType: "private-room", location: "Thuvakudi, Near NIT, Tiruchirappalli", locality: "Thuvakudi", city: "Tiruchirappalli", state: "Tamil Nadu",
        nearbyUniversity: "NIT Trichy", distanceFromCampus: "0.3 km", price: 6000, priceType: "month",
        latitude: 10.7603, longitude: 78.8140, source: "JustDial", contactNumber: "+91 98430 11223",
        images: ["https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800", "https://images.unsplash.com/photo-1600585153490-76fb20a32601?w=800", "https://images.unsplash.com/photo-1600566752229-250ed79470f8?w=800"],
        amenities: ["WiFi", "Meals Included", "Housekeeping", "Study Desk", "RO Water"],
        bedrooms: 1, bathrooms: 1, maxOccupants: 1, furnished: true, leaseDuration: "10 months", genderPreference: "any",
        averageRating: 4.2, totalReviews: 47, reviews: []
    },

    // ─── JAIPUR ──────────────────────────────────────────
    {
        title: "Furnished Studio near MNIT Jaipur",
        description: "Fully furnished studio apartment in Malviya Nagar, 10 minutes from Malaviya National Institute of Technology. Kitchen, study desk, AC, and attached bathroom. Peaceful residential area.",
        propertyType: "studio", location: "Malviya Nagar, Jaipur", locality: "Malviya Nagar", city: "Jaipur", state: "Rajasthan",
        nearbyUniversity: "MNIT Jaipur", distanceFromCampus: "1.0 km", price: 9000, priceType: "month",
        latitude: 26.8528, longitude: 75.8066, source: "MagicBricks", contactNumber: "+91 99280 11223",
        images: ["https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800", "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800", "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800"],
        amenities: ["WiFi", "AC", "Kitchen", "Study Desk", "Security", "Parking"],
        bedrooms: 1, bathrooms: 1, maxOccupants: 1, furnished: true, leaseDuration: "11 months", genderPreference: "any",
        averageRating: 4.3, totalReviews: 26, reviews: []
    },
    {
        title: "Boys PG near Rajasthan University",
        description: "Affordable boys PG in JLN Marg area, close to University of Rajasthan. Clean rooms, daily tiffin, and common room with TV. Very popular among university students.",
        propertyType: "shared-room", location: "JLN Marg, Jaipur", locality: "JLN Marg", city: "Jaipur", state: "Rajasthan",
        nearbyUniversity: "Rajasthan University", distanceFromCampus: "0.6 km", price: 5000, priceType: "month",
        latitude: 26.8975, longitude: 75.8127, source: "JustDial", contactNumber: "+91 99280 22334",
        images: ["https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800", "https://images.unsplash.com/photo-1536376072261-38c75010e6c9?w=800", "https://images.unsplash.com/photo-1502672023488-70e25813eb80?w=800"],
        amenities: ["WiFi", "Meals Included", "Study Desk", "RO Water", "Laundry"],
        bedrooms: 1, bathrooms: 1, maxOccupants: 2, furnished: true, leaseDuration: "12 months", genderPreference: "male",
        averageRating: 3.8, totalReviews: 61, reviews: []
    },

    // ─── AHMEDABAD ───────────────────────────────────────
    {
        title: "2BHK near IIM Ahmedabad",
        description: "Spacious 2BHK apartment in Vastrapur, close to IIM Ahmedabad campus. Modern amenities, covered parking, jogging track, and gated community. Ideal for MBA students.",
        propertyType: "apartment", location: "Vastrapur, Ahmedabad", locality: "Vastrapur", city: "Ahmedabad", state: "Gujarat",
        nearbyUniversity: "IIM Ahmedabad", distanceFromCampus: "1.0 km", price: 20000, priceType: "month",
        latitude: 23.0304, longitude: 72.5290, source: "99acres", contactNumber: "+91 98250 11223",
        images: ["https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800", "https://images.unsplash.com/photo-1600573472556-e636c2acda9e?w=800", "https://images.unsplash.com/photo-1560185893-a55cbc8c57e8?w=800"],
        amenities: ["WiFi", "AC", "Parking", "Gym", "Kitchen", "Security", "Balcony", "Study Desk"],
        bedrooms: 2, bathrooms: 2, maxOccupants: 3, furnished: true, leaseDuration: "11 months", genderPreference: "any",
        averageRating: 4.7, totalReviews: 23, reviews: []
    },
    {
        title: "Budget PG near Gujarat University",
        description: "Simple and affordable PG near Gujarat University campus in Navrangpura. Ideal for undergrad students. Includes meals, WiFi, and cleaning service.",
        propertyType: "shared-room", location: "Navrangpura, Ahmedabad", locality: "Navrangpura", city: "Ahmedabad", state: "Gujarat",
        nearbyUniversity: "Gujarat University", distanceFromCampus: "0.5 km", price: 5500, priceType: "month",
        latitude: 23.0389, longitude: 72.5610, source: "JustDial", contactNumber: "+91 98250 22334",
        images: ["https://images.unsplash.com/photo-1600047509358-9dc75507daeb?w=800", "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800", "https://images.unsplash.com/photo-1536376072261-38c75010e6c9?w=800"],
        amenities: ["WiFi", "Meals Included", "Housekeeping", "RO Water", "Study Desk"],
        bedrooms: 1, bathrooms: 1, maxOccupants: 2, furnished: true, leaseDuration: "12 months", genderPreference: "any",
        averageRating: 3.9, totalReviews: 45, reviews: []
    },

    // ─── CHANDIGARH ──────────────────────────────────────
    {
        title: "Premium 1BHK near PEC Chandigarh",
        description: "Well-designed 1BHK in Sector 12, Chandigarh. Close to Punjab Engineering College and Chandigarh University. Clean neighborhood, parks nearby, and excellent connectivity.",
        propertyType: "apartment", location: "Sector 12, Chandigarh", locality: "Sector 12", city: "Chandigarh", state: "Chandigarh",
        nearbyUniversity: "PEC Chandigarh", distanceFromCampus: "1.2 km", price: 13000, priceType: "month",
        latitude: 30.7565, longitude: 76.7873, source: "MagicBricks", contactNumber: "+91 98140 11223",
        images: ["https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800", "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800", "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800"],
        amenities: ["WiFi", "AC", "Parking", "Kitchen", "Security", "Study Desk", "Balcony"],
        bedrooms: 1, bathrooms: 1, maxOccupants: 2, furnished: true, leaseDuration: "11 months", genderPreference: "any",
        averageRating: 4.5, totalReviews: 19, reviews: []
    },

    // ─── LUCKNOW ─────────────────────────────────────────
    {
        title: "Spacious Flat near Lucknow University",
        description: "Roomy 2BHK apartment in Hazratganj, walking distance to Lucknow University. High ceilings, marble flooring, and a large balcony overlooking the city. Excellent food options nearby.",
        propertyType: "apartment", location: "Hazratganj, Lucknow", locality: "Hazratganj", city: "Lucknow", state: "Uttar Pradesh",
        nearbyUniversity: "Lucknow University", distanceFromCampus: "0.7 km", price: 12000, priceType: "month",
        latitude: 26.8519, longitude: 80.9457, source: "99acres", contactNumber: "+91 98390 11223",
        images: ["https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800", "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800", "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800"],
        amenities: ["WiFi", "Kitchen", "Study Desk", "Balcony", "Parking", "Security"],
        bedrooms: 2, bathrooms: 1, maxOccupants: 3, furnished: true, leaseDuration: "11 months", genderPreference: "any",
        averageRating: 4.4, totalReviews: 27, reviews: []
    },
    {
        title: "Girls PG near BBAU Lucknow",
        description: "Safe girls-only PG near Babasaheb Bhimrao Ambedkar University. Meals, WiFi, CCTV, and female warden. Single and double sharing rooms available.",
        propertyType: "private-room", location: "Vidya Vihar, Near BBAU, Lucknow", locality: "Vidya Vihar", city: "Lucknow", state: "Uttar Pradesh",
        nearbyUniversity: "BBAU Lucknow", distanceFromCampus: "0.4 km", price: 6500, priceType: "month",
        latitude: 26.8763, longitude: 80.9985, source: "JustDial", contactNumber: "+91 98390 22334",
        images: ["https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=800", "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800", "https://images.unsplash.com/photo-1600585153490-76fb20a32601?w=800"],
        amenities: ["WiFi", "Meals Included", "Security", "Study Desk", "Housekeeping", "RO Water"],
        bedrooms: 1, bathrooms: 1, maxOccupants: 1, furnished: true, leaseDuration: "6 months", genderPreference: "female",
        averageRating: 4.1, totalReviews: 36, reviews: []
    },

    // ─── KOTA ────────────────────────────────────────────
    {
        title: "Student Room near Allen Career Institute, Kota",
        description: "Purpose-built student room in Talwandi area near Allen Career Institute. Includes study desk with lamp, single bed, shared bathroom, and daily meals. Designed for JEE/NEET aspirants.",
        propertyType: "private-room", location: "Talwandi, Kota", locality: "Talwandi", city: "Kota", state: "Rajasthan",
        nearbyUniversity: "Allen Career Institute", distanceFromCampus: "0.3 km", price: 7000, priceType: "month",
        latitude: 25.1804, longitude: 75.8609, source: "JustDial", contactNumber: "+91 99280 33445",
        images: ["https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800", "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800", "https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?w=800"],
        amenities: ["WiFi", "Meals Included", "Study Desk", "RO Water", "Laundry"],
        bedrooms: 1, bathrooms: 1, maxOccupants: 1, furnished: true, leaseDuration: "12 months", genderPreference: "any",
        averageRating: 4.2, totalReviews: 93, reviews: []
    },
    {
        title: "Twin Sharing PG near Resonance Kota",
        description: "Budget-friendly twin sharing PG for coaching students near Resonance campus. Home-style meals, common study area, and evening snacks. Many toppers have stayed here!",
        propertyType: "shared-room", location: "Mahaveer Nagar, Kota", locality: "Mahaveer Nagar", city: "Kota", state: "Rajasthan",
        nearbyUniversity: "Resonance Kota", distanceFromCampus: "0.5 km", price: 5500, priceType: "month",
        latitude: 25.1750, longitude: 75.8500, source: "JustDial", contactNumber: "+91 99280 44556",
        images: ["https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800", "https://images.unsplash.com/photo-1536376072261-38c75010e6c9?w=800", "https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800"],
        amenities: ["WiFi", "Meals Included", "Study Desk", "RO Water", "Housekeeping", "Laundry"],
        bedrooms: 1, bathrooms: 1, maxOccupants: 2, furnished: true, leaseDuration: "12 months", genderPreference: "any",
        averageRating: 4.0, totalReviews: 78, reviews: []
    }
];

router.post("/seed", async (req, res) => {
    try {
        // Create landlord accounts for different cities
        const landlordData = [
            { name: "Rajesh Kumar", email: "landlord@dormify.com", phone: "+91 98765 43210", bio: "Experienced property manager with 15+ years in Mumbai real estate.", verifiedLandlord: true, responseTime: "Within 1 hour" },
            { name: "Sunita Verma", email: "landlord2@dormify.com", phone: "+91 99111 22334", bio: "Managing student accommodations in Delhi NCR since 2010.", verifiedLandlord: true, responseTime: "Within 2 hours" },
            { name: "Karthik Iyer", email: "landlord3@dormify.com", phone: "+91 99002 33445", bio: "Bangalore-based property owner specializing in tech-hub rentals.", verifiedLandlord: true, responseTime: "Within 3 hours" },
            { name: "Meera Devi", email: "landlord4@dormify.com", phone: "+91 98400 11223", bio: "Chennai & Tamil Nadu property expert with student-friendly accommodations.", verifiedLandlord: false, responseTime: "Within 24 hours" },
            { name: "Amit Patel", email: "landlord5@dormify.com", phone: "+91 98250 11223", bio: "Gujarat's trusted name in affordable student housing near top universities.", verifiedLandlord: true, responseTime: "Within 4 hours" }
        ];

        const landlords = [];
        const hashedPassword = await bcrypt.hash("password123", 10);

        for (const data of landlordData) {
            let landlord = await User.findOne({ email: data.email });
            if (!landlord) {
                landlord = new User({
                    ...data,
                    password: hashedPassword,
                    role: "landlord"
                });
                await landlord.save();
            }
            landlords.push(landlord);
        }

        // Create demo students
        const studentData = [
            { name: "Priya Sharma", email: "student@dormify.com", university: "IIT Bombay", phone: "+91 91234 56789", bio: "3rd year Computer Science student at IIT Bombay." },
            { name: "Rahul Gupta", email: "student2@dormify.com", university: "Delhi University", phone: "+91 91234 67890", bio: "MBA student at Delhi University, looking for comfortable accommodation." }
        ];

        for (const data of studentData) {
            let student = await User.findOne({ email: data.email });
            if (!student) {
                student = new User({
                    ...data,
                    password: hashedPassword,
                    role: "student"
                });
                await student.save();
            }
        }

        // Clear existing properties
        await Property.deleteMany({});

        // Assign properties to landlords based on city
        const cityLandlordMap = {
            "Mumbai": 0, "Delhi": 1, "Bangalore": 2, "Chennai": 3, "Pune": 0,
            "Hyderabad": 2, "Kolkata": 1, "Goa": 3, "Varanasi": 1,
            "Tiruchirappalli": 3, "Jaipur": 4, "Ahmedabad": 4,
            "Chandigarh": 1, "Lucknow": 1, "Kota": 4
        };

        const propertiesWithOwner = seedProperties.map(p => {
            const landlordIdx = cityLandlordMap[p.city] || 0;
            return {
                ...p,
                owner: landlords[landlordIdx]._id,
                availableFrom: new Date(),
                locationData: {
                    type: "Point",
                    coordinates: [p.longitude, p.latitude]
                }
            };
        });

        await Property.insertMany(propertiesWithOwner);

        res.json({
            message: "Database seeded successfully with Indian rental data!",
            properties: seedProperties.length,
            landlords: landlordData.length,
            demoAccounts: {
                students: [
                    { email: "student@dormify.com", password: "password123" },
                    { email: "student2@dormify.com", password: "password123" }
                ],
                landlords: landlordData.map(l => ({ email: l.email, password: "password123", name: l.name }))
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
