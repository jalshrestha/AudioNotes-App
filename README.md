# Audio Notes App

A modern web application for creating and managing audio notes with speech recognition capabilities. Built with Next.js, MongoDB, and NextAuth.js.

## Features

- 🎤 Speech-to-text conversion for easy note creation
- 📝 Real-time text editing and formatting
- 🔒 Secure authentication with NextAuth.js
- 💾 Persistent storage with MongoDB
- 🌐 Offline support with local storage backup
- 🎨 Modern UI with dark/light mode support

## Prerequisites

- Node.js 18.x or later
- MongoDB Atlas account or local MongoDB instance
- npm or yarn package manager

## Getting Started

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/audio-notes-app.git
   cd audio-notes-app
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   ```
   Edit the `.env` file with your MongoDB connection string and other required variables.

4. Run the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
MONGODB_URI=your_mongodb_connection_string
MONGODB_DB=your_database_name
NEXTAUTH_SECRET=your_random_secret
```

For production, also add:
```env
NEXTAUTH_URL=https://your-production-url.com
NODE_ENV=production
```

## Deployment

### Deploying to Vercel

1. Push your code to GitHub
2. Connect your GitHub repository to Vercel
3. Add your environment variables in the Vercel dashboard
4. Deploy!

### Manual Deployment

1. Build the application:
   ```bash
   npm run build
   # or
   yarn build
   ```

2. Start the production server:
   ```bash
   npm start
   # or
   yarn start
   ```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support, please open an issue in the GitHub repository.
