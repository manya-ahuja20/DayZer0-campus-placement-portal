// express server entry point
require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/profile', require('./routes/profile.routes'));
app.use('/api/drives', require('./routes/drive.routes'));
app.use('/api/eligibility', require('./routes/eligibility.routes'));
app.use('/api/applications', require('./routes/application.routes'));
app.use('/api/interviews', require('./routes/interview.routes'));
app.use('/api/notifications', require('./routes/notification.routes'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));