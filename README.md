#TaskShifts Backend
TaskShifts is a full-featured service marketplace platform connecting clients with verified providers. This backend handles user authentication, KYC onboarding, service management, reviews, search, and admin moderation.
Built with Node.js, TypeScript, Express, and MongoDB — production-ready, type-safe, and scalable.

##Features

Authentication: Email/password + Google OAuth, JWT access/refresh tokens (HTTP-only cookies), email verification, password reset
KYC Onboarding: 3-step process with resume logic, editable steps, Cloudinary file uploads (profile, documents, portfolio)
Provider Management: Add/update/delete services, availability toggle, account visibility (public/private)
Reviews System: Clients can review providers (1 per pair), public read, admin delete
Search & Discovery: Advanced MongoDB aggregation with text search, filters (location, price, rating), geospatial support
Settings: Notification preferences, localization (language, currency, theme)
Admin Tools: KYC approval/rejection, audit logging, email notifications (Resend)
Deployment: Ready for Render.com (with tsup build, env vars)

##Tech Stack

Backend: Node.js, Express, TypeScript
Database: MongoDB Atlas (Mongoose with discriminators for Client/Provider)
File Storage: Cloudinary
Validation: class-validator + DTOs
Auth: JWT, bcrypt, Nodemailer/Resend for emails
Build: tsup
Deployment: Render.com

##Prerequisites

Node.js v20+
MongoDB Atlas cluster
Cloudinary account
Gmail App Password (for SMTP) or Resend API key

###Setup

Clone the repoBashgit clone https://github.com/yourusername/TaskShifts-Backend.git
cd TaskShifts-Backend
Install dependenciesBashnpm install
Create .env file (copy from .env.example if available)textMONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/dbname?retryWrites=true&w=majority
JWT_SECRET=your_very_long_secret
REFRESH_SECRET=another_long_secret
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
RESEND_API_KEY=re_your_key
ADMIN_EMAIL=admin@taskshifts.com
ADMIN_PASSWORD=YourStrongPass2025!
FRONTEND_URL=http://localhost:3000
NODE_ENV=development

####Run locally
Bash
npm run dev
Server starts at http://localhost:3000

####Build for production
Bash
npm run build
npm start

###API Endpoints Overview
####Auth

POST /api/users/register — Register (client/provider)
POST /api/users/login — Login (returns accessToken + refresh cookie)
POST /api/auth/refresh-token — Refresh access token
POST /api/users/verify-email — Verify email

####KYC

POST /api/kyc/step1 — Personal info + profile picture
POST /api/kyc/step2 — Documents (business, address, identity)
POST /api/kyc/step3 — Services + portfolio
GET /api/kyc/step1/data — Get Step 1 data for edit
PATCH /api/kyc/step1/update — Update Step 1 (from any step)

####Provider Settings

PATCH /api/provider/availability — Toggle/set availability
PATCH /api/provider/settings/visibility — Public/private
PATCH /api/provider/settings/notifications — Email/app/sound/etc.
PATCH /api/provider/settings/localization — Language/currency/theme
GET /api/provider/settings — Get current settings

####Services Management

POST /api/provider/services — Add new services
GET /api/provider/services — View own services
DELETE /api/provider/services/:serviceId — Delete service
PATCH /api/provider/services/:serviceId — Update service

####Reviews

POST /api/reviews — Create review (client only)
GET /api/reviews/provider/:providerId — Get provider reviews (public)
DELETE /api/reviews/:reviewId — Delete review (admin only)

####Admin

GET /api/admin/kyc/pending — List pending KYC
GET /api/admin/kyc/:providerId/details — View full KYC details
PATCH /api/admin/kyc/:providerId/approve — Approve KYC/step
PATCH /api/admin/kyc/:providerId/reject — Reject KYC/step

####Search

GET /api/search/providers?search=plumber&location=Lagos — Search with filters

####Health

GET /health — Check if API is running

###Deployment (Render.com)

Push to GitHub
Create Web Service on Render
Build Command: npm ci && npm run build
Start Command: node dist/app.js

Add all .env vars to Render Environment
Deploy

###Testing

Use Postman documentation: [Click here to view](https://documenter.getpostman.com/view/47095943/2sB3dQup9y)
Default admin: successsteve84@gmail.com / Adminpassword2025

###Developers
Stephen Adah
Daniel Oladapo
