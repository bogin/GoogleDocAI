<template>
  <div class="app">
    <!-- Top Navigation Bar -->
    <nav class="navbar">
      <div class="nav-brand">
        <img
          src="https://cdn.prod.website-files.com/66b34f2ad59081546d14c723/66b4795caff3f505c5c51c6c_Unframe%20Logo%20-%20Refined%20Palette%201.svg"
          alt="Logo"
          class="logo"
        />
      </div>

      <div class="nav-links">
        <a
          href="http://localhost:3000/auth/google"
          target="_blank"
          class="nav-link auth-link"
        >
          <i class="nav-icon">🔐</i>
          <span>Connect Drive</span>
        </a>

        <router-link
          :to="{ name: 'home' }"
          class="nav-link"
          active-class="active"
        >
          <i class="nav-icon">🏠</i>
          <span>Home</span>
        </router-link>

        <router-link
          :to="{ name: 'analytics' }"
          class="nav-link"
          active-class="active"
        >
          <i class="nav-icon">📊</i>
          <span>Analytics</span>
        </router-link>

        <router-link
          :to="{ name: 'files' }"
          class="nav-link"
          active-class="active"
        >
          <i class="nav-icon">📁</i>
          <span>Files</span>
        </router-link>

        <router-link
          :to="{ name: 'settings' }"
          class="nav-link"
          active-class="active"
        >
          <i class="nav-icon">⚙️</i>
          <span>Settings</span>
        </router-link>
      </div>
    </nav>

    <!-- Main Content Area -->
    <main class="main-content">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>

    <!-- Footer -->
    <footer class="footer">
      <p>© 2024 Unframe. All rights reserved.</p>
    </footer>
  </div>
</template>

<style lang="scss">
// Reset and base styles
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  line-height: 1.6;
  color: #2c3e50;
  background: #f5f7fa;
}

// App container
.app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

// Navbar styles
.navbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 2rem;
  background: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  position: sticky;
  top: 0;
  z-index: 1000;

  .nav-brand {
    display: flex;
    align-items: center;
    gap: 0.75rem;

    .logo {
      height: 32px;
      width: auto;
    }

    .brand-name {
      font-size: 1.25rem;
      font-weight: 600;
      color: #1a73e8;
    }
  }

  .nav-links {
    display: flex;
    gap: 1rem;
    margin: 0 2rem;

    .nav-link {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      text-decoration: none;
      color: #64748b;
      border-radius: 8px;
      transition: all 0.2s ease;

      .nav-icon {
        font-size: 1.25rem;
      }

      &:hover {
        background: #f8fafc;
        color: #1a73e8;
      }

      &.active {
        background: #e8f0fe;
        color: #1a73e8;
        font-weight: 500;
      }

      &.auth-link {
        background: #1a73e8;
        color: white;

        &:hover {
          background: #1557b0;
          color: white;
        }
      }
    }
  }

  .nav-right {
    display: flex;
    align-items: center;
    gap: 1rem;

    .theme-toggle {
      background: none;
      border: none;
      font-size: 1.25rem;
      cursor: pointer;
      padding: 0.5rem;
      border-radius: 50%;
      transition: background 0.2s;

      &:hover {
        background: #f8fafc;
      }
    }

    .avatar {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      cursor: pointer;
      transition: transform 0.2s;

      &:hover {
        transform: scale(1.05);
      }
    }
  }
}

// Main content area
.main-content {
  flex: 1;
  padding: 2rem;
  margin: 0 auto;
  width: 100%;
}

// Footer
.footer {
  padding: 1.5rem;
  text-align: center;
  background: white;
  color: #64748b;
  font-size: 0.875rem;
  border-top: 1px solid #e2e8f0;
}

// Transition animations
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

// Responsive design
@media (max-width: 768px) {
  .navbar {
    padding: 0.75rem 1rem;

    .nav-brand .brand-name {
      display: none;
    }

    .nav-links {
      margin: 0 0.5rem;

      .nav-link span {
        display: none;
      }
    }
  }

  .main-content {
    padding: 1rem;
  }
}

// Custom scrollbar
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: #f1f1f1;
}

::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>
