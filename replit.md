# Adaptalyfe - Replit Configuration

## Overview
Adaptalyfe is a full-stack web application designed to empower individuals with developmental disabilities. It assists users in managing daily tasks, finances, mood, and connecting with their support network. The application aims to foster independence and improve quality of life. Key capabilities include comprehensive task management, financial tracking, mood monitoring, communication tools for caregivers, meal planning, and appointment scheduling. The business vision is to provide an accessible and supportive digital ecosystem that significantly improves daily living for this community, with potential for substantial market penetration and revenue growth through a freemium model and healthcare partnerships.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### UI/UX Decisions
The application features a modern, responsive design built with React 18 and styled using Tailwind CSS with custom variables for consistent theming. Radix UI primitives ensure accessibility (ARIA compliant) and provide a foundation for reusable components. The design adopts a mobile-first approach with enhancements for desktop, incorporating skeleton loaders for loading states and optimizing touch targets for mobile accessibility. Accessibility is a core focus, including high contrast mode, large text options, and keyboard navigation. The UI includes customizable dashboards, quick actions, and adaptive themes. The application branding features the "Adaptalyfe" logo and "Grow with Guidance. Thrive with Confidence." tagline.

### Technical Implementations
The frontend utilizes React 18 with TypeScript, Wouter for routing, TanStack Query for server state management, and React Hook Form with Zod for robust form handling. Vite serves as the build tool for optimized development and production builds. The backend is built with Node.js and Express.js in TypeScript, offering RESTful API endpoints and centralized error handling. PostgreSQL is used for data persistence, managed by Drizzle ORM for type-safe operations and schema migrations. Real-time updates are achieved through query invalidation. Security is paramount, with HIPAA-compliant audit logging, data encryption, user privacy settings, and access request tracking. Features include a comprehensive notification system, AI chatbot ("AdaptAI"), gamification (achievements, points, streaks), advanced voice commands, and personalized insights.

### Feature Specifications
Adaptalyfe supports various core functionalities through integrated modules:
- **Daily Task Management**: Categorized tasks, completion tracking, point-based rewards.
- **Financial Management**: Bill tracking, budget management, income/expense tracking, secure banking integration (Plaid).
- **Mood Tracking**: Daily mood logging with notes and ratings.
- **Support Network**: Caregiver communication, contact management, and a dedicated Caregiver Dashboard for monitoring.
- **Meal Planning & Shopping**: Weekly meal plans, recipes, and grocery list management.
- **Appointment Management**: Scheduling, reminders, and tracking for medical/therapy appointments.
- **Medical Information Management**: Tracking allergies, conditions, medications (with pill appearance descriptions), and emergency contacts.
- **Academic Support**: Planner with class scheduling, assignments, study sessions, and campus navigation (Student module).
- **Independence Skills**: Visual Task Builder for step-by-step life skills tutorials, progress tracking.
- **Safety Features**: Geofencing, emergency contacts quick access, smart notifications, and caregiver permission controls for critical settings.
- **Personalization**: Customizable dashboard layouts, quick actions, UI themes, and AI-powered recommendations.
- **Data Management**: Export and backup functionality (JSON, CSV, PDF) with HIPAA compliance.
- **Monetization**: Integrated Stripe payment system with Basic, Premium, and Family tiers.

### System Design Choices
The architecture promotes modularity and reusability, with shared TypeScript schema definitions between frontend and backend. Development leverages Vite's hot module replacement for a seamless experience. Production builds are optimized, serving static frontend assets via Express. Database management includes Drizzle Kit for migrations and schema deployment. The system is designed for mobile app conversion (React Native) and PWA deployment, ensuring broad accessibility. Comprehensive demo modes with realistic sample data are available for testing and demonstration.

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
- **Plaid**: For secure banking account connections and automated payments.
- **Stripe**: For payment processing and subscription management.
- **OpenAI API**: For the AdaptAI chatbot functionality.
- **Walgreens, CVS, TruePill**: APIs for pharmacy integration (medication tracking, refill ordering).