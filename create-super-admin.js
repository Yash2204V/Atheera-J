const mongoose = require('mongoose');
const User = require('./models/user.model');

// Default MongoDB URI
const MONGODB_URI = 'mongodb://127.0.0.1:27017/ATHEERA';

async function createSuperAdmin() {
    try {
        // Connect to MongoDB
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        // Check if super admin already exists
        const existingAdmin = await User.findOne({ email: 'admin@gmail.com' });
        if (existingAdmin) {
            console.log('Super admin already exists');
            process.exit(0);
        }

        // Create super admin user
        const superAdmin = new User({
            name: 'Super Admin',
            email: 'admin@gmail.com',
            password: 'Admin@123',
            role: 'super-admin',
            phoneVerified: true
        });

        // Save the user
        await superAdmin.save();
        console.log('Super admin created successfully');
        console.log('Email:', superAdmin.email);
        console.log('Password: Admin@123');

    } catch (error) {
        console.error('Error creating super admin:', error);
    } finally {
        // Close MongoDB connection
        await mongoose.connection.close();
        console.log('MongoDB connection closed');
    }
}

// Run the function
createSuperAdmin(); 