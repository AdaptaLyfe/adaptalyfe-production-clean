# Adaptalyfe - Replit Configuration

## Overview
Adaptalyfe is a full-stack web application designed to empower individuals with developmental disabilities by assisting them in managing daily tasks, finances, mood, and connecting with their support network. The application aims to foster independence and improve quality of life through comprehensive task management, financial tracking, mood monitoring, communication tools for caregivers, meal planning, and appointment scheduling. The business vision is to provide an accessible and supportive digital ecosystem that significantly improves daily living for this community, with potential for substantial market penetration and revenue growth through a freemium model and healthcare partnerships.

## Recent Changes (September 3, 2025)
**Render Build Issues Completely Resolved**: Fixed all import path issues causing Render deployment failures by converting relative imports (`../lib/auth`) to proper alias imports (`@/lib/auth`) and inlining API configuration. Build now succeeds locally and ready for successful Render deployment. All features preserved including sleep tracking with styled blue/green buttons, proper landing page with cyan-teal-blue gradient, payment system, dashboard functionality, and authentication.

**Firebase App Crash Resolution & Full Deployment**: Completely fixed Firebase app crashing issue by resolving missing import dependencies (config.ts, auth.ts, ReactErrorBoundary), ensuring proper build process, and successfully deploying updated application. Implemented reliable hostname-based environment detection to route Firebase frontend API calls to working Replit backend. Firebase app now fully functional at https://adaptalyfe-5a1d3.web.app with all features including sleep tracking with styled blue/green buttons working seamlessly.

## Previous Changes (August 29, 2025)
**Sleep Tracking Database Fix & UI Enhancement**: Successfully resolved all sleep session saving issues by converting TIME database columns to TIMESTAMP format and fixing data conversion logic. Added attractive styled boxes around sleep tracking buttons - blue boxes for "Log Sleep" actions and green box for "Save Sleep Session" with hover effects and shadows. Sleep tracking is now fully operational with proper form navigation, accurate time field saving, and enhanced visual appeal.

**Feedback Collection System Removal**: Successfully removed all feedback collection components from the application since testing phase is complete. Deleted feedback widget component (`feedback-widget.tsx`), removed feedback API endpoint (`/api/feedback`), and cleaned up all UI references from App.tsx. Fixed missing dependencies including ReactErrorBoundary component and AuthUtils library. Resolved database schema issues by creating missing notifications table. Enhanced error blocking scripts with more aggressive modal hiding. The application is now fully restored and ready for final production deployment without any testing artifacts.
**Enhanced AI Chatbot System**: Significantly improved AdaptAI with expanded system prompt, comprehensive fallback knowledge base covering 8+ topic areas, increased quick suggestions from 4 to 12 options, and enhanced visibility with proper white backgrounds and improved contrast for better readability.
**Stripe Elements Loading Issue Resolution**: Successfully resolved persistent Stripe.js CDN loading failures by implementing a comprehensive alternative payment system. Created `/direct-payment` page with complete credit card form that bypasses Stripe Elements entirely while maintaining backend Stripe API integration. When Stripe.js fails to load, users now get "Use Alternative Payment Form" and "Demo Payment" options, ensuring the subscription flow always works regardless of external CDN issues.
**Demo Mode Interface Cleanup**: Completely removed all demo mode UI elements from the interface including "Demo Mode", "Start Tour", "Reorder Tiles", and "Customize" buttons. Enhanced "View Plans" button styling with improved font-weight, shadow, and border for better readability. Interface is now cleaner and more professional without demo clutter.

**Complete Payment Enforcement System**: Successfully implemented mandatory payment system with comprehensive feature blocking. Extended payment requirements to ALL core features including daily tasks, financial tracking, mood tracking, medical information, caregiver communication, and calendar. Users must now pay after 7-day free trial to access ANY functionality (admin accounts bypass all restrictions).

**User Authentication Display Fix**: Fixed the welcome banner to display the actual logged-in user's name instead of hardcoded "Demo User". Updated WelcomeSection component to fetch real user data from the API and added proper loading states for better user experience.

**Mobile App Development Server Optimization**: Enhanced dual-server architecture with main web app on custom domain (app.adaptalyfeapp.com) and dedicated Expo development server on port 19000 for mobile testing. Fixed QR code generation to use correct Expo server URL format for seamless mobile app testing via Expo Go.

**Features Page Navigation Implementation**: Successfully created and integrated a dedicated Features page accessible through the main navigation menu. The page showcases Voice Commands, Smart Notifications, Premium Analytics, and other advanced capabilities with category filtering and detailed feature descriptions. Features button is prominently displayed with blue highlighting in the navigation menu's special actions section alongside Settings. Fixed routing configuration issues to ensure proper page loading and accessibility.

**Comprehensive Toggle Switch Visual Overhaul**: Dramatically enhanced all settings page toggle switches with vibrant styling for maximum visibility and accessibility. All switches are now 25% larger with colored backgrounds, glowing shadows, and "ACTIVE" badges when enabled. Emergency section switches use white containers with green accents to prevent blending with the red background. Clear visual distinction between enabled (bright colors + shadows), disabled (gray + muted), and locked (gray containers) states ensures users can easily identify setting status at a glance.

