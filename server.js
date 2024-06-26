const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(cors());

// Nodemailer transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

// Map to store OTPs (In production, consider using a more scalable and secure solution)
const otpMap = new Map();


// POST route for sending OTP
app.post('/send-otp', async (req, res) => {
    const { name, eventName, email } = req.body; // Ensure 'email' is correctly extracted from req.body

    try {
        // Generate OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        // Store OTP in memory map (In production, consider using a database)
        otpMap.set(email, otp);

        // Email content
        const mailOptions = {
            from: process.env.EMAIL_USER, // Replace with your email
            to: email,
            subject: 'OTP for Event Participation',
            html: `
                <h2 style="color: blue; font-weight: bold;">SIJGERIA UMESH CHANDRA SMRITI SANGHA</h2>
                <p>Hello ${name},</p>
                <p>You are trying to participate in the event '${eventName}'.</p>
                <p>Your OTP for verification is: <strong style="color: red; font-weight: bold;">${otp}</strong></p>
                <p>Please use this OTP to complete your participation.</p>
                <p>Thank you!</p>
            `
        };

        await transporter.sendMail(mailOptions);
        res.status(200).json({ message: 'OTP sent successfully' });
    } catch (error) {
        console.error('Error sending OTP:', error);
        res.status(500).json({ error: 'Failed to send OTP' });
    }
});


// POST route for OTP verification
// POST route for OTP verification
app.post('/verify-otp', (req, res) => {
    const { email, otp: enteredOTP } = req.body;
    try {
        // Retrieve stored OTP
        const storedOTP = otpMap.get(email);

        console.log(`Verifying OTP for ${email}`);
        console.log(`Stored OTP: ${storedOTP}, Entered OTP: ${enteredOTP}`);

        if (!storedOTP) {
            return res.status(400).json({ error: 'OTP not found or expired' });
        }

        // Verify OTP
        if (storedOTP !== enteredOTP) {
            return res.status(400).json({ error: 'Invalid OTP' });
        }

        // Clear OTP from memory map after successful verification
        otpMap.delete(email);

        res.status(200).json({ message: 'OTP verified successfully' });
    } catch (error) {
        console.error('Error verifying OTP:', error);
        res.status(500).json({ error: 'Failed to verify OTP' });
    }
});

app.post('/confirmation-mail', async (req, res) => {
    const { name, phone, email, eventName, eventDate, eventTime, pdfLink } = req.body;

    try {
        // Send confirmation email
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Event Participation Confirmation',
            html: `
                <p>Dear ${name},</p>
                <p>Congratulations! You have successfully participated in the event "${eventName}" that will be held on ${eventDate} at ${eventTime}.</p>
                <p>Participant Details:</p>
                <ul>
                    <li style="color: blue;">Name: ${name}</li>
                    <li style="color: red;">Phone Number: ${phone}</li>
                    <li style="color: red;">Event Name: ${eventName}</li>
                    <li style="color: red;">Event Date: ${eventDate}</li>
                    <li style="color: red;">Event Time: ${eventTime}</li>
                </ul>
                <p>Best regards,<br><strong style="color: crimson;">SUCSS<strong></p>
            `
        };

        await transporter.sendMail(mailOptions);
        res.status(200).send('Confirmation email sent successfully.');
    } catch (error) {
        console.error('Error sending confirmation email:', error);
        res.status(500).send('Failed to send confirmation email.');
    }
});

app.post('/unsuccess-mail', async (req, res) => {
    const { name, email, reason, eventName } = req.body;

    try {
        // Send failure email
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Event Participation Unsuccessful',
            html: `
                <p>Dear ${name},</p>
                <p>We regret to inform you that you were unable to participate in the event due to the following reason:</p>
                <p style="color: black; font-weight: bold">${reason}</p>
                <p>Best regards,<br><strong style="color: crimson;">SUCSS</strong></p>
            `
        };

        await transporter.sendMail(mailOptions);
        res.status(200).send('Failure email sent successfully.');
    } catch (error) {
        console.error('Error sending failure email:', error);
        res.status(500).send('Failed to send failure email.');
    }
});



// Start server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
