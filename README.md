# Audio Notes App

## Overview

The Audio Notes App is a web application designed for users to easily record audio notes and transcribe them into text. Built with Next.js and TypeScript, this application leverages the Web Speech API for real-time speech recognition and Supabase for data storage.

## Features

- **Audio Recording**: Users can record their voice notes directly from the browser.
- **Real-time Transcription**: As users speak, their words are transcribed into text in real-time.
- **Save Notes**: Users can save their transcribed notes to a database for later retrieval.
- **User-friendly Interface**: The application features a clean and intuitive UI for easy navigation and use.

## Technologies Used

- **Next.js**: A React framework for building server-side rendered applications.
- **TypeScript**: A superset of JavaScript that adds static types, enhancing code quality and maintainability.
- **Web Speech API**: A browser API that enables speech recognition and synthesis.
- **Supabase**: An open-source Firebase alternative that provides a backend as a service, including database storage.

## Getting Started

### Prerequisites

- Node.js (version 14 or higher)
- npm (Node package manager)

### Installation

1. Clone the repository:
   ```bash
   git clone git@github.com:jalshrestha/AudioNotes-App.git
   ```

2. Navigate to the project directory:
   ```bash
   cd AudioNotes-App
   ```

3. Install the dependencies:
   ```bash
   npm install
   ```

4. Set up your Supabase project and create a table for storing notes. Update the Supabase configuration in `src/utils/supabase.ts` with your project URL and anon key.

5. Run the development server:
   ```bash
   npm run dev
   ```

6. Open your browser and navigate to `http://localhost:3000` to use the application.

## Usage

- Click the "Start Recording" button to begin recording your voice.
- Speak clearly, and your words will appear in the text area in real-time.
- Click the "Stop Listening" button to stop recording.
- Once you're satisfied with your notes, click the "Save Note" button to store them in the database.

## Contributing

Contributions are welcome! If you have suggestions for improvements or new features, feel free to open an issue or submit a pull request.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
