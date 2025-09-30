# Adaptalyfe - Replit Configuration

## Overview
Adaptalyfe is a full-stack web application designed to empower individuals with developmental disabilities by assisting them in managing daily tasks, finances, mood, and connecting with their support network. The application aims to foster independence and improve quality of life through comprehensive task management, financial tracking, mood monitoring, communication tools for caregivers, meal planning, and appointment scheduling. The business vision is to provide an accessible and supportive digital ecosystem that significantly improves daily living for this community, with potential for substantial market penetration and revenue growth through a freemium model and healthcare partnerships.

## Recent Changes (September 30, 2025)
- **Complete Quick Actions Rewrite**: Completely rebuilt Quick Actions functionality from scratch using dnd-kit library (replacing @hello-pangea/dnd) to fix persistent drag-and-drop issues where cards were disappearing
- **New Module Architecture**: Created modular `client/src/components/quick-actions/` folder with separate components for cards, sorting, customization, and data constants
- **DragOverlay Implementation**: Uses dnd-kit's DragOverlay to keep cards visible during drag operations, preventing the disappearing card bug
- **Responsive Flexbox Layout**: Implemented responsive flexbox with calculated widths (50% mobile, 33% tablet, 16.6% desktop) for stable drag-and-drop
- **LocalStorage Persistence**: Both card order and visibility settings now persist across sessions
- **Fixed Customize Dialog**: Resolved double-click issue in customize dialog by adding event propagation control
- **Firebase Deployment**: Updated backend URL to use Replit development domain (f0feebb6-5db0-4265-92fd-0ed04d7aec9a-00-tpbqabot0m1.spock.replit.dev) for stable cross-origin requests

## User Preferences
Preferred communication style: Simple, everyday language.
Visual Design Priority: Extremely particular about design aesthetics and visual clarity, especially for toggle switches and interactive elements. Requires vibrant, easily distinguishable on/off states with strong visual feedback for active/inactive states.

## System Architecture

### UI/UX Decisions
The application features a modern, responsive design built with React 18 and styled using Tailwind CSS with custom variables for consistent theming. Radix UI primitives ensure accessibility (ARIA compliant) and provide a foundation for reusable components. The design adopts a mobile-first approach with enhancements for desktop, incorporating skeleton loaders for loading states and optimizing touch targets for mobile accessibility. Accessibility is a core focus, including high contrast mode, large text options, and keyboard navigation. The UI includes customizable dashboards, quick actions, and adaptive themes. The application branding features the "Adaptalyfe" logo and "Grow with Guidance. Thrive with Confidence." tagline. Specific attention is given to visual elements like toggle switches, ensuring they are 25% larger with colored backgrounds, glowing shadows, and "ACTIVE" badges when enabled, providing clear visual distinction for enabled, disabled, and locked states.

### Technical Implementations
The frontend utilizes React 18 with TypeScript, Wouter for routing, TanStack Query for server state management, and React Hook Form with Zod for robust form handling. Vite serves as the build tool for optimized development and production builds. The backend is built with Node.js and Express.js in TypeScript, offering RESTful API endpoints and centralized error handling. PostgreSQL is used for data persistence, managed by Drizzle ORM for type-safe operations and schema migrations. Real-time updates are achieved through query invalidation. Security is paramount, with HIPAA-compliant audit logging, data encryption, user privacy settings, and access request tracking. Features include a comprehensive notification system, an enhanced AI chatbot ("AdaptAI") with expanded prompts and quick suggestions, gamification, advanced voice commands, and personalized insights. The financial system uses a simplified payment link approach, storing bill payment website URLs and account numbers, allowing users to click "Pay Bill" buttons that open secure external payment websites. It also includes bank quick access functionality where users can store bank website URLs for easy balance checking, designed to minimize API costs and maximize security by directing users to official portals. A comprehensive payment enforcement system requires users to subscribe after a 30-day free trial to access core features (extended for testing purposes), with admin accounts bypassing restrictions. A dedicated production server (`server/production.ts`) eliminates Vite dependencies for robust deployment.

### Feature Specifications
Adaptalyfe supports various core functionalities through integrated modules:
- **Daily Task Management**: Categorized tasks, completion tracking, point-based rewards.
- **Financial Management**: Bill tracking with payment link storage, bank quick access links, budget management, income/expense tracking.
- **Mood Tracking**: Daily mood logging.
- **Support Network**: Caregiver communication, contact management, dedicated Caregiver Dashboard with dual-tab "User Lock Controls" and "Caregiver Permissions," and streamlined text/email caregiver invitations with deep linking for mobile apps.
- **Meal Planning & Shopping**: Weekly meal plans, recipes, and grocery list management.
- **Appointment Management**: Scheduling, reminders, and tracking.
- **Medical Information Management**: Tracking allergies, conditions, medications, and emergency contacts.
- **Pharmacy Management**: Integration with major pharmacies or custom pharmacy details.
- **Academic Support**: Planner with class scheduling, assignments, study sessions, and campus navigation.
- **Independence Skills**: Visual Task Builder for step-by-step life skills tutorials.
- **Safety Features**: Geofencing, emergency contacts quick access, smart notifications, and caregiver permission controls.
- **Personalization**: Fully customizable dashboard with drag-and-drop tile reordering, reorderable quick action buttons, UI themes, and AI-powered recommendations.
- **Data Management**: Export and backup functionality (JSON, CSV, PDF) with HIPAA compliance.
- **Monetization**: Integrated Stripe payment system with Basic, Premium, and Family tiers, configured with a 7-day free trial.
- **Sleep Tracking**: Fully operational with accurate time saving and enhanced visual appeal for UI elements.

### System Design Choices
The architecture promotes modularity and reusability, with shared TypeScript schema definitions between frontend and backend. Development leverages Vite's hot module replacement. Production builds are optimized, serving static frontend assets via Express. Database management includes Drizzle Kit for migrations and schema deployment. The system is designed for mobile app conversion (React Native) and PWA deployment. Comprehensive demo modes with realistic sample data are available. A dual-server architecture supports a main web app and a dedicated Expo development server for mobile testing.

## External Dependencies

### Frontend Dependencies
- **React**: Core UI library
- **TypeScript**: For type safety
- **Tailwind CSS**: For styling
- **Radix UI**: UI component primitives
- **Wouter**: Client-side routing
- **TanStack Query**: Server state management
- **React Hook Form**: Form handling
- **Zod**: Schema validation
- **date-fns**: Date manipulation
- **Lucide React**: Icons
- **Embla Carousel**: Carousel components

### Backend Dependencies
- **Node.js**: Runtime environment
- **Express.js**: Web framework
- **PostgreSQL**: Database
- **Drizzle ORM**: ORM for database interactions
- **@neondatabase/serverless**: PostgreSQL connectivity
- **Drizzle Kit**: Database schema management
- **connect-pg-simple**: PostgreSQL session storage
- **tsx**: TypeScript execution for development
- **esbuild**: Production bundling

### Third-Party Integrations
- **Stripe**: For payment processing and subscription management (includes alternative payment flow if Stripe.js fails).
- **OpenAI API**: For the AdaptAI chatbot functionality.
- **Walgreens, CVS, TruePill**: APIs for pharmacy integration.