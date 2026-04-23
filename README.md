# Arham Connect

Arham Connect is a small realtime chat application built with React, Vite, Capacitor, and Supabase for the Arham Fintech Frontend Developer assessment.

The app currently includes:

- Login and signup using Supabase Auth
- A chat list screen that shows the other participant and the latest message
- A chat screen with left/right message bubbles
- Realtime message updates using Supabase Realtime
- Capacitor project files for Android builds

## Tech Stack

- React 19
- Vite 8
- React Router
- Supabase Auth, Database, and Realtime
- Capacitor

## Screens

### 1. Auth Screen

- Supports both `Login` and `Sign Up`
- Shows validation and Supabase auth errors
- Creates a profile row on signup when the `profiles` table exists

### 2. Chat List Screen

- Loads conversations for the logged-in user from `conversation_participants`
- Shows the other participant's name
- Shows the latest message and timestamp
- Refreshes when new messages arrive
- Includes logout

### 3. Chat Screen

- Loads all messages for a conversation
- Shows sent messages on the right and received messages on the left
- Sends messages to Supabase
- Appends new messages in realtime
- Falls back gracefully if profile data is missing

## Supabase Setup

Create a Supabase project and add the following tables.

### Required Tables

#### `conversations`

- `id`
- `created_at`

#### `conversation_participants`

- `conversation_id`
- `user_id`

#### `messages`

- `id`
- `conversation_id`
- `sender_id`
- `content`
- `created_at`

### Recommended Table

The current UI shows usernames or full names when a `profiles` table is available.

#### `profiles`

- `id`
- `full_name`
- `name`
- `username`
- `email`

## Realtime

Enable Supabase Realtime for the `messages` table.

If Row Level Security is enabled, make sure your policies allow:

- authenticated users to read their conversations
- authenticated users to insert messages
- authenticated users to read participant/profile data used by the UI

For this assessment, simple permissive policies are fine if the goal is to get the app working end-to-end.

## Environment Variables

Create a `.env` file in the project root.

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

This project also supports:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

That compatibility was kept so the app can still run with the existing local environment naming.

## Local Development

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Create a production build:

```bash
npm run build
```

Preview the production build locally:

```bash
npm run preview
```

## Android Build

Build the web app first:

```bash
npm run build
```

Sync the Capacitor Android project:

```bash
npx cap sync android
```

Open Android Studio:

```bash
npx cap open android
```

Then generate the APK from Android Studio.

## Project Structure

```text
src/
  components/
    Login.jsx
    ChatList.jsx
    Chat.jsx
  utils/
    chat.js
  supabaseClient.js
  App.jsx
```

## Submission Notes

This repository now includes:

- app source code
- `.env.example`
- README setup instructions
- Capacitor Android project files

Assessment items still to provide separately:

- public GitHub repo link
- APK file

## Notes

- If participant names show as shortened IDs, the `profiles` table is missing rows for those users.
- If new messages do not appear in realtime, check that Realtime is enabled on `messages` and that policies are not blocking reads.
- If signup works but profile creation fails, verify that the `profiles` table exists and allows inserts/upserts.
