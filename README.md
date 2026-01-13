# ⏰ Werkuren Logger - Professional Work Hours Tracker

A modern, fully-featured work hours logging application built with React, TypeScript, Vite, and Tailwind CSS.

## ✨ Features

### Core Functionality
- 📊 **Smart Timer**: Track work and break time in real-time
- 📅 **Interactive Calendar**: View work hours by date at a glance
- 📋 **Manual Logging**: Add, edit, and delete work entries
- 📈 **Automatic Overwork Calculation**: Track overtime automatically
- 💾 **Data Persistence**: All data stored locally with localStorage
- 📥 **Excel Export**: Download work logs as Excel files
- 🌍 **Dutch Localization**: Complete Dutch language interface

### Modern Design System
- 🎨 **Professional UI**: Clean, modern design with consistent styling
- 📱 **Mobile-First Responsive**: Works perfectly on mobile, tablet, and desktop
- 🎯 **Accessibility**: WCAG compliant with proper labels, focus states, and keyboard navigation
- ⚡ **Smooth Animations**: Subtle transitions and animations throughout
- 🌈 **Consistent Colors**: Professional blue/slate color palette

### Component Architecture
- **Reusable Components**: Button, Card, Input, PageLayout, Alert components
- **Type-Safe**: Full TypeScript support for all components
- **Focus States**: Proper keyboard navigation and focus indicators
- **Loading States**: Visual feedback for async operations
- **Error Handling**: Clear error messages and validation feedback

## 🏗️ Architecture

```
src/
├── components/
│   ├── ui/                 # Reusable UI components
│   │   ├── Button.tsx      # Flexible button component
│   │   ├── Card.tsx        # Container component
│   │   ├── Input.tsx       # Form input with labels
│   │   ├── PageLayout.tsx  # Main layout wrapper
│   │   ├── Alert.tsx       # Notification component
│   │   └── index.ts        # Exports
│   ├── Dashboard.tsx       # Main app dashboard
│   ├── Login.tsx          # Authentication page
│   └── AuthContext.tsx    # Auth state management
├── index.css              # Global styles & animations
└── main.tsx              # App entry point
```

## 🚀 Quick Start

### Installation
```bash
npm install
```

### Development
```bash
npm run dev
# Access at http://localhost:5174/
```

### Build
```bash
npm run build
```

### Preview Production Build
```bash
npm run preview
```

## 🎨 Design System

### Colors
- **Primary**: Blue (#3b82f6)
- **Secondary**: Slate (#475569)
- **Success**: Green (#16a34a)
- **Danger**: Red (#dc2626)
- **Background**: Gradient slate-50 to indigo-50

### Typography
- **Headings**: Bold, clear visual hierarchy
- **Body**: Readable sans-serif with proper contrast
- **Labels**: Small, semibold for form clarity

### Spacing
- **Consistent**: 4px-based spacing scale
- **Responsive**: Adapts to screen size
- **Padding**: Cards and containers with proper whitespace

### Buttons
- **Variants**: primary, secondary, success, danger, outline, ghost
- **Sizes**: sm, md, lg for different contexts
- **States**: hover, focus, disabled, loading
- **Icons**: Built-in emoji/icon support

## 📱 Responsive Breakpoints

- **Mobile**: < 640px (single column layout)
- **Tablet**: 640px - 1024px (2 column layout)
- **Desktop**: > 1024px (full width layouts)

All components adapt seamlessly across devices.

## 🔐 Authentication

Simple username/password authentication with localStorage persistence.

**Demo Credentials**: Use any username/password (stored in browser)

## 💾 Data Storage

All work hours are stored in browser's localStorage under `logs_[username]` key.

## 🌐 Deployment

Deployed on Vercel with proper routing configuration.

### Environment
- **Frontend Framework**: React 19
- **Build Tool**: Vite 7
- **Styling**: Tailwind CSS 4
- **Language**: TypeScript
- **Router**: React Router v7
- **Date Utilities**: date-fns
- **Export**: XLSX
- **Calendar**: react-calendar

## 📝 Recent Updates

### Complete UI Refactor (v2.0)
- New reusable component system
- Professional design system implementation
- Mobile-first responsive design
- Enhanced accessibility features
- Smooth animations and transitions
- Consistent spacing and typography
- Visual feedback for all interactions

## 🔮 Future Enhancements

- Cloud data synchronization
- Team management and sharing
- Advanced analytics and reporting
- Dark mode support
- PWA offline functionality
- Browser notifications for timer
- Customizable work hour targets
- Export to PDF and other formats

## 📄 License

MIT License - Feel free to use this template for your own projects.

## 🤝 Contributing

Contributions welcome! Feel free to submit issues and enhancement requests.

---

**Made with ❤️ for efficient work hour tracking**
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
