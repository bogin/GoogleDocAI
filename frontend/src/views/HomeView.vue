<template>
  <div class="home">
    <div class="hero">
      <h1>Home Assignment</h1>
      <p class="subtitle">
        A comprehensive application integrating Google Drive with AI
        capabilities
      </p>
    </div>

    <div class="assignment-content">
      <section class="feature-section">
        <h2>🔗 Core Integration</h2>
        <div class="feature-card">
          <h3>Google Drive Integration</h3>
          <ul>
            <li>Connect via OAuth authentication</li>
            <li>Fetch complete file metadata</li>
            <li>Support for expandable field selection</li>
          </ul>
        </div>
      </section>

      <section class="feature-section">
        <h2>📂 Data Management</h2>
        <div class="feature-grid">
          <div class="feature-card">
            <h3>File Operations</h3>
            <ul>
              <li>View file details</li>
              <li>Delete files</li>
              <li>Edit file information</li>
              <li>Batch processing support</li>
            </ul>
          </div>
          <div class="feature-card">
            <h3>Smart Fetching</h3>
            <ul>
              <li>Pagination support</li>
              <li>Modified date filtering</li>
              <li>Efficient data syncing</li>
            </ul>
          </div>
        </div>
      </section>

      <section class="feature-section">
        <h2>🤖 AI Capabilities</h2>
        <div class="feature-card">
          <h3>Smart File Analysis</h3>
          <div class="ai-questions">
            <p>Example Questions:</p>
            <ul>
              <li>"Who owns the most files?"</li>
              <li>"Which file was modified most recently?"</li>
              <li>"What is the average number of files per owner?"</li>
              <li>"Which file is the largest?"</li>
              <li>"Show the distribution of files by modified date"</li>
            </ul>
          </div>
        </div>
      </section>

      <section class="feature-section">
        <h2>⚙️ Technical Specifications</h2>
        <div class="feature-grid">
          <div class="feature-card">
            <h3>Core Requirements</h3>
            <ul>
              <li>Node.js backend</li>
              <li>Vue.js frontend</li>
              <li>Minimal third-party dependencies</li>
              <li>Complete documentation</li>
            </ul>
          </div>
          <div class="feature-card">
            <h3>Best Practices</h3>
            <ul>
              <li>Robust error handling</li>
              <li>Performance optimization</li>
              <li>Secure data handling</li>
              <li>Clean code architecture</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.home {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  color: #2c3e50;

  .hero {
    text-align: center;
    margin-bottom: 4rem;
    padding: 3rem 0;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border-radius: 12px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);

    h1 {
      font-size: 2.5rem;
      margin-bottom: 1rem;
    }

    .subtitle {
      font-size: 1.2rem;
      opacity: 0.9;
    }
  }

  .assignment-content {
    display: flex;
    flex-direction: column;
    gap: 3rem;
  }

  .feature-section {
    h2 {
      font-size: 1.8rem;
      margin-bottom: 1.5rem;
      color: #2c3e50;
      border-bottom: 2px solid #e0e0e0;
      padding-bottom: 0.5rem;
    }
  }

  .feature-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 1.5rem;
  }

  .feature-card {
    background: white;
    padding: 1.5rem;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    border: 1px solid #e0e0e0;
    transition: transform 0.2s, box-shadow 0.2s;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    }

    h3 {
      color: #1a73e8;
      margin-bottom: 1rem;
      font-size: 1.3rem;
    }

    ul {
      list-style-type: none;
      padding: 0;

      li {
        margin-bottom: 0.8rem;
        padding-left: 1.5rem;
        position: relative;

        &::before {
          content: '→';
          position: absolute;
          left: 0;
          color: #1a73e8;
        }
      }
    }
  }

  .ai-questions {
    p {
      font-weight: bold;
      margin-bottom: 1rem;
    }

    ul li {
      color: #666;
      font-style: italic;
    }
  }

  @media (max-width: 768px) {
    padding: 1rem;

    .hero {
      padding: 2rem 1rem;

      h1 {
        font-size: 2rem;
      }
    }

    .feature-grid {
      grid-template-columns: 1fr;
    }
  }
}
</style>