**Comprehensive Caregiver Lock-Down System Completed**: Enhanced the Caregiver Dashboard Security Controls with dual-tab functionality. Added "User Lock Controls" for caregivers to directly lock critical settings from vulnerable users (location sharing, emergency contacts, medication reminders, financial monitoring, safety alerts, appointment notifications) and "Caregiver Permissions" for managing inter-caregiver access rights. This provides essential safety protection by preventing accidental setting changes while maintaining appropriate oversight controls.

**Simplified Caregiver Invitation System**: Replaced complex QR code system with streamlined text/email sharing approach. Users can now easily share caregiver invitations via SMS or email with pre-filled messages containing invitation codes and login links. The login page automatically handles invitation codes from shared links, making caregiver onboarding much more reliable and user-friendly across all devices.

**Mobile App Deep Linking Configuration**: Added deep link support (`adaptalyfe://`) to solve browser white page issues. When caregivers have the mobile app installed, invitation links open directly in the app instead of the browser, providing a seamless experience. Web fallback links are included for users without the app installed.

## User Preferences
Preferred communication style: Simple, everyday language.
Visual Design Priority: Extremely particular about design aesthetics and visual clarity, especially for toggle switches and interactive elements. Requires vibrant, easily distinguishable on/off states with strong visual feedback for active/inactive states.

## System Architecture

### UI/UX Decisions
The application features a modern, responsive design built with React 18 and styled using Tailwind CSS with custom variables for consistent theming. Radix UI primitives ensure accessibility (ARIA compliant) and provide a foundation for reusable components. The design adopts a mobile-first approach with enhancements for desktop, incorporating skeleton loaders for loading states and optimizing touch targets for mobile accessibility. Accessibility is a core focus, including high contrast mode, large text options, and keyboard navigation. The UI includes customizable dashboards, quick actions, and adaptive themes. The application branding features the "Adaptalyfe" logo and "Grow with Guidance. Thrive with Confidence." tagline.

### Technical Implementations
The frontend utilizes React 18 with TypeScript, Wouter for routing, TanStack Query for server state management, and React Hook Form with Zod for robust form handling. Vite serves as the build tool for optimized development and production builds. The backend is built with Node.js and Express.js in TypeScript, offering RESTful API endpoints and centralized error handling. PostgreSQL is used for data persistence, managed by Drizzle ORM for type-safe operations and schema migrations. Real-time updates are achieved through query invalidation. Security is paramount, with HIPAA-compliant audit logging, data encryption, user privacy settings, and access request tracking. Features include a comprehensive notification system, AI chatbot ("AdaptAI"), gamification (achievements, points, streaks), advanced voice commands, and personalized insights. The financial system uses a simplified payment link approach, storing bill payment website URLs and account numbers, allowing users to click "Pay Bill" buttons that open secure external payment websites. It also includes bank quick access functionality where users can store bank website URLs for easy balance checking. This design eliminates API costs and complexities while providing maximum safety by directing users to official company payment portals and bank websites.

### Feature Specifications
Adaptalyfe supports various core functionalities through integrated modules:
- **Daily Task Management**: Categorized tasks, completion tracking, point-based rewards, comprehensive task editing.
- **Financial Management**: Bill tracking with payment link storage, bank quick access links for balance checking, budget management, income/expense tracking.
- **Mood Tracking**: Daily mood logging with notes and ratings.
- **Support Network**: Caregiver communication, contact management, dedicated Caregiver Dashboard, and simple text/email caregiver invitations.
- **Meal Planning & Shopping**: Weekly meal plans, recipes, and grocery list management.
- **Appointment Management**: Scheduling, reminders, and tracking for medical/therapy appointments.
- **Medical Information Management**: Tracking allergies, conditions, medications, and emergency contacts.
- **Pharmacy Management**: Comprehensive pharmacy integration allowing users to link existing major pharmacies or create custom pharmacies with complete details.
- **Academic Support**: Planner with class scheduling, assignments, study sessions, and campus navigation (Student module).
- **Independence Skills**: Visual Task Builder for step-by-step life skills tutorials, progress tracking.
- **Safety Features**: Geofencing, emergency contacts quick access, smart notifications, and caregiver permission controls.
- **Personalization**: Fully customizable dashboard with drag-and-drop tile reordering, reorderable quick action buttons, UI themes, and AI-powered recommendations.
- **Data Management**: Export and backup functionality (JSON, CSV, PDF) with HIPAA compliance.
- **Monetization**: Integrated Stripe payment system with Basic, Premium, and Family tiers, currently configured with a 7-day free trial.

### System Design Choices
The architecture promotes modularity and reusability, with shared TypeScript schema definitions between frontend and backend. Development leverages Vite's hot module replacement. Production builds are optimized, serving static frontend assets via Express. Database management includes Drizzle Kit for migrations and schema deployment. The system is designed for mobile app conversion (React Native) and PWA deployment. Comprehensive demo modes with realistic sample data are available.

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
- **Stripe**: For payment processing and subscription management.
- **OpenAI API**: For the AdaptAI chatbot functionality.
- **Walgreens, CVS, TruePill**: APIs for pharmacy integration (medication tracking, refill ordering).