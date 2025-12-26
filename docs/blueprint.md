# **App Name**: Monopoly Admin Center

## Core Features:

- Secure Authentication: Firebase Authentication with admin role verification using custom claims.
- Organization Management: CRUD interface to manage Organizations stored in Firestore.
- Real-time Scan Feed: Live table displaying new 'Scans' in real-time using Firestore snapshots.
- Business/Tile Manager: Form to manage business markers, syncing data directly to the Flutter app.
- Scan Trend Analysis: AI-powered analysis tool to identify unusual scan activities across the Monopoly board using historical scan data and predict areas for game improvements, using an LLM as a tool to suggest relevant information.
- Dark/Light Mode Toggle: A user interface element to switch between dark and light color themes.

## Style Guidelines:

- Primary color: Deep Indigo (#4B0082) to capture the luxury and strategy themes from Monopoly.
- Background color: Very dark gray (#222222) to provide a modern, sophisticated backdrop in line with a SaaS aesthetic.
- Accent color: Bright Cyan (#00FFFF) to highlight key interactive elements.
- Body and headline font: 'Inter' for a modern, neutral sans-serif aesthetic.
- Use Lucide Icons for a consistent and clean look.
- Implement a modern 'SaaS' aesthetic with a clean, organized layout, complemented by subtle 'Glassmorphism' effects for depth.
- Subtle transitions and animations to provide feedback on user interactions and data updates.